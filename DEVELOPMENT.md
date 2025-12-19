# 生成AI向け 開発指示（このプロジェクト用）

この文書は、生成AI（コーディング支援）にこのリポジトリを安全に編集させるための「前提・制約・作業手順」をまとめたものです。

## ゴール

- 既存UXを壊さずに、指定された不具合修正や改善を行う
- 既存データ（localStorage）との互換性を維持する
- 3モード（択一/複数選択/単語帳）で挙動が一貫するようにする

## 絶対に守ること（制約）

- **勝手に機能を増やさない**（ページ追加/新機能/派手なアニメ等は依頼がない限り禁止）
- **既存のデザインシステムに合わせる**（`style.css` の token を使い、色/影を増やしすぎない）
- **保存形式を壊さない**（localStorageキーやデータ構造の互換を維持）
- **変更は最小限**（無関係なリファクタリング/整形/命名変更は避ける）
- **モード間の副作用を残さない**（セッション開始やモード切替で状態の混入を防ぐ）

## 実行環境

- 静的HTML/CSS + ES Modules（素のJavaScript）
- 永続化: `localStorage`
- エントリポイント: `index.html` → `src/main.js`

## ローカル起動（開発）

ES Modules を使うため、`file://` 直開きでは import がブロックされる場合があります。**ローカルサーバで起動**してください。

### VS Code Live Server

- Live Server で `index.html` を開く

### Python

```bash
cd "<repo root>"
python -m http.server 5500
```

- `http://localhost:5500/` を開く

## 起動（ローカル開発）

ES Modules を使っているため、`file://` 直開きだとブラウザによっては import がブロックされます。**ローカルサーバで開く**のを推奨します。

### Option A: VS Code Live Server

- Live Server（拡張）で `index.html` を Open with Live Server

### Option B: Python

```bash
cd "<このリポジトリのルート>"
python -m http.server 5500
```

- ブラウザで `http://localhost:5500/` を開く

## リポジトリ構成（重要ファイル）

- `index.html`: 画面（各スクリーン）と共通UIの土台
- `style.css`: 全体スタイル（テーマtokenは `:root`）
- `src/main.js`: 初期化（設定ロード→マイグレーション→データロード→モードロード→イベント結線）
- `src/events.js`: イベント集約（クリック/キー等）→ モードUIへ委譲
- `src/session.js`: セッション開始（`startQuizMode()`）
- `src/state.js`: 画面・セッション共通の状態
- `src/storage.js`: localStorage ロード/保存・マイグレーション
- `src/normalize.js`: 問題データ正規化（旧形式/欠落フィールドを吸収）
- `src/modes/*`: モード別実装
  - `engine.js`: セッション生成（出題リスト構築）
  - `ui.js`: 描画/キー/ボタン動作
  - `manage.js`: 管理画面のモード固有エディタ

## モードの仕組み（拡張ポイント）

モードは `src/modes/registry.js` に登録されています。

- `single`: 静的 import
- `multiple` / `flashcards`: dynamic import（遅延ロード）

ロード後は `state.currentModeModule` に格納され、セッション開始は `src/session.js` の `startQuizMode()` から `mode.engine.buildSession()` を優先して呼びます。

### モード実装の最小要件（目安）

- `engine.buildSession(genre, opts)` を持つ
- `ui` が `render(session)` / `onKeyDown(e, session)` / `onNext(session)` / `onDontKnow(session)`（必要に応じて）を持つ

## データ形式（内部・正規化後）

正規化後にアプリが扱う形式の目安です。

### 択一（single）

```js
{ id, q, choices: string[], answer: number, exp, tags: string[], stats:{c,t}, flagged, priorityFactor }
```

### 複数選択（multiple）

```js
{ id, q, choices: string[], correctIndexes: number[], exp, tags: string[], stats:{c,t}, flagged, priorityFactor }
```

### 単語帳（flashcards）

```js
{ id, q, front, back, exp, tags: string[], stats:{seen,known}, flagged, priorityFactor }
```

- 正規化の入口は `normalizeQuestion(raw)`（`src/normalize.js`）です。

## localStorage キー

モード別に保存領域を分けています（`src/constants.js`）。

- quizzes
  - `quizzes_single`
  - `quizzes_multiple`
  - `quizzes_flashcards`
- genre order
  - `quiz_genre_order_single_v1`
  - `quiz_genre_order_multiple_v1`
  - `quiz_genre_order_flash_v1`
- settings
  - `quiz_settings_v1`

旧キー（`quizzes` / `quiz_genre_order_v1`）がある場合は、初回起動時に single 側へコピーするマイグレーションがあります（非破壊）。

## デフォルトデータ

初回起動（またはデータ欠損時）に、モード別デフォルトが投入されます。

- `src/defaultQuizzes.js`（択一）
- `src/defaultQuizzesMultiple.js`（複数選択）
- `src/defaultFlashcards.js`（単語帳）

`DATA_VERSION` を上げる場合は、`migrateQuizzes()` と `normalizeQuestion()` の整合も確認してください。

## エクスポート/インポート

- 実装: `src/modes/single/core/manage.js`
- エクスポートは「選択中ジャンル1つ」を JSON 出力
- インポートは「選択中ジャンル」に対して置換 or 追加
- 形式が違う場合は可能な範囲で変換（例: 択一→複数選択）

## 確認モーダル（アプリ内）

ブラウザ標準ダイアログの代わりに、画面内モーダルを使うためのヘルパがあります。

- UI: `#confirmOverlay`（`index.html`）
- API: `showConfirm()`（`src/utils.js`）

※ `confirmOverlay` はスタッキングコンテキストの影響を受けない場所に置く必要があります（UI内の一部コンテナ配下に入れない）。

## 生成AIの作業手順（推奨）

1. 依頼内容を **再現条件** と **期待結果** に分解する
2. 影響範囲（モード/画面/保存）を洗い出す
3. 変更箇所を最小にして実装する
4. 変更後、次を最低限確認する
  - モード切替で状態が混ざらない
  - 新規セッション開始で結果/選択状態が残らない
  - 管理画面（検索/要チェック/一括）とモーダル表示が崩れない
  - インポート/エクスポートでデータ欠落がない

## 変更時のチェックリスト（短縮版）

- [ ] `startQuizMode()` / モード切替で `wrongQuestions` / `correctQuestions` 等が残留しない
- [ ] `normalizeQuestion()` で flashcards の `q` / `priorityFactor` 等が落ちない
- [ ] モーダル表示中に背景要素が前面に出ない（z-index/配置）
- [ ] 主要ブラウザで致命的エラーが出ない（Console）

## デバッグ

- `window.__QUIZ_STATE__` に `state` を公開しています。

## 変更時のチェックリスト

- [ ] モード切替/開始で「前の結果が混ざらない」こと（`wrongQuestions` / `correctQuestions` など）
- [ ] インポートしたデータが正規化で欠落しないこと（特に flashcards の `q` 等）
- [ ] 管理画面の検索/要チェック/一括操作が崩れていないこと

## よくある問題

- **画面が更新されない/古いCSSが残る**: 強制リロード（キャッシュ破棄）を試してください。
