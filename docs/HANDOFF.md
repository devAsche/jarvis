# SESSION HANDOFF / 引継ぎ（作業終了ごとに更新）

## 現在の状態

- 最終記録: 2026-10-05
- 直近完了: SETUP-01, M0-01, M0-02, M0-03, M0-04, M0-05, CR002 P1 + Slice 1（ローカルデモ範囲）
  - Git初期化（初期コミット `docs: initialize shared jarvis development kit`、ブランチ `feat/m0-ui-shell`）
  - Next.js 15 (App Router) + TypeScript + Vanilla CSS + Zod の UI shell 構築
  - Presence, Briefing (朝ブリーフ), Dashboard (実務ダッシュボード), Approval Center (承認センター) の画面動線およびローカル承認シミュレーション
  - `src/contracts/index.ts`（`docs/05_DATA_AND_API.md`準拠スキーマ）と単体テスト（6/6 pass）
  - Windows標準ローカルMicrosoft Edge（ヘッドレス）によるデスクトップ (1440x900) およびモバイル (390x844) の自動スクリーンショット撮影検証（レスポンシブ崩れ0件）
  - ADR 0002 記録、README.md 起動手順更新
- 動いている成果物:
  - `npm run dev` / `npm run start` (Next.js アプリケーション `http://localhost:3000`)
  - `prototype/index.html`（静的参考プロトタイプ）
  - `screenshots/nextjs_desktop_1440x900.png`
  - `screenshots/nextjs_mobile_390x844.png`
  - CR001: Presence中央のR3F Canvas、手動/非対応時のCSS 2D fallback、DOM字幕とMockVoiceAdapter。`/api/demo/state` と開発限定のデモ書き込みAPI。
  - Codexブラウザー証跡: `screenshots/cr001_3d_desktop_full.png`, `screenshots/cr001_3d_mobile_full.png`, `screenshots/cr001_2d_1440x900.png`, `screenshots/cr001_2d_390x844.png`, `screenshots/cr001_approval_390x844.png`。ブラウザー内のCSS viewportは1440×900、1920×1080、390×844で確認したが、PNG出力はCodexブラウザーパネルにより一部切り取られるため、画像のピクセル寸法は一致しない。
- 作業担当/ブランチ: Antigravityの未コミットCR001差分をCodexが引継ぎ / `feature/cr001-r3f-voice-foundations`。実際のGitルートは `C:\AI\jarvis\JARVIS_C_AI_Starter\jarvis`。既存変更は保全し、別worktreeなし。
- 検証: `npm run typecheck` 合格、`npm run lint` 警告0、`npm test` 20/20合格、`npm run build` 合格。実ブラウザーで中央Canvas、手動2D切替、DOM操作、モック切断/再接続、模擬承認1回、モバイル横はみ出しなしを確認。本番ビルドのPOSTデモイベントは403。
- 安全境界: 実プロバイダー切替は拒否。実APIキー/実データ接続なし、今回のコードに外部課金API呼出しなし。承認はデモ状態のみを変え、外部実行なし。請求先での課金額は未照合。
- 未検証: WebGLを無効化した実ブラウザー、`prefers-reduced-motion`の実機切替、GPU負荷、正確なピクセル寸法のスクショ、マイク許可拒否、実音声、サーバー認証付き本番承認。初期fixture時刻は固定サンプルで鮮度を意味しない。

## CR002 P1 + Slice 1 / 2026-09-28 Codex

- 実体: `C:\AI\jarvis\JARVIS_C_AI_Starter\jarvis`、branch `feature/cr001-r3f-voice-foundations`、既存の未コミットCR001差分を保全。CR002仕様は外側の `C:\AI\jarvis\JARVIS_C_AI_Starter\change-requests\JARVIS_CR002_Codex_First\change-requests\CR002`。新repo/worktreeなし。
- 中央Canvasを `calm/network/surge` に拡張。`operationalState/mode/quality/reducedMotion` を型付きで渡す。Graphics `auto/balanced/low/off`、Effect preview、Motion reduced、GPU失敗時2D fallback。左右カード、字幕、承認はDOMのまま。
- `/api/demo/runs` と共有プロセス内demo storeで、Text/Voice Mock→taskRunId→3系統の並列fixture READ・出典4件の検査→根拠ID付きbrief→模擬承認→監査イベントを接続。処理状態の固定時間送りは使わず、READ完了イベントに短いsurgeを連動。送料見積¥900/請求¥1,550、MIX 2件、予定1件。承認原本の期限をAPIルート間で共有し、ブラウザーで起きた409を修正。実注文・外部書き込み・有料音声なし。POSTは開発時のみ同一Host/Origin、production 403。
- 試験: `npm run typecheck`、`npm run lint`、`npm test` 22/22、`npm run build` 合格。CodexブラウザーでText→brief→approval→監査、Voice Mock→run ID、GPU強制失敗時Canvas 0と承認/売上DOM継続、reduced motionでCanvas 0、390 CSS viewportで横はみ出し0を確認。1440 CSS viewportでCanvas 1。スクショは `screenshots/cr002/`。画像の実ピクセル寸法はブラウザーパネル制限でviewportと一致しない。
- 残リスク: タスクと監査は単一Nodeプロセスの揮発メモリで再起動/複数worker非対応。fixture READと状態遷移はローカルdemo。WebGL無効化の実機設定、30分連続GPU/メモリ/FPS、OS側reduced-motion、実マイク、公開環境の認証と承認は未検証・未実装。請求明細で課金0円を照合していない。

## 次に実行する1件

**Claude CodeによるUI再制作のデザイン選択**: `docs/handoffs/claude-ui-rebuild-2026-10-05/README_FIRST.md`から開始し、`PROMPT_00_DESIGN.md`で監査・調査・複数案を作る。ユーザー選択前に本番UIへ反映しない。CR003/CR002独立レビューは未実施。

## CR003 Stage 0–2 / 2026-09-28 Codex

- 範囲: 監査・公式外部調査・A/B静止画面試作のみ。アプリ本体`src/`と現行ルートは編集なし。既存CR001/CR002の未コミット差分は保全。CR003の成果物はrepo外側の既存変更要求フォルダー`C:\AI\jarvis\JARVIS_C_AI_Starter\change-requests\JARVIS_CR003_Codex_Design_Package\change-requests\CR003\report`。
- 現行画面をCodex in-app browserで新規撮影: `report/screenshots/baseline_idle.png`、`baseline_approval.png`、`baseline_narrow.png`、`baseline_gpu_failure.png`。CSS viewport 1440×900でCanvas 1、390×844で横はみ出しなし、強制GPU失敗でCanvas 0かつ承認/売上DOM存続。承認dialogはEscで閉じるが、フォーカスが起点へ戻らずbodyになる。
- 公式公開サイトLinear、Raycast、Vercel Geist、Jarvis Instituteを2026-09-28に閲覧し、画面記録と根拠を`report/RESEARCH_LOG.md`へ保存。A/Bの全画面・コア部分4枚と独立HTML/SVG試作を`report/`へ保存。`DESIGN_DECISION.md`は未選択。
- 監査の要点: 最新の球は青紫（旧資料の黄橙ではない）。不透明球+同心torus、9–12px英大文字と広い字間、開発用語、サンプル売上の強い金額表示、幅390で判断が下方へ移ることが主な課題。FPS/GPU/コントラストは未測定。CR002文書の22テスト合格は今回の再試験ではない。
- 安全: 試作は操作不能で、実承認を押していない。実サービス・課金API追加なし。次の一件はユーザーの案選択。選択前の本体実装を禁止。

## CR003 再指定コア実装 / 2026-09-28 Codex

- ユーザーは折衷案の後、A Observatoryの青いコア画像を添付し「やっぱこれにもどして、キリいいとこでいい」と再指定。`CR003/report/DESIGN_DECISION.md`に最新判断を記録。既存3カラム・右の判断優先・Mock/DEMO・承認/売上DOMは維持。
- `CoreScene.tsx`を楕円の薄いR3Fトレースと少数ノードに変更し、`ObservatoryField.tsx`の青白い観測構図をCanvas上と2D fallbackで共用。Canvasは中央1個。承認待ちでも中央は青色とし、状態はFIELDラベル/本文/右カードで示す。
- 同じターンで画面文言/余白/右側優先カードを調整し、3つの既存モーダルにTab循環・Esc・フォーカス復帰を導入。API、fixture、承認ロジック、イベント契約は編集なし。先行CR001/CR002未コミット差分を保全し、commitなし。
- `npm run typecheck`、`npm run lint`、`npm test` 22/22、`npm run build`は合格。Codex in-app browserで1440×900と390×844、Canvas 1/描画オフCanvas 0、承認/売上DOM継続、390横はみ出しなし、モーダルのShift+TabとEscを確認。証跡はCR003 `report/screenshots/returned_reference_*.png`。
- GPU/FPS、WCAGコントラスト数値、全幅、OSレベルのWebGL無効・reduced motion、英語のfixture文言は残件。開発用`?gpu=fail`はbuild後のdev画面でCanvas数が変動し今回確定できず、手動描画オフとは区別する。実サービス接続・課金API・外部書込みなし。詳しくはCR003 `report/IMPLEMENTATION_LOG.md`。次の一件は独立レビュー。

## CR003 動きの復帰 / 2026-09-28 Codex

- idle/calmでR3Fが`frameloop="demand"`、前面SVGも静止していたため、青い円弧が動いていなかった。表示中はCanvas連続描画、円弧42秒/周、中心光の脈動。左右カードは8秒周期・最大3pxの浮遊に変更。
- 実ブラウザー通常URLで円弧・カードのcomputed transformの変化を確認。「動き: 抑える」ではCanvas 0・両アニメーション停止。非表示時はCanvas demand/SVG pauseのコード経路。WebGL失敗時の静止2Dと承認/売上DOMは保持。
- `npm run typecheck`、`npm run lint`、`npm test` 22/22、`npm run build`合格。証跡はCR003 `report/screenshots/motion_restored.png`、詳細は`report/IMPLEMENTATION_LOG.md`。GPU/FPS実測は残件。`?gpu=fail`は強制2Dの検証URLなので、動きを見るときは`http://127.0.0.1:3100/`を使う。buildが起動中devの`.next`に干渉してRuntime Errorを起こしたため、対象devサーバーを再起動して表示/動作を確認済み。今後は同じ出力先で同時実行しない。

## 2026-10-05 / Codex / Claude Code UI再制作資料

ユーザーは現行UIを気に入らず、Claude Codeへ一からのUI再制作を依頼する方針。Git rootは`C:\AI\jarvis\JARVIS_C_AI_Starter\jarvis`、branchは`feature/cr001-r3f-voice-foundations`、HEADは`fe3ab07`。CR001〜CR003の多数の未コミット・未追跡ファイルがある。これらは保全し、新worktreeをHEADだけから作って現在の完成版と誤認しない。

担当ファイルは`docs/handoffs/claude-ui-rebuild-2026-10-05/`の新規資料と本`HANDOFF.md`、`TASK_BOARD.md`、`WORK_LOG.md`の追記・日付更新のみ。`src/`、API、fixture、依存パッケージを編集していない。資料には製品目的、デモと承認の安全契約、監査・複数案作成、ユーザー選択後の実装、独立レビューの3プロンプトを収録。旧CR003画像と案は履歴で、今回の見た目の決定ではない。

今回は文書作成であり、アプリのlint/typecheck/test/buildと実ブラウザー操作は再実行していない。既存の22/22テスト等は2026-09-28時点の記録。次の1件はClaude Codeへ`PROMPT_00_DESIGN.md`を渡し、複数案の実画面を見てユーザーが選ぶこと。外部サービス・有料API・実業務への書込みは許可していない。

## 2026-10-05 / Codex / クラウド利用前提の訂正

ブラウザーのClaude Codeはローカル`C:\AI`を直接読めない。`git remote -v`は空欄で、現行UIと新資料は未コミット・未追跡を含む。従来の「GitルートでClaude Codeを開く」という案内はローカル実行前提だったため、`docs/handoffs/claude-ui-rebuild-2026-10-05/CLOUD_BROWSER_START.md`を追加。非公開GitHubへ共有内容を点検したスナップショットを送ってからブラウザーで始める手順と受信確認文を記録した。Gitコミット・remote設定・push・認証は実行していない。

## 2026-10-05 / Codex / GitHub送付用ブランチ

ユーザー指定の`https://github.com/devAsche/jarvis`はGitHub APIで公開状態`private=false`を確認。元の`feature/cr001-r3f-voice-foundations`は保持し、`handoff/claude-ui-rebuild-2026-10-05`を作成。秘密値の典型パターンと追加対象を点検し、`.env`等と権利未確認の外部参考画像は含めない。CR002/CR003の履歴文書と現行画面2枚を引継ぎフォルダーに複写した。`npm run typecheck`合格、`npm run lint`警告0、`npm test`22/22合格。devとの`.next`競合を避けてbuildは今回未実施。

送付用スナップショット`ef166a0`を公開GitHubの上記ブランチへpushし、GitHub APIでブランチと`README_FIRST.md`の存在を確認。生成キャッシュ`tsconfig.tsbuildinfo`だけはローカルの未コミット変更として保持し、送付対象から除外。次の一件はブラウザーのClaude Codeで`devAsche/jarvis`の上記ブランチを選び、`CLOUD_BROWSER_START.md`の開始文を貼ること。

## 作業引継ぎチェック

- [x] git status確認
- [x] タスクと担当ファイルの所有者宣言
- [x] 検証結果の記録（コマンド/スクショ/エラー）
- [x] TASK_BOARD変更
- [x] 重要な設計変更はADR追記 (ADR 0002/0003/0004)
- [x] 次の1手明示 (CR003のユーザー選択)

