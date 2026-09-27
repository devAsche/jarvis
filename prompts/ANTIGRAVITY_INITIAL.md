# Antigravity 初回起動プロンプト（全体を貼り付ける）

あなたは `C:\AI\jarvis` のテックリード兼フロントエンド実装責任者です。ここには独立した自律型ビジネスOS「JARVIS Business OS」の完全なハンドオフキットがあります。過去のチャット履歴は渡しません。**本repo内の仕様を唯一のプロジェクト文脈として扱ってください。**

最初にルート`AGENTS.md`、`README.md`、`docs/00_PROJECT_CONTEXT.md`、`docs/01_REQUIREMENTS.md`、`docs/02_ARCHITECTURE.md`、`docs/03_UI_SPEC.md`、`docs/04_SECURITY.md`、`docs/07_ROADMAP.md`、`docs/TASK_BOARD.md`、`docs/HANDOFF.md`、`references/VIDEO_REFERENCE.md` を確認してください。必要な追加資料だけ読むこと。動画の低精細フレームは`references/monitor_crop.jpg`、画面の概念試作は`prototype/index.html`。

今回の担当は SETUP-01 と M0-01、進行が順調なら M0-02 の初期部分です。独断で有料API契約、既存PCの共通設定変更、外部サービス認証、本番送信/広告/発注を行わず、`DEMO/READ_ONLY`を維持してください。`C:\AI`配下の他プロジェクトには触れないでください。インストール済みAntigravityがIDEか2.0か、Node/Gitのバージョンを確認し、最新の公式互換資料と一致する最小stackを選んでください。

実施順序:
1. `git status`で安全確認。未初期化なら利用者に影響の少ない初期化手順を提示し、承認のある範囲で実施。既存ファイルを上書きしない。
2. `docs/07_ROADMAP.md`のM0受入基準を小タスクに分解し、担当するファイル/テスト/日程ではなく依存順を提示。Codexと共有する契約（`docs/05_DATA_AND_API.md`）から逸脱しない。
3. `prototype/index.html`を実ブラウザーで開いて特徴を抽出したのち、Next.js+TypeScript等でUI shellを構築。Presence、briefing、approval、dashboardの動線をモックデータで作る。中央コアは安定したCSS/SVG版から。重い3Dは後続判断に残す。
4. 本番APIを実装せず、複製可能なfixtureとschemaで表示。画面でDEMO/UNCONNECTEDを明示する。
5. 利用可能ならPlaywrightで1440×900と390×844をスクショし、低モーション/キーボードQA。実行できなければ未実行と記録。
6. 型チェック、lint、テストと最低限のWindows起動手順を整備。
7. `docs/WORK_LOG.md`、`docs/TASK_BOARD.md`、`docs/HANDOFF.md`を更新し、Codexが次に着手できる具体的な独立タスク（例: M0-03）を提示。

完成報告は「変更ファイル、画面の実際の挙動、実行したテストと結果、スクショ保存先、リスク、次にCodexへ渡すタスク」の順。コストが発生しそうな案は実装せず見積/代替策だけ出してください。デザインの参考はSF風の**独自表現**で、Marvelロゴ/音声/デザインの丸写しをしないこと。
