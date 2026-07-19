# LevelLens DB設計書

- 版数: v1.1 (2026-07-17)
- DBMS: PostgreSQL（Vercel Postgres / Neon を想定）
- ORM: Prisma（Codex との相性が良く、スキーマ駆動で速い）
- 方針: ハッカソンスコープのため**認証なし・匿名利用**。ジョブ ID（UUID）を知っている人だけが結果にアクセスできる「URL がパスワード」方式。teachers/users テーブルは将来拡張として定義のみ記載。

---

## 0. ER 図（概要）

```
jobs 1 ──── * level_versions 1 ──── * key_phrases
  │                    │
  │                    ├──── * questions
  │                    │
  │                    └──── 1 verification_reports
  │
  └──── * job_events   (進捗ログ / Codex デモ用)
```

- `jobs` が 1 回の変換リクエスト（= 1 教材 × N レベル）に対応する集約ルート。
- レベルごとの成果物はすべて `level_versions` にぶら下がる。

---

## 1. jobs — 変換ジョブ

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | ジョブ ID。URL に露出する |
| source_text | text | NOT NULL | 原文（入力上限 8,000 字はアプリ層で検証） |
| source_title | varchar(200) | | GPT-5.6 が自動生成する教材タイトル |
| lang | varchar(2) | NOT NULL, CHECK (lang IN ('en','ja','es')) | 教材の言語（確定値） |
| lang_detected | varchar(2) | | 自動判定の生値（手動上書きの分析用） |
| status | varchar(20) | NOT NULL, default 'pending' | pending / processing / completed / partially_failed / failed |
| options | jsonb | NOT NULL, default '{}' | { questionCount, questionType, glossEnabled } |
| created_at | timestamptz | NOT NULL, default now() | |
| completed_at | timestamptz | | |

**インデックス**: `created_at`（古いジョブの掃除用）

**status の状態遷移**:
`pending → processing → completed`（全レベル成功）/ `partially_failed`（一部レベル失敗）/ `failed`（全滅）

---

## 2. level_versions — レベル別変換結果

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | uuid | PK | |
| job_id | uuid | FK → jobs.id, ON DELETE CASCADE, NOT NULL | |
| level_code | varchar(20) | NOT NULL | 'en_g2-3', 'ja_sho1-2', 'es_cefr_a2' 等（下記レベルマスタ参照） |
| level_label | varchar(50) | NOT NULL | 表示名 'Grade 2–3' 等（非正規化して保持） |
| status | varchar(20) | NOT NULL, default 'pending' | pending / converting / verifying / fact_checking / completed / failed |
| simplified_text | text | | 最終確定テキスト |
| attempt_count | integer | NOT NULL, default 0 | 検証ループの反復回数（UI で誇示する値） |
| readability_metric | varchar(30) | | 'fkgl' / 'fernandez_huerta' / 'ja_composite' |
| readability_score | numeric(6,2) | | 最終測定値 |
| target_min / target_max | numeric(6,2) | | 目標レンジ（言語×レベルのマスタから複写） |
| in_range | boolean | | レンジ内で確定したか（false = 近似達成） |
| created_at | timestamptz | NOT NULL, default now() | |

**ユニーク制約**: `(job_id, level_code)`

**設計メモ**: 反復途中の各試行スコアは保存しない（P2 で `attempt_logs` を追加可能）。`attempt_count` と最終スコアだけで UI 要件は満たせる。

---

## 3. verification_reports — 事実一致レポート

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | uuid | PK | |
| level_version_id | uuid | FK → level_versions.id, ON DELETE CASCADE, UNIQUE | 1 レベル版に 1 レポート |
| retained_count | integer | NOT NULL | 保持された事実の数 |
| simplified_count | integer | NOT NULL | 簡略化（意図的省略）の数 |
| lost_count | integer | NOT NULL | 欠落・歪みの数 |
| items | jsonb | NOT NULL | 項目別配列: [{ fact, status: 'retained'\|'simplified'\|'lost', sourceSpan, note }] |
| created_at | timestamptz | NOT NULL, default now() | |

**設計メモ**: 項目は件数が可変で検索要件もないため jsonb に格納。集計 3 カラムだけ列に出して一覧表示を高速化。

---

## 4. key_phrases — キーフレーズ

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | uuid | PK | |
| level_version_id | uuid | FK → level_versions.id, ON DELETE CASCADE, NOT NULL | |
| position | integer | NOT NULL, CHECK (position BETWEEN 1 AND 3) | 表示順 (1–3) |
| phrase | varchar(200) | NOT NULL | フレーズ本文 |
| char_start / char_end | integer | | simplified_text 内の出現位置（ハイライト用） |
| gloss | text | NOT NULL | レベル相応の解説 |

**ユニーク制約**: `(level_version_id, position)`

**設計メモ**: 位置は文字オフセットで保持。テキスト再生成時（P2 機能）はキーフレーズも再抽出する運用とし、オフセットのずれ問題を回避する。

---

## 5. questions — 確認問題

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | uuid | PK | |
| level_version_id | uuid | FK → level_versions.id, ON DELETE CASCADE, NOT NULL | |
| order_index | integer | NOT NULL | 表示順 |
| type | varchar(20) | NOT NULL | 'multiple_choice' / 'open_ended' |
| question_text | text | NOT NULL | |
| choices | jsonb | | 選択式のみ: ["A...", "B...", ...] |
| answer | text | NOT NULL | 正答（選択式は選択肢インデックス、記述式は模範解答） |
| explanation | text | | 解説 |
| key_phrase_id | uuid | FK → key_phrases.id, ON DELETE SET NULL | キーフレーズ由来の設問はここにリンク（🔑 バッジ表示用） |

**ユニーク制約**: `(level_version_id, order_index)`

---

## 6. job_events — 進捗イベントログ（P1）

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | bigserial | PK | |
| job_id | uuid | FK → jobs.id, ON DELETE CASCADE, NOT NULL | |
| level_code | varchar(20) | | NULL = ジョブ全体のイベント |
| event | varchar(50) | NOT NULL | 'convert_start', 'verify_attempt', 'verify_pass', 'fact_check_done' 等 |
| detail | jsonb | | 例: { attempt: 2, score: 3.9, feedback: "..." } |
| created_at | timestamptz | NOT NULL, default now() | |

**用途**: S2 の進捗表示を細かくする / デモ動画で「自己修正の軌跡」を見せる素材になる。ポーリング実装だけなら level_versions.status でも代替可のため P1。

---

## 7. （将来拡張・今回は実装しない）users / materials

- `users`: 教師アカウント。認証導入時に jobs.user_id を追加。
- `materials`: 教材の再利用・共有ライブラリ。jobs.source_text を正規化して移す。
- README の「Future Work」に記載し、審査の Potential Impact の材料として言及する。

---

## 8. レベルマスタ（コード内定数として定義。DB テーブルにはしない）

| level_code | 言語 | 指標 | 目標レンジ |
|---|---|---|---|
| en_g2-3 | EN | FKGL | 2.0 – 3.5 |
| en_g4-5 | EN | FKGL | 4.0 – 5.5 |
| en_g6-8 | EN | FKGL | 6.0 – 8.5 |
| en_ell_a2b1 | EN | FKGL + CEFR 語彙 | 3.0 – 5.0 |
| ja_sho1-2 | JA | 複合指標* | 1.0 – 2.5 |
| ja_sho3-4 | JA | 複合指標* | 2.6 – 4.5 |
| ja_sho5-6 | JA | 複合指標* | 4.6 – 6.5 |
| ja_jlpt_n4n3 | JA | 複合指標* | 2.0 – 3.5 |
| es_g2-3 | ES | Fernández-Huerta | 91 – 105 |
| es_g4-5 | ES | Fernández-Huerta | 70 – 90 |
| es_g6-8 | ES | Fernández-Huerta | 45 – 70 |
| es_cefr_a2b1 | ES | Fernández-Huerta | 70 – 90 |

\* JA 複合指標 = 1,026 字の教育漢字の学年分布（平均と上位 5%）+ 未配当漢字率 + 平均文長による連続値の推定学年帯。JLPT N4–N3 は専用語彙表を使わず同スケールで近似する。ES のレンジは easy/middle/hard の3フィクスチャで校正済みであり、今後は実教材の評価データで再校正する。

**マスタを DB にしない理由**: ハッカソン期間中に頻繁に調整するため、コード内定数（TypeScript の const）の方がマイグレーション不要で速い。

### Progressive S2 persistence (all languages)

`level_versions` is the source of truth for progressive rendering in EN, ES, and JA. The server persists `simplified_text` and readability fields after each verification attempt, then persists `verification_reports`, `key_phrases`, and `questions` independently. UI clients may therefore read a partial level while the job remains `processing`.

The level status progression is `pending -> converting -> verifying -> fact_checking -> key_phrases -> questions -> completed`, with `failed` available from any active stage.

### URL import citation metadata (v1.2, 2026-07-18)

Imported public articles retain minimal provenance on `jobs`:

| Column | Type | Notes |
|---|---|---|
| `source_url` | varchar(2048), nullable | Canonical final article URL after allowed redirects. |
| `source_domain` | varchar(255), nullable | Hostname shown in Result and PDF citations. |
| `source_accessed_at` | timestamptz, nullable | Import timestamp shown with the citation. |

The extracted teaching text remains in `source_text`. URL metadata is optional so pasted and sample materials keep the existing workflow.

### Per-level generated title (v1.3, 2026-07-18)

`level_versions.generated_title` is a nullable `varchar(200)` produced together with `simplified_text`. It belongs to one reading level and must never overwrite `jobs.source_title`, which remains stable source metadata.

### Anonymous ownership and retention (v1.4, 2026-07-19)

`jobs.owner_token_hash` is a nullable `varchar(64)` SHA-256 hash of a browser-local anonymous owner token. Newly created jobs must set it; the nullable shape preserves pre-existing rows during migration, and legacy rows are intentionally excluded from protected APIs.

`rate_limit_windows` stores only hashed rate-limit subjects, scope, fixed-window start, and request count. It has no relation to user content and is purged after two days. A daily protected maintenance route removes jobs older than 14 days; `onDelete: Cascade` deletes their level versions, reports, phrases, questions, and event records.
