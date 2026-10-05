# UI再制作 実装記録（案D 蒼 / 2026-10-05）

## 撮影条件
headless Chromium 1194（`--use-angle=swiftshader`、ソフトウェアWebGL）、`next dev -p 3100`、Asia/Tokyoの実時刻。デスクトップ1440×900、スマホ390×844。`*_full.png`はドックを静的にした全体図。

| ファイル | 状態 | Canvas数 | 横はみ出し |
| --- | --- | --- | --- |
| app_idle_desktop / app_idle_390(_full) | 待機（蒼） | 1 | なし |
| app_review_desktop / app_review_390(_full) | 朝の報告→承認待ち（琥珀） | 1 | なし |
| app_unknown_command_desktop | 未対応の指示 | 1 | なし |
| app_evidence_modal_desktop | 根拠モーダル（Escで「根拠を見る」へフォーカス復帰） | 1 | なし |
| app_recorded_desktop / app_recorded_390 | 模擬承認後（翠） | 1 | なし |
| app_gpu_fail_desktop | `?gpu=fail`（2D） | 0 | なし |
| app_reduced_motion_desktop | prefers-reduced-motion（2D） | 0 | なし |
| app_graphics_off_desktop | 表示設定→描画オフ（2D） | 0 | なし |

同じ承認IDへの再POSTは409。照合中（紫）の画面はrunが数ミリ秒で承認待ちへ進むため実画面では撮影できず、試作の`screenshots/hud_core_running.png`で確認。エラー（紅）は実runでは再現手段がなく未撮影。

## 検証
`npm run typecheck`合格、`npm run lint`警告0、`npm test` 24/24（追加2件: `tests/core-tone.test.mjs`）、`npm run build`合格（devを止めてから実行）。

## 試作とのズレ
- 日付・時刻は固定値でなく実時刻。予定の印はfixtureの予定日（9/29）にだけ付くため、10月のルーラーには表示されない。
- 期限は`initialApprovals`の`Date.now()+24h`。SSRでは表示せずクライアントで描く。
- スマホの最初の画面ではコアと状態が先に見え、判断パネルはスクロール先（ドックの「承認」で移動）。
- 照合中の紫は実runでは一瞬しか見えない。

## 未確認
実GPUでのFPS・発熱、Windows実機のフォント表示、実スマホ、コントラスト数値、スクリーンリーダーでの通し操作。
