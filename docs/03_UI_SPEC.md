# 03 — 近未来UI・演出・操作仕様

## 視覚的な根拠と注意

提供されたReelsの大型上部モニターには、**暗い青系背景、中央の青白い発光コア、その周囲の同心円/目盛り、左右の細かいステータスやグラフらしきUI、下部の情報帯**が見える。3台の下部モニターは別のスケジュール/作業画面らしく見えるが、文字や機能の詳細は判別できない。`references/monitor_crop.jpg`は動画由来の低精細な参考フレームでありピクセル単位での模写を求めない。動画で見えないAPIや自律機能を推定しない。

独自UIとして再設計し、映画Marvelの公式ロゴ、音源、声、既存JARVISデザインの固有アセットを転用しない。内部名は仮称。リリース時は権利確認と名称選定が別途必要。

## 体験設計の原則

ユーザーは一人でEC/制作/活動を切り替えるため、主画面は作業量を増やす情報洪水にせず「次に注意すべきこと」に焦点を置く。AIが話し始めると中央コアが反応し、注文や承認要求時には必要なパネルが自然に現れる。詳細統計はDashboardに格納し、普段は没入型Presence画面を維持。高い演出品質が業務データを読めなくする場合は後者を優先。

### 画面A: PRESENCE（デフォルト）

- 全画面ダークネイビー `#050B17` を基盤。微細グリッド、周辺ビネット、低コントラスト星屑（CPU/GPU節約）。差し色 `#54D4FF`、補助 `#7E82FF`、警告 `#FFBF76`。
- 中央に重層リング + 反応型Core。初期M0/M1から React Three Fiber (R3F) + Three.js で先行実装。暗いネイビー背景、青白い発光球体、層状回転リング、控えめな粒子（Marvel模倣なしの独自デザイン）。WebGL非対応・prefers-reduced-motion・省電力設定時は軽量なCSS/SVG 2D fallbackに切り替える。Canvasは中央コア専用とし、周囲のUIやテキスト、数値、承認、字幕はすべてHTML DOM/CSSで構成。単なる回転動画に依存しない。
- 左側：CONNECTIONS（EC/メール/予定/ToDo）、EVENT FEED（新着/失敗/同期時刻）。連携未設定はNOT CONNECTED。
- 右側：BUSINESS OVERVIEW（ECの実測数値と不明値、MIX進行、重要アラート）、AGENT STATUS（実際のワーカー状態）。
- 上部：ローカル日時 Asia/Tokyo、SYSTEM STATE、DEMO/LIVE明示、集中/通知状態。
- 下部：コマンド入力・マイク切替・音声波形・承認通知へのショートカット。マイク未接続のエラーはUIが説明する。

### 画面B: BRIEFING（朝の報告）

- セクション: **Past 24 Hours / Today / Pending / Suggested Deep Work**。
- Source chip: `Shopify • refreshed 09:12` 等。データがない場合はUNKNOWN、キャッシュならSTALE。
- 重要案件カードは「何が起きた → なぜ重要 → 推奨の次の操作 → 根拠データへのリンク → 承認要否」。提案と事実を視覚的に分離。
- 発話の字幕と同じカードをハイライト。音声OFFでも内容100%取得可。

### 画面C: DASHBOARD（実務）

- タブ: Commerce / Creative / Assistant / System。
- Commerce: Orders, revenue, estimated contribution margin, advertising spend, fulfilment exceptions; incomplete costs are shown explicitly.
- Creative: MIX leads, missing assets, deadline risk, singer/content ideas with approval queues.
- Assistant: calendar, email drafts, tasks and suggested focus slots. 既存予定の書き換えは権限ゲート後のみ。
- System: last sync, queue depth, errors, spend vs cap, audit link, demo/live switch（live変更時は再確認）。

### 画面D: APPROVAL CENTER

承認カードごとに: action、account、target、amount/currency、input digest/差分、expires_at、reason、risk、approve/reject。M1では「モック承認。外部実行なし」。承認後の再利用や内容差替え不可。

## モーション指針

- IDLE: コアが低振幅でゆっくり呼吸。リングは異なる速度で回る。
- LISTENING: マイク入力音量が視覚化（明示マイク許可）。
- THINKING: リングが粒子分裂/経路表示。ただし本当のAIリクエストが存在するときのみ。
- SPEAKING: 読み上げに同期。字幕必須。
- EXECUTING: アクティブなjob名/進捗、失敗時は警告色。
- AWAITING_APPROVAL: コア周囲にアンバーの弧、承認カードをforeground表示。
- ERROR/OFFLINE: 画面を赤く点滅させない。代わりに明確な診断カード。
- `prefers-reduced-motion`: 粒子と周期アニメーション停止、状態は文字/色/アイコンの複数手段で表す。CPU節約トグルを追加。

## ビジュアルQAゲート（主観ではなく証拠）

- 1440×900、1920×1080、390×844でスクリーンショット。横は2カラム/中央コア、縦はカードの読みやすさ・コマンドバー優先。重大なはみ出しゼロ。
- 実ブラウザーでモック `idle → briefing → approval → dashboard → offline` を操作撮影。音声なし操作・Tab/Enter/Escapeも実施。
- Canvas/3Dは遅延読み込み。低電力設定/低モーションでもダッシュボードの操作を妨げない。初期レンダのメイン内容をCanvas内のみに置かない。
- アニメーションは仕事状態の説明に役立つものだけ。飾りのバリエーションを増やす前に、ユーザーが1分以内に「今日何をすべきか」理解できることを検証。

## 初期プロトタイプ

`prototype/index.html` はCSS中心・外部通信無しの静的概念実証。Reactへ移植するときはスクリーンショットを基準としつつコンポーネント化する。静的プロトタイプを「実用アプリが完成」と報告しない。
