# LevelLens API設計書

- 版数: v1.1 (2026-07-17)
- 実装: Next.js App Router Route Handlers (`app/api/**/route.ts`)
- 形式: JSON / UTF-8。日時は ISO 8601 (UTC)。
- 認証: なし（jobId 所持 = アクセス権）。全エンドポイントにレートリミット（IP 単位、簡易実装で可）。
- LLM: OpenAI API / GPT-5.6。呼び出しはすべてサーバ側。

---

## 0. エンドポイント一覧

| # | Method | Path | 役割 | 優先度 |
|---|---|---|---|---|
| 1 | POST | /api/detect-lang | 言語自動判定 | P0 |
| 2 | POST | /api/simplify | 変換ジョブ開始 | P0 |
| 3 | GET | /api/jobs/[id] | ジョブ状態・結果取得 | P0 |
| 3a | GET | /api/history | 直近ジョブの履歴取得 | P0 |
| 4 | POST | /api/export | 配布用 PDF 生成 | P0 |
| 5 | POST | /api/levels/[id]/regenerate | 失敗レベルの再実行 | P1 |
| 6 | POST | /api/questions/[id]/regenerate | 設問 1 件の再生成 | P1 |

**設計方針**: 事実一致チェック・キーフレーズ抽出・設問生成は**独立エンドポイントにせず、simplify ジョブのパイプライン内部ステップ**とする。理由: (a) UI がそれぞれを個別に呼ぶユースケースがない、(b) ジョブに集約した方が進捗管理と失敗リトライが単純、(c) 4 日間の実装量を削れる。概要資料の /api/verify・/api/keyphrases・/api/questions は本書でこの形に統合した（資料は次版で追随）。

---

## 1. POST /api/detect-lang

入力テキスト先頭 500 字から言語を判定する。UI の言語バッジ用。

**Request**
```json
{ "text": "The water cycle describes how water moves..." }
```

**Response 200**
```json
{ "lang": "en", "confidence": 0.98 }
```

- 実装: franc / cld3 等の軽量ライブラリ（LLM は使わない。速度と決定性のため）。
- confidence < 0.7 の場合、UI は手動選択を促す。

---

## 2. POST /api/simplify

変換ジョブを作成し、非同期パイプラインを開始する。

**Request**
```json
{
  "sourceText": "The water cycle describes how water moves...",
  "lang": "en",
  "targetLevels": ["en_g2-3", "en_g4-5", "en_ell_a2b1"],
  "options": {
    "questionCount": 3,
    "questionType": "multiple_choice",
    "glossEnabled": true
  }
}
```

**バリデーション**
| 項目 | ルール | エラーコード |
|---|---|---|
| sourceText | 200–8,000 字 | TEXT_LENGTH_INVALID |
| lang | en / ja / es | LANG_INVALID |
| targetLevels | 1–4 件、lang と整合するコードのみ | LEVELS_INVALID |
| questionCount | 0 / 3 / 5 | OPTIONS_INVALID |

**Response 202**
```json
{ "jobId": "5f0c2e...", "statusUrl": "/api/jobs/5f0c2e..." }
```

**Response 4xx**
```json
{ "error": { "code": "TEXT_LENGTH_INVALID", "message": "Text must be 200–8000 characters." } }
```

### 内部パイプライン（レベルごとに並列実行）

```
(1) 変換        GPT-5.6 に言語×レベル別のスタイル仕様プロンプトで書き換え依頼
(2) 検証        言語別スコアラーで決定的に採点（サーバ側計算、LLM 不使用）
                 └ レンジ外 → スコアと具体的修正指示を添えて (1) へ差し戻し（最大3回）
                 └ 3回でレンジ外 → in_range=false のまま続行（「近似達成」扱い。ジョブは失敗させない）
(3) 事実照合    GPT-5.6 で原文の事実リスト抽出 → 変換文と照合 → retained/simplified/lost に分類
(4) キーフレーズ GPT-5.6 で 3 フレーズ抽出＋レベル相応の解説生成。char_start/char_end を検証
                 （本文中に完全一致しない場合は再抽出、最大2回）
(5) 設問生成    questionCount > 0 の場合。キーフレーズを入力に含め、最低1問は 🔑 連動設問
(6) 確定        level_versions.status = completed
```

**実行環境の注意**: Vercel の関数タイムアウト対策として、パイプラインは `waitUntil` / バックグラウンド関数（もしくは Inngest 等）で実行し、simplify 自体は即 202 を返す。1 レベルあたり想定 20–60 秒。

**LLM 呼び出し設計**
- (1)(3)(4)(5) は Structured Outputs (JSON Schema) で受け、パース失敗によるリトライを排除する。選択式の設問はスキーマで問題数と選択肢数を固定し、常に4択にする。
- (2) の採点は EN が `text-readability` による FKGL、ES が純粋関数の Fernández-Huerta、JA が教育漢字・文長ベースの複合指標。**LLM に自己採点させない**（検証の独立性が製品の核）。
- 修正指示の例: `"Current FKGL is 3.9 (target 2.5–3.5). Shorten sentences (avg ≤ 10 words) and replace multi-syllable words: 'evaporation' → 'turns into vapor'..."` のように、測定値から機械生成した具体的指示を与える。

---

## 3. GET /api/jobs/[id]

ジョブの進捗と結果を返す。UI は 2 秒間隔でポーリング。

**Response 200（処理中の例）**
```json
{
  "jobId": "5f0c2e...",
  "status": "processing",
  "sourceTitle": "The Water Cycle",
  "lang": "en",
  "levels": [
    {
      "levelCode": "en_g2-3",
      "levelLabel": "Grade 2–3",
      "status": "verifying",
      "progress": { "step": "verify", "attempt": 2, "maxAttempts": 3 }
    },
    {
      "levelCode": "en_g4-5",
      "levelLabel": "Grade 4–5",
      "status": "completed",
      "result": {
        "simplifiedText": "Water moves around our planet all the time...",
        "readability": {
          "metric": "fkgl",
          "score": 4.6,
          "targetMin": 4.0,
          "targetMax": 5.5,
          "inRange": true,
          "attemptCount": 1,
          "estimatedLexileBand": "740L–940L"
        },
        "factCheck": {
          "retained": 12, "simplified": 3, "lost": 0,
          "items": [
            { "fact": "Evaporation is driven by heat from the sun",
              "status": "simplified",
              "note": "Expressed as 'the sun warms the water'" }
          ]
        },
        "keyPhrases": [
          { "position": 1, "phrase": "water vapor",
            "charStart": 128, "charEnd": 139,
            "gloss": "Water that has turned into a gas you cannot see." }
        ],
        "questions": [
          { "id": "q1...", "orderIndex": 1, "type": "multiple_choice",
            "questionText": "What makes water turn into vapor?",
            "choices": ["The wind", "The sun's heat", "The moon", "The rain"],
            "answer": "1", "explanation": "...",
            "keyPhraseId": "kp1..." }
        ]
      }
    }
  ]
}
```

## 3a. GET /api/history

履歴画面用に直近30件のジョブを作成日時降順で返す。認証なしのハッカソンスコープでは、ローカルおよびデモ用の履歴として扱う。

**Response 200**
```json
[{ "id": "...", "sourceTitle": "The Water Cycle", "lang": "en", "status": "completed", "createdAt": "...", "completedLevels": 2, "levelCount": 2, "levelCodes": ["en_g2-3", "en_g4-5"] }]
```

- `estimatedLexileBand` は EN/ES かつ P2 実装時のみ含める（換算表による参考値。null 許容）。
- ステータス: ジョブ = pending / processing / completed / partially_failed / failed。レベル = pending / converting / verifying / fact_checking / completed / failed。

**Response 404**
```json
{ "error": { "code": "JOB_NOT_FOUND", "message": "Job not found." } }
```

---

## 4. POST /api/export

配布用 PDF を生成して返す。

**Request**
```json
{
  "jobId": "5f0c2e...",
  "levelCodes": ["en_g2-3", "en_g4-5"],
  "include": { "keyPhraseBox": true, "questions": true, "answerPage": true, "teacherSummary": true },
  "locale": "en"
}
```

**Response 200**: `Content-Type: application/pdf`（`Content-Disposition: attachment; filename="LevelLens_TheWaterCycle.pdf"`）

- 実装: `@react-pdf/renderer`。Vercel のサーバレス環境で Chromium バイナリを必要とせず、React の同一コンポーネントを S4 のプレビューとダウンロード生成に共有できるため採用する。JA フォントは Noto Sans JP を埋め込む。
- 複数レベルは 1 PDF に連結。解答ページは末尾にまとめる。
- 未完了レベルを指定した場合: `409 LEVEL_NOT_READY`。
- `locale` は PDF 内の固定ラベル（名前・日付・キーフレーズ・問題・解答・品質要約）に適用する。教材本文の言語とは独立する。

---

## 5. POST /api/levels/[id]/regenerate（P1）

失敗した、またはレンジ外で確定したレベル版を再実行する。パイプライン (1)–(6) を該当レベルのみ再走。

**Response 202**
```json
{ "levelVersionId": "...", "status": "converting" }
```

- 再生成可能なのは `failed`、または `completed` かつ `inRange=false` のレベルのみ。開始時に既存の事実照合・キーフレーズ・設問を削除し、同じ level_version に新しいパイプライン結果を保存する。

---

## 6. POST /api/questions/[id]/regenerate（P1）

設問 1 件を同条件で再生成して置き換える。

**Response 200**: 同じ id と表示順を維持して置換された question オブジェクト。関連するキーフレーズがある場合は再生成時にも入力へ渡す。

---

## 7. 共通エラー仕様

| HTTP | code | 発生場面 |
|---|---|---|
| 400 | *_INVALID | バリデーション失敗 |
| 404 | JOB_NOT_FOUND / LEVEL_NOT_FOUND | 不正 ID |
| 409 | LEVEL_NOT_READY | 未完了レベルのエクスポート |
| 429 | RATE_LIMITED | レートリミット |
| 500 | INTERNAL_ERROR | 予期しない失敗 |
| 502 | LLM_ERROR | OpenAI API エラー（リトライ 2 回後） |

- LLM 呼び出しは指数バックオフで 2 回リトライ。それでも失敗したレベルは status=failed とし、**他レベルは道連れにしない**（partially_failed）。

---

## 8. 環境変数

| 変数 | 用途 |
|---|---|
| OPENAI_API_KEY | GPT-5.6 呼び出し |
| DATABASE_URL | Postgres 接続 |
| MAX_VERIFY_ATTEMPTS | 検証ループ上限（既定 3） |
| OPENAI_TIMEOUT_MS | One OpenAI request timeout in milliseconds (default 45000) |

### Progressive result contract (all languages)

`GET /api/jobs/[id]` always returns a `result` object for every level, including levels that are still processing. Fields become available independently as the pipeline persists them:

- `simplifiedText` is `null` until the first deterministic verification result is saved.
- `readability.score` is `null` until a score is saved; target values and attempt count are returned throughout processing.
- `factCheck` is `null` until fact checking is complete; `keyPhrases` and `questions` are empty arrays until their respective steps complete.
- Level status values also include `key_phrases` and `questions` after `fact_checking`.

Clients must render partial results and loading placeholders per card for EN, ES, and JA rather than waiting for a whole level to complete.
