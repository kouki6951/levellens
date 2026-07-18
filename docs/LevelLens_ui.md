# LevelLens 画面設計書

- 版数: v1.1 (2026-07-17)
- 対象: OpenAI Build Week 2026 応募プロダクト「LevelLens」
- 技術前提: Next.js (App Router) / Tailwind CSS / Vercel デプロイ
- 対応言語: 英語 (EN) / 日本語 (JA) / スペイン語 (ES)
- 優先度表記: **P0**=デモに必須 / **P1**=あると強い / **P2**=時間があれば

---

## 0. 画面遷移図

```
[S1 入力画面] --(変換実行)--> [S2 生成結果画面] --(問題へ)--> [S3 確認問題画面] --(出力へ)--> [S4 エクスポート画面]
     ^                              |  ^                            |                          |
     |                              |  |____(設問から本文へ戻る)_____|                          |
     |______________(新規作成)______|_______________________________________________________|
```

### 共通ナビゲーション

- 全画面に LevelLens ロゴを使用したヘッダーを表示する。デスクトップでは左サイドバー、モバイルではヘッダー内ナビゲーションで操作する。favicon はロゴのアイコン版を使用する。
- サイドバーの初期項目は `New material`（`/`）と `History`（`/history`）。履歴は作成日時順に最大30件のジョブを表示し、行選択で S2 に戻る。
- ヘッダーには UI 言語選択（English / Español / 日本語）を置く。既定は English とし、選択はブラウザ内に保存する。教材言語の選択や変換結果の言語とは独立した、画面ラベルのみの切替である。
- S1 の教材言語選択順は `EN → ES → JA`。この選択は自動言語判定より優先する手動上書きとする。
- 履歴ではタイトル・本文の検索、ジョブ状態フィルタ、既存の本文・教材言語・対象レベルを新規作成画面へ引き継ぐ「再利用」を提供する。これらは変換パイプラインを起動しない。

- ルーティング: `/`(S1) → `/result/[jobId]`(S2) → `/result/[jobId]/questions`(S3) → `/result/[jobId]/export`(S4)
- S2〜S4 は同一 `jobId` を共有。URL 直打ちで復元可能にする（デモ・審査員テストで重要）。

---

## S1: 入力画面 (`/`)

### 目的
教材テキストと変換条件を受け取り、変換ジョブを開始する。

### レイアウト
| 領域 | 内容 |
|---|---|
| ヘッダー | ロゴ / タグライン "One material, every reader."（仮） |
| メイン左 (60%) | 教材テキスト入力エリア |
| メイン右 (40%) | 変換条件パネル |
| フッター | 変換実行ボタン（プライマリ・大） |

### コンポーネント詳細

#### 1. 教材テキスト入力 **P0**
- `textarea`、プレースホルダに利用例文言。
- 文字数カウンタ表示。上限 8,000 字（超過時は赤字警告＋ボタン無効化）。
- 下限 200 字（短すぎるとレベル判定が不安定なため）。
- サンプル教材ボタン ×3（EN ニュース / JA 説明文 / ES 記事）**P0** — デモと審査員テストの導線として必須。

#### 2. 言語表示・切替 **P0**
- 入力テキストから自動判定（クライアント側で簡易判定 → サーバで確定）。
- 判定結果をバッジ表示（例: `🇺🇸 English detected`）。誤判定時は手動で EN / JA / ES に切替可能。

#### 3. 対象レベル選択 **P0**
- 言語に応じてプリセットが切り替わるチップ型マルチセレクト（最大 4 レベル同時）。

| 言語 | プリセット |
|---|---|
| EN | Grade 2–3 / Grade 4–5 / Grade 6–8 / ELL (CEFR A2–B1) |
| JA | 小1–2 / 小3–4 / 小5–6 / 日本語学習者 (JLPT N4–N3) |
| ES | Grado 2–3 / Grado 4–5 / Grado 6–8 / Aprendices (CEFR A2–B1) |

#### 4. オプション **P1**
- 確認問題数 (0 / 3 / 5、既定 3)
- 設問形式 (選択式 / 記述式 / 両方)
- キーフレーズ解説の有無（既定 ON）

### 状態・バリデーション
| 状態 | 挙動 |
|---|---|
| 未入力 / 文字数範囲外 | 変換ボタン無効＋理由をボタン下に表示 |
| レベル未選択 | 同上 |
| 変換実行中 | ボタンをスピナー化 → `POST /api/simplify` 成功で S2 へ遷移 |
| APIエラー | トースト表示＋入力内容は保持 |

- 200文字未満では残り必要文字数を、レベル未選択では選択を促すメッセージを表示する。
- 言語表示は自動検出結果か手動選択かを明示する。

---

## S2: 生成結果画面 (`/result/[jobId]`)

### 目的
レベル別の変換結果と、その品質保証（検証スコア / 事実一致 / キーフレーズ）を提示する。**本製品の価値が最も表れる画面。デモ動画の主役。**

### レイアウト
| 領域 | 内容 |
|---|---|
| 上部 | レベル別タブ、確認問題・PDF出力への導線 |
| メイン左 (50%) | 原文。長文でも比較できる固定高の独立スクロール領域 |
| メイン右 (50%) | 選択レベルの変換文（キーフレーズをハイライト表示）。原文と同じ高さの独立スクロール領域 |
| 下部 | 読みやすさ / 事実一致 / キーフレーズ / 問題を横並びの情報パネルとして表示 |

### コンポーネント詳細

#### 1. 進捗表示（生成中） **P0**
- ジョブ完了前はレベルごとにステップ進捗を表示: `変換中 → 検証中 (試行 n/3) → 事実照合中 → 完了`。
- 検証ループの反復回数を可視化することが差別化の見せ場（「AIが自己修正している」ことが伝わる）。
- ポーリング (2 秒間隔) で `GET /api/jobs/[id]` を取得。完了したレベルから順次表示（プログレッシブ表示）。

#### 2. 読みやすさ検証バッジ **P0**
- 表示内容: 指標名 / 測定値 / 目標レンジ / 合否 / 反復回数。
- 例: `FKGL 3.1 ✅ (target 2.5–3.5, 2 attempts)` — レンジ内=緑、最終的にレンジ外=黄（「近似達成」表記）。
- **P2**: EN/ES のみ「Estimated Lexile-style band (参考値)」を併記。ツールチップで換算表示である旨を明記。

#### 3. 事実一致レポート **P0**
- 3 分類のサマリ数: `保持 12 / 簡略化 3 / 欠落 1`。
- 項目別リストは詳細の展開時だけ表示する。欠落・変更項目は原文該当箇所と対比表示。
- 欠落が 1 件以上ある場合はパネル枠を黄色にして注意喚起。

#### 4. キーフレーズ表示 **P0**
- 本文中の 3 フレーズをマーカー風ハイライト（レベルタブごとに独立）。
- 右パネルに「① フレーズ / レベル相応の解説」をカード 3 枚で表示。
- カードクリックで本文該当箇所をスクロール＆点滅 **P1**。

#### 4a. 問題サマリ **P0**
- 下段の問題パネルでは、選択肢を A–D の個別行で表示する。スラッシュ区切りにはせず、選択式であることを内容の構造から明確にする。

#### 5. 原文比較ビュー **P0**
- 原文は常時左、選択した変換文は常時右に表示する。長文では各カラムを独立してスクロールできる。

#### 6. 部分再生成 **P2**
- 変換文の段落単位で「この段落を再生成」ボタン。

---

## S3: 確認問題画面 (`/result/[jobId]/questions`)

### 目的
レベル別の確認問題を確認・編集する。

### コンポーネント詳細
| コンポーネント | 優先度 | 内容 |
|---|---|---|
| レベル別タブ | P0 | S2 と同じタブ構造を継承 |
| 設問カード | P0 | 設問文 / 選択肢 / 正答 / 解説。キーフレーズ由来の設問には 🔑 バッジ |
| 設問の再生成 | P1 | カード単位で再生成 |
| 設問の手動編集 | P2 | インライン編集（contenteditable） |
| 設問の削除・並べ替え | P2 | ドラッグ&ドロップ |

### 設計方針
- 3 問中最低 1 問はキーフレーズを問う設問にする（機能連動を審査員に見せる）。
- 編集は P2。ハッカソンでは「生成→そのまま出力」が主線で成立する。

---

## S4: エクスポート画面 (`/result/[jobId]/export`)

### 目的
配布可能な PDF を生成・ダウンロードする。

### コンポーネント詳細
| コンポーネント | 優先度 | 内容 |
|---|---|---|
| 印刷プレビュー | P0 | A4 縦の配布プリントをレベル別に表示。同一の PDF コンポーネントをプレビューとダウンロードで共有する |
| レベル選択チェック | P0 | 出力対象レベルを選択（既定: 全レベル） |
| 一括ダウンロード | P0 | `POST /api/export` → PDF（複数レベルは 1 ファイルに連結） |
| 含める要素のトグル | P1 | キーフレーズ解説ボックス / 確認問題 / 解答ページ |
| 生徒用 / 教師用プリセット | P1 | 生徒用は解答ページなし、教師用は解答ページあり。既存のPDFオプションを切り替えるだけで再生成はしない |

### 配布 PDF のレイアウト（1 レベルあたり）
1. ヘッダー: 教材タイトル（自動生成）/ レベル表記
2. 本文（キーフレーズはマーカー地紋と下線で強調。本文内に番号は挿入しない）
3. 欄外ボックス: キーフレーズ ×3 の解説
4. 確認問題（解答は最終ページにまとめて配置）

- 生徒用・教師用とも、各レベルの先頭に名前・日付欄を表示する。
- 教師用には既に保存済みの Readability と Fact consistency の要約を表示する。追加のLLM処理は行わない。

### 実装上の品質要件

- 完了済みレベルを初期選択し、処理中・失敗レベルは選択不可とする。
- 各設問カードと質問セクションは分割しない。質問セクション全体が残り領域に入らない場合は次ページから開始し、設問だけが孤立する改ページを避ける。
- 日本語を含む PDF は Noto Sans JP を埋め込む。プレビューとダウンロードした PDF の双方で文字化けしないことを確認する。

---

## 共通仕様

- **UI 言語**: 英語（審査員向け）。**P2** で UI の JA/ES 切替。教材の対応言語と UI 言語は独立である点に注意。
- **レスポンシブ**: デスクトップ優先（教師の利用シーン＋デモ動画が PC のため）。モバイルは崩れない程度で可。
- **エラー共通**: API 失敗はトースト＋リトライボタン。ジョブが `failed` の場合は S2 に失敗レベルのみ再実行ボタンを表示。
- **アクセシビリティ**: ハイライトは色＋下線の併用（色覚多様性対応）。教育系プロダクトとして審査の Design 項目で言及する価値あり。

### S2 progressive card rendering (all languages)

- This behavior applies equally to EN, ES, and JA. It is not language-specific.
- Render the text area, readability, fact consistency, key phrases, and questions cards immediately after the job is created.
- Poll every 2 seconds. Replace each card's skeleton/loading indicator as soon as its corresponding data is persisted; do not wait for the whole level to reach `completed`.
- Persisted simplified text and deterministic readability may appear during `verifying`; fact consistency may appear during `key_phrases`; key phrases may appear during `questions`.
- The active stage remains visible in the selected level tab and text area. Terminal job states stop polling.

### S2 selected-level stability

- Selecting a level is an explicit user action. Polling updates data but never changes the selected tab.
- The page title uses the selected level's generated title; the source title and citation remain stable source metadata.
- While conversion, verification, fact checking, phrase extraction, or question generation is active, the simplified-text panel shows a visible in-progress notice with the current phase and verification attempt. Draft text can change only within this indicated processing state.
- The regeneration action belongs in the simplified-text panel header next to the selected level label.
- Full-page data retrieval states in Result, Questions, Export, and History use an animated spinner with the localized loading label rather than text alone.

### Guide page (`/guide`)

- Workspace navigation includes a Guide link, localized as `Guide` / `Guía` / `使い方`.
- The page explains the teacher workflow in eight sections: adding material, choosing levels, reviewing results, using Language focus, preparing classroom materials, returning to History, understanding quality checks, and resolving results that need attention.
- The guide follows the existing UI locale selection and does not change the teaching-material language or generated content language.

### PDF answer key readability

- The teacher-copy answer key groups answers by level and shows the question text, the letter plus full correct choice, and its explanation.
- Stored zero-based answer indices are never shown directly in the worksheet. The teacher-facing layout displays `A.` through `D.` with the full answer text.

### History reuse and controls

- `Use as new material` saves the source text, language, and selected levels to session storage and performs a home-page navigation that reliably restores the draft.
- Enabled buttons use a pointer cursor throughout the application; disabled buttons use a not-allowed cursor.

### Language focus

- The former Key phrases panel is labeled `Language focus` / `Enfoque lingüístico` / `言語のポイント` according to the UI locale.
- It highlights three exact spans in the simplified text and explains teachable grammar or sentence patterns rather than only topic vocabulary.
- Clicking an item still scrolls to and briefly highlights its matching text span. Linked questions identify language-focus usage in context.

### S1 URL article import (single URL only)

- S1 provides adjacent `Paste text` and `Import URL` modes. Pasting remains the default.
- URL mode accepts one public article URL, requires an educator rights-confirmation checkbox, and then requests a server-side preview.
- After a successful import, the extracted title, text, source domain, and access date are retained. The extracted text remains editable in the same teaching-material textarea before conversion.
- The client shows a clear error for private, inaccessible, non-HTML, paywalled, or oversized sources. Bulk URLs, PDFs, and authenticated sources are out of scope.
- Result and worksheet views show source attribution only when the material originated from an imported URL.
