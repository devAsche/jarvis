# ADR 0005: UI再制作 — SF HUD（蒼）と状態色コア

## ステータス
Accepted（2026-10-05、ユーザー選択: `docs/handoffs/claude-ui-rebuild-2026-10-05/DESIGN_SELECTION.md`）

## コンテキスト
ユーザーは旧3カラムUIを気に入らず、参考画像（青いHUD調）に近い「SFかつ高級感のある豊かなUI」を希望した。試作の案D「蒼」と、コアの状態色（待機=蒼、照合中=紫、承認待ち=琥珀、記録済み=翠、エラー=紅）を選択した。

## 決定事項
1. 画面構成: 上に日付ルーラー、左に日付ダイヤル・接続・監査記録、中央にコアと出典の注記・状態・入力、右に判断パネル・朝の報告・数字、下に円形ドック。390pxでは1列にし、ドックを下に固定する。
2. 色: 画面の枠・文字は蒼で固定する。状態色はコア、背後の光、状態見出し、出典バーだけに使う。色だけに頼らず、日本語の状態名と凡例を常時表示する。
3. コア: R3Fの中央Canvas 1つ（ADR 0003を継続）。目盛り環・分割環・3系統の出典弧・虹彩・発光核を加算合成で描き、後処理ライブラリは追加しない。出典弧は実際の`run.jobs`から導き、runがない時は進行を描かない。2D fallbackは同じ色の静止SVG。
4. 状態の導出: `CoreVisualState`と「runがsucceeded」だけから`CoreTone`を決める（`src/components/presence/CoreVisualState.ts`、`tests/core-tone.test.mjs`）。
5. 書体: `next/font/google`でRajdhani、Share Tech Mono、Zen Kaku Gothic Newをビルド時に取得し自己ホストする。実行時にGoogleへ通信しない。ビルド時にネットワークが必要になる点はトレードオフ。
6. 朝の報告と承認は画面上に常設し、モーダルは詳細（報告全文、根拠、事業別の数字）に限る。描画設定・音声モックはドックから開く。

## 維持したもの
`/api/demo/*`、`demoStore`、`demoSafety`、契約、fixture、`VoiceSessionController`は未変更。承認は既存APIのみ、重複は409。

## 結果・影響
- 旧`ObservatoryField`、未使用の`CentralCore`を削除。`CoreEffectMode`（効果確認）は画面から外した（型は契約に残る）。
- 装飾が増えた分GPU負荷は旧版より高い可能性がある。実GPUでのFPS計測は未実施。
