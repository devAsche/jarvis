# SESSION HANDOFF / 引継ぎ（作業終了ごとに更新）

## 現在の状態

- 最終記録: 2026-09-28
- 直近完了: SETUP-01, M0-01, M0-02
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
- 作業担当/ブランチ: Antigravity / `feat/m0-ui-shell`
- 危険な接続: なし。APIキーや実データ接続0、課金0円、全操作は DEMO / READ_ONLY。

## 次に実行する1件

**M0-03 (Codex担当)**:
- ブランチ: `feat/backend-foundation` (または `feat/m0-ui-shell` から分岐)
- 内容:
  1. `src/contracts/index.ts` を基盤とした内部イベント・承認ポリシーの決定論的バリデーション logic の強化
  2. 負のテスト（二重Webhook、改ざんされた承認payload、期限切れTTL、未知プロバイダーの排除）の拡充
  3. M0-04（モックAPI route）に向けたデータハンドラの整備

## 作業引継ぎチェック

- [x] git status確認
- [x] タスクと担当ファイルの所有者宣言
- [x] 検証結果の記録（コマンド/スクショ/エラー）
- [x] TASK_BOARD変更
- [x] 重要な設計変更はADR追記 (ADR 0002)
- [x] 次の1手明示 (M0-03)

