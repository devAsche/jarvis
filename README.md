# JARVIS Business OS — Antigravity × Codex 共通開発キット

> 更新基準日: 2026-09-28 / 対象: Windows `C:\AI\jarvis` / v0.1 = 読み取り専用・デモ優先
> **これは仕様・引継ぎ・プロトタイプのキットであり、完成済みの本番サービスではない。**

## 1分で把握する

作るものは「声で話せるチャットボット」ではなく、EC・MIX/クリエイター業務・秘書業務の状況を統合し、朝に重要事項を報告し、適切な作業を準備し、権限内なら実行する自律型ビジネスOS。映像の近未来的な大型モニターUIを参考に、**美しい待機画面 / 実務ダッシュボード / 承認センター**を切り替える。外部送信・購入・返金・広告支出等には独立した承認ゲートを置く。最初は実データを接続せず、完全なモックで縦の一連の動線を完成させる。

## 配置先と開き方

ZIPの `jarvis` フォルダーを **`C:\AI\jarvis`** に置く。既に同名フォルダーがある場合は上書きしないで中身とGitの状態を確認する。`C:\AI` 直下には他のプロジェクトも置けるため、`jarvis` を独立したGitリポジトリにする。AntigravityとCodexの両方で**同じ** `C:\AI\jarvis` を開く。**両者が同じファイルを同時編集しない。** 並列化する場合は別Git worktreeを使う。

1. `docs/00_PROJECT_CONTEXT.md` → `docs/01_REQUIREMENTS.md` → `docs/02_ARCHITECTURE.md` → `docs/03_UI_SPEC.md` → `docs/04_SECURITY.md` → `docs/07_ROADMAP.md` を読む。
2. プロジェクトの常時指示は共通の `AGENTS.md`。両環境が読める形式と、Antigravity用の追加 `.agents/rules` / `.agents/skills` を同梱。
3. まず `prototype/index.html` をブラウザーで開く。**すべてデモ表示**であり、画面上の数字・ログ・会話は実際の注文ではない。
4. Antigravityには `prompts/ANTIGRAVITY_INITIAL.md` の全文を渡す。別のタイミングでCodexには `prompts/CODEX_INITIAL.md` を渡す。
5. 開発セッションの開始・終了で `docs/WORK_LOG.md`、`docs/TASK_BOARD.md`、`docs/HANDOFF.md` を更新する。初期の「既完了」はこの引継ぎ資料と静的UIのみ。

### Windows PowerShell

```powershell
# ZIPの展開場所は実際の保存先に合わせて変更
New-Item -ItemType Directory -Force C:\AI | Out-Null
Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\JARVIS_C_AI_Starter.zip" -DestinationPath 'C:\AI' -Force
Set-Location C:\AI\jarvis
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\bootstrap.ps1
# 手動で確認後のみ Git 初期化（既存 .git があれば再初期化しない）:
git init
git add .
git commit -m "docs: initialize shared jarvis development kit"
```

`git` のユーザー設定が未完了ならコミット前に名前とメールを設定する。コマンド実行やGitコミットは**あなたのPCで行う**。このZIP自体はPCを変更しない。

### 推奨: 並行開発の隔離

```powershell
# 最初のgit commit後に実行
cd C:\AI\jarvis
git worktree add C:\AI\jarvis-codex -b feat/backend-foundation
# Antigravity = C:\AI\jarvis（UI側）
# Codex = C:\AI\jarvis-codex（API側）
# 結合は変更をレビューしてから git merge / cherry-pick
```

初日は同時稼働させず、AntigravityでM1の画面・API契約を完成 → Codexに別ブランチで検証と基盤開発を任せる順序が安全。

### 実データ（Shopify読み取り専用）で使う

`docs/13_SHOPIFY_SETUP.md` の手順で `.env.local` を作り、`JARVIS_MODE=READ_ONLY` にして `npm run build && npm run start`。ブラウザーでオーナーのパスワードでログインし「朝の報告」を押す。何も設定しなければ従来どおりDEMOで起動する。

### ローカル起動・検証コマンド (M0/M1)

```powershell
# 依存関係のインストール（初回のみ）
npm install

# 開発サーバー起動（http://localhost:3000）
npm run dev

# 型チェック（TypeScript）
npm run typecheck

# 契約・スキーマの単体テスト
npm run test

# 静的コード解析 (ESLint)
npm run lint

# 本番ビルド検証
npm run build

# WindowsローカルEdgeを用いた自動スクリーンショット取得（1440x900 & 390x844）
npm run qa:screenshots
```

## 収録ドキュメント案内

| ファイル | 役割 |
| --- | --- |
| `AGENTS.md` | **共通の最上位開発ルール**（二重メンテ禁止） |
| `docs/00_PROJECT_CONTEXT.md` | 本人の意図、ビジネス背景、動画の本質、実行制約 |
| `docs/01_REQUIREMENTS.md` | 優先度・利用シナリオ・非目標・受入条件 |
| `docs/02_ARCHITECTURE.md` | システム構成、イベント、オーケストレーション、機能境界 |
| `docs/03_UI_SPEC.md` | 近未来UI、各画面、状態、演出、画質・操作性条件 |
| `docs/04_SECURITY.md` | 操作権限、承認、監査、顧客情報、プロンプトインジェクション対策 |
| `docs/05_DATA_AND_API.md` | 主なDBエンティティ、API、イベント構造 |
| `docs/06_INTEGRATIONS.md` | Shopify・Google・TickTick・音声・SNS等の接続計画 |
| `docs/07_ROADMAP.md` | M0〜M4の工程、受入条件・中止条件 |
| `docs/08_COLLABORATION.md` | Git/worktree、担当分割、作業報告とQA |
| `docs/09_COST_AND_DEPLOY.md` | 既存契約優先、API費、ローカル/クラウド設計 |
| `docs/10_TEST_PLAN.md` | モック/E2E/負荷/セキュリティ試験 |
| `docs/11_EVIDENCE_AND_UNKNOWN.md` | 確認済・設計判断・未確認・参照先 |
| `docs/adr/0001-core-decisions.md` | 変更履歴の起点 |
| `prompts/*.md` | 両環境に貼る起動・レビュー・再開プロンプト |
| `.agents/skills/*` | 再利用可能なビジュアルQAと安全なAPI接続手順 |
| `prototype/index.html` | ブラウザーだけで動くビジュアル概念実証 |
| `config/design-tokens.json` | 色、表示モード、状態、レスポンシブの共通デザイントークン |
| `references/monitor_crop.jpg` | 添付Reelsから抽出した上部モニターの**低精細・ローカルのみの参考画像**。`.gitignore`対象のため別worktreeでは共有されない |
| `references/prototype_desktop.png`, `prototype_mobile.png` | 本キット自作のデスクトップ/スマホモック基準画像。Git共有可能 |

## 初回の到達目標

ローカルで①SF風メイン画面 ②モック朝の報告 ③ダッシュボード ④承認センター ⑤リアルタイム風のイベント履歴が、キーボード・スマホ幅・低モーション設定を含め動く。M1達成まで本番の支払い・メール送信・発注・広告APIは接続しない。

公式仕様確認先: Antigravity `https://antigravity.google/docs/rules/`, `https://antigravity.google/docs/skills`, Codex `https://developers.openai.com/codex/guides/agents-md`。仕様更新があれば、実装時に公式資料を再確認すること。
