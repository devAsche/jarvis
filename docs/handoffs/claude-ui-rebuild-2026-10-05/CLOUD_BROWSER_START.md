# ブラウザーのClaude Codeへ渡す前に

2026-10-05の引継ぎ作成時点: Gitルートは`C:\AI\jarvis\JARVIS_C_AI_Starter\jarvis`。`git remote -v`は空欄で、branch `feature/cr001-r3f-voice-foundations`のHEAD `fe3ab07`だけでは現在のアプリを再現できなかった。CR001〜CR003の実装やこの資料は未コミット・未追跡ファイルを多く含んでいた。その後、ユーザーは送付先`https://github.com/devAsche/jarvis`を指定して公開リポジトリに変更した。2026-10-05にGitHub APIで`private=false`を確認した。

Anthropicの[クラウドセッション公式説明](https://code.claude.com/docs/en/claude-code-on-the-web)によると、ブラウザーのクラウドセッションはクラウド上で実行され、接続したGitHubリポジトリをcloneする。ローカルの`C:\AI`は見えない。ローカルCLIの`claude --cloud`にはGitHubなしのbundle送信機能があるが、これは**ブラウザーだけで新規セッションを始める手順とは別**。そのbundleも未追跡ファイルは含まず、送るには`git add`が必要とされる。

## ブラウザーだけで始める手順

1. このGitルートで共有対象を点検する。`git status --short`、`git diff`、未追跡ファイル、`.gitignore`を確認。秘密値、個人情報、ローカル専用画像を送らない。`.env`等はGitに追加しない。認証情報をClaudeのプロンプトへ貼らない。
2. 現行UI・デモAPI・テスト・`AGENTS.md`・`docs/`・この引継ぎ資料を**同じスナップショット**に入れる。まずローカルの保全用ブランチとコミットを作り、そのコミットに必要な未追跡ファイルまで含まれていることを確認する。元の作業ツリーと履歴は消さない。`git reset --hard`、`git clean`、安易なstashを使わない。
3. ユーザー指定の`https://github.com/devAsche/jarvis`へ上記スナップショットをpushする。このリポジトリは公開状態なので、送付するコード、文書、画像は誰でも見られる。秘密値・個人情報・ローカル専用素材を含めない。
4. `claude.ai/code`で該当GitHubリポジトリとブランチを選び、下の開始文を貼る。最初にClaude Codeへ`git log -1`、`git status --short`、本資料とアプリの存在を読み上げさせ、**現行コードが届いたことを確認してから**デザイン案作成を進める。

## ブラウザーへ貼る開始文

> このリポジトリは既存JARVIS Business OSの現行スナップショットです。最初にGitルート、branch/HEAD、`git status --short`、`AGENTS.md`、`docs/handoffs/claude-ui-rebuild-2026-10-05/README_FIRST.md`を確認してください。`src/app/page.tsx`、`src/app/api/demo/runs/route.ts`、`src/components/presence/Core3DViewport.tsx`、`docs/handoffs/claude-ui-rebuild-2026-10-05/PROMPT_00_DESIGN.md`の存在と内容を確認できなければ停止し、不足ファイルを列挙してください。確認できたら`PROMPT_00_DESIGN.md`をこの依頼として実行し、複数の新しい画面案とキャプチャを提示して、私の選択を待ってください。旧UIや旧A/B案をデザインの正解として固定しないでください。外部サービス接続、課金、公開、実業務への書込みはしないでください。

## 別の方法

ローカルでClaude Code CLIを使える場合、公式文書の`claude --cloud`はremoteのないリポジトリをbundleとして送れる。ただし未追跡ファイルはそのままでは含まれず、送信対象の点検と`git add`が必要。今回ユーザーが想定する**ブラウザーだけの開始**には、上のユーザー指定GitHubリポジトリを使う。
