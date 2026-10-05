# Claude CodeへのUI再制作引継ぎ

更新日: 2026-10-05（Asia/Tokyo）
開始場所: `C:\AI\jarvis\JARVIS_C_AI_Starter\jarvis`

## クラウドのClaude Codeを使う場合

**ブラウザーのクラウドセッションは、このWindows PCの`C:\AI\...`を直接読めない。** 2026-10-05の引継ぎ作成時点、このGitにはremote設定がなく、CR001〜CR003の実装と本資料の多くが未コミット・未追跡だった。ブラウザーでセッションを開いてパスを貼るだけでは現行アプリを渡せない。最初に[CLOUD_BROWSER_START.md](CLOUD_BROWSER_START.md)を読み、共有するコードの内容と送付先を確認する。送付先はユーザー指定の`https://github.com/devAsche/jarvis`。ユーザーが公開リポジトリに変更したことを確認済みで、送付するファイルは公開される。

## コードがClaude Codeから読める状態になったら

接続したClaude Codeに[CLOUD_BROWSER_START.md](CLOUD_BROWSER_START.md)の開始文を貼り、[PROMPT_00_DESIGN.md](PROMPT_00_DESIGN.md)を読ませる。デザイン案をユーザーが選んだ後に[PROMPT_01_IMPLEMENT.md](PROMPT_01_IMPLEMENT.md)を渡す。実装後、可能なら別のセッションに[PROMPT_02_REVIEW.md](PROMPT_02_REVIEW.md)を渡す。

| 資料 | 用途 |
| --- | --- |
| [CLOUD_BROWSER_START.md](CLOUD_BROWSER_START.md) | ブラウザーのクラウドセッションへ現行コードを渡す前提と開始文 |
| [PROJECT_BRIEF.md](PROJECT_BRIEF.md) | 新しいUIの目的、現行の不満、デザインの自由度 |
| [CONTRACTS_AND_ACCEPTANCE.md](CONTRACTS_AND_ACCEPTANCE.md) | 残す動作、安全境界、受入チェック |
| [PROMPT_00_DESIGN.md](PROMPT_00_DESIGN.md) | 現状監査、参考調査、複数の画面案。選択待ちで停止 |
| [DESIGN_SELECTION.md](DESIGN_SELECTION.md) | ユーザーの選択を記録する欄 |
| [PROMPT_01_IMPLEMENT.md](PROMPT_01_IMPLEMENT.md) | 選択された案を既存アプリへ実装 |
| [PROMPT_02_REVIEW.md](PROMPT_02_REVIEW.md) | 実装から独立した品質・安全性レビュー |

## 重要な現状

- `git rev-parse --show-toplevel`の確認結果は上記`jarvis`。2026-10-05時点のbranchは`feature/cr001-r3f-voice-foundations`、HEADは`fe3ab07`。
- CR001〜CR003の動作するコードは**大量の未コミット変更と未追跡ファイル**に含まれる。HEADだけのworktreeは現状を再現しない。Claude Codeは開始時に`git status`と未追跡ファイルを確認し、`reset/clean/stash`で消さないこと。
- このパッケージ作成ではアプリの`src/`、API、fixture、依存パッケージを編集していない。現在の画面が気に入らないというユーザーの判断が新しい基準。旧CR003のA/Bや青いコアは採用義務なし。
- 既存3カラムは再設計してよい。業務操作、状態の真実性、承認の安全境界、スマホ可読性は残す。

## 関連する既存資料

- 必読: `AGENTS.md`, `docs/00_PROJECT_CONTEXT.md`, `docs/01_REQUIREMENTS.md`, `docs/HANDOFF.md`, `docs/TASK_BOARD.md`, `docs/04_SECURITY.md`, `docs/05_DATA_AND_API.md`。
- 実装の一次資料: `src/app/page.tsx`, `src/contracts/index.ts`, `src/fixtures/index.ts`, `src/lib/demoStore.ts`, `src/lib/demoSafety.ts`, `src/lib/voice/`, `src/app/api/demo/`, `tests/`。仕様書より実装が進んだ箇所はコードとテストを優先し、差を記録する。
- 旧デザインと状態の履歴: [historical/](historical/)にCR002状態、CR003監査・調査・判断・実装ログ、当時の画面2枚を複写した。これはクラウドから元の`../change-requests/`を読めないためのスナップショット。権利を確認していない外部参考画像は公開リポジトリへ複写していない。スクリーンショットは**現状把握と比較**用で、以前のユーザー選択は今回のUI再制作ではデザイン確定を意味しない。
- CR002 P1 + Slice 1はローカルデモ範囲で実装済み。本番接続の証拠ではない。

## 今回の権限

この資料はClaude Codeに作業を依頼するための引継ぎ。外部サービスへの接続、課金、公開、実注文・メール・広告操作、承認の自己実行を許可しない。大幅なスタック変更はADRとユーザー承認を先に求める。
