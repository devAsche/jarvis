# 11 — ソース・裏付け・未確定事項

## 一次資料 / 参照

- 利用者が提供したReels画面録画から抜いた`references/monitor_crop.jpg`。目視で確認できるのは暗青背景、中央青発光、同心円レーダー風UI、周辺の情報密度、下段の作業モニター。細部の文字/テクノロジーは読み取れない。
- Google Antigravity 公式 Rules: https://antigravity.google/docs/rules/ （`AGENTS.md`, `.agents/rules`）
- Google Antigravity 公式 Skills: https://antigravity.google/docs/skills (`.agents/skills/<name>/SKILL.md`)
- Google Antigravity 公式 Projects/worktrees: https://antigravity.google/docs/projects
- OpenAI Codex 公式 AGENTS.md: https://developers.openai.com/codex/guides/agents-md
- Shopify Webhook公式仕様: https://shopify.dev/docs/api/admin-graphql/latest/objects/WebhookSubscription

リンクは調査時の参考であり、実装時のAPI/料金/インストール済みバージョンを保証しない。手元の環境で再検証する。

## 直接確認された要望

- 近未来的なUI、声で仕事を報告する体験、可能な範囲の自律業務、Antigravity × Codexの共同開発、`C:\AI`共通開発ルート、事業に接続する意図。
- ECは米国向けペットの抜け毛掃除を中心、MIX/動画編集、歌い手としての活動、スケジュールとタスク管理。新規課金を避け、無理に完全自動化しない方針。

## 設計仮説（利用者による最終承認待ちでも、モック開発を進められる範囲）

- `C:\AI\jarvis` をリポジトリとする。作業名JARVIS Business OSは社内用仮称。UIパレットやコンポーネント配置は映像からの独自解釈。
- Windows 1人利用、Asia/Tokyoを初期TZ、英語APIと日本語UI/音声が中心。日本語・英語切替は後日。
- Next.js/TypeScript + PostgreSQL、最初にブラウザーTTSとCSSコア、安定後3D/WebGPUを検討。

## 未確認（推測として処理しない）

- 現在のAntigravity IDE / 2.0の実インストール種別・バージョン、CodexのCLI/デスクトップ構成、Node/Gitの状態。
- Shopify店舗の実際の稼働状況、製品販売許諾、注文数/粗利、OAuth認証方式や実サービスの接続有無。
- ユーザーが持つGmail/Calendar/TickTickの実データ、どのカレンダーを同期するか。ChatGPT内のコネクタ利用は自作アプリ接続を意味しない。
- マルチモニター数/解像度/GPUの実測と、電話発信サービス利用の同意。
- 毎朝9:30は**動画内の例**。実際の報告時刻はユーザー指定があるまで固定通知しない。
- Reels中に見えるデスクトップの下3画面に実際に使われていたアプリの種類と、JARVIS実装の自律性の程度。

未確認でもM1に不要なものは質問せずモックで前進し、外部接続・支払が必要になる時点で人間に確認する。
