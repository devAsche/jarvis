# CR003 実装記録 — 2026-09-28

## 現在の区切り

ユーザーの再指定に従い、中央コアをA Observatoryの青白い観測表示へ戻した。Git rootは `C:\AI\jarvis\JARVIS_C_AI_Starter\jarvis`、branch `feature/cr001-r3f-voice-foundations`、開始時HEAD `fe3ab07`。CR001/CR002からの未コミット差分は破棄せず、commitもしていない。新規repo/worktree・外部API・有料音声は作成/接続していない。

## 実装した差分

- `src/components/presence/CoreScene.tsx`: 角張った破片のコアを薄い楕円トレース、複数深度、少数の光点に変更。既存の`mode/quality/operationalState` propsとCanvasの境界を維持。
- `src/components/presence/ObservatoryField.tsx`、`Core2DFallback.tsx`、`Core3DViewport.tsx`、`src/app/globals.css`: A試作の青い観測構図を小さなSVGオーバーレイとして共用し、WebGL失敗/描画オフでも同じ見た目を提供。承認待ちは文字と右カードで示し、中央は青色を保つ。
- 同じターンで、`page.tsx`、`Header/LeftSidebar/RightSidebar/CommandBar/VoiceControls`と3つの既存modalを差分更新。3カラム、右の判断優先、サンプル出典、金額の読みやすさ、モーダルのTab循環/Esc/フォーカス復帰を改善。共通処理は`src/lib/useDialogFocus.ts`。既存API/fixture/承認判定/イベント契約は編集していない。
- 初期の折衷案の画像`chosen_*.png`は途中記録として保管。最終指定の画面は`screenshots/returned_reference_1440.png`、`returned_reference_2d_1440.png`、`returned_reference_390.png`。

## 検証

- `npm run typecheck`: 合格。
- `npm run lint`: エラー/警告0。Next.js 15の`next lint`廃止予定メッセージのみ。
- `npm test`: 22/22合格。デモ出典、重複/順不同、承認重複/改ざん、音声状態の既存テストを含む。
- `npm run build`: 合格。Next.js 15.5.26。トップのFirst Load JS表示は134 kB。
- Codex in-app browser、Windows、CSS viewport 1440×900と390×844: 1440でCanvas 1、描画オフでCanvas 0/観測SVG 1、承認カードとサンプル売上DOM存続。390で`scrollWidth=375`、`innerWidth=390`（横はみ出しなし）。保存PNGはスクロールバーを除く幅1425/375px。承認モーダルのShift+Tab循環、Escで閉じる、起点ボタンへのフォーカス復帰を実測。

## 未完了・独立レビューへ

ユーザー指定の区切りで停止するため、2560pxなど全組合せ、WCAGコントラストの数値計測、FPS/GPU/30分耐久、OS設定によるWebGL無効化/reduced motionは未実施。開発用`?gpu=fail`は本番buildを同じ作業中に実行した後のdev画面でCanvas数が0→1と変わり、今回の強制失敗QAとしては確定できなかった。手動`描画: オフ`の2D確認とは区別する。朝の報告内の英語fixture文言と中央の`Fixture READ`表示は残る。デモ状態はNode単一プロセスの揮発メモリであり、画面証跡はデモタスク`awaiting_approval`時点。実売上・実発注・外部書込みはない。

次の一件: 別のCodexレビューで上記未計測項目と日本語copyを確認し、問題があれば小差分だけ修正する。P3、Cloud、Shopify実接続、課金音声には進まない。

## 追記: コアの回転とカードの浮遊 / 2026-09-28

ユーザーから「中央コアと青白い円弧が動かない」「各セクションも多少浮遊」と指摘。原因はidle/calm時のR3F `frameloop="demand"`と、前面SVGの静止。表示中はR3Fを連続描画し、前面の円弧を42秒で一周させ、中心光をゆっくり脈動させた。左右の業務カードは8秒周期で最大3pxだけ上下し、hover/focus中は一時停止。非表示タブではCanvasをdemand、SVG回転をpauseにする。手動の「動き: 抑える」とOSのreduced motionではアニメーションを止める。

実ブラウザーの通常URL `http://127.0.0.1:3100/` でCanvas 1、円弧のCSS transformが時間とともに変化、カードtransformが変化することを確認。「動き: 抑える」でCanvas 0・2D fallback 1・円弧/カードのanimation-nameが両方none。証跡: `screenshots/motion_restored.png`。この確認は実際のidleではなく、前回のデモタスクが残るawaiting_approval状態で行った。GPU/FPSの長時間計測は未実施。

再試験: `npm run typecheck`合格、`npm run lint`警告0、`npm test` 22/22、`npm run build`合格。既存API、fixture、承認判定、イベント契約には変更なし。ユーザーの環境に残っていた`?gpu=fail` URLは強制2D静止表示の検証用。今回のブラウザー一覧には該当タブがなく、通常URLの確認用タブを残した。

ビルドを起動中のNext devと同じ`.next`へ実行したため、再読込で`Cannot find module './611.js'`の一時的なRuntime Errorが発生。対象の3100番ポートのNode開発サーバーだけを停止・再起動して復旧し、通常URLでCanvas 1と両アニメーションを再確認した。今後はdevとbuildを同時に同じ出力先で動かさない。
