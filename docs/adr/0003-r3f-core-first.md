# ADR 0003: 中央PresenceコアにおけるReact Three Fiber (R3F) 先行導入と2D Fallbackアーキテクチャ

## ステータス
Accepted (CR-001設計変更)

## コンテキスト
元の設計（`docs/03_UI_SPEC.md`）では「中央コアはCSS/SVGで開始し、3Dは後で必要に応じて」としていた。しかし、常時表示モニターにおける近未来Presence UIとしての存在感と、実際の業務状態（待機、マイク入力、思考/委譲、発話、実行、承認待ち、エラー、オフライン）を視覚的に表現するため、中央コアのみ初期M0/M1から React Three Fiber (R3F) + Three.js を先行導入する設計変更（CR-001）が確定した。

一方で、JARVIS Business OSは個人経営者の実務（EC、制作、秘書業務）を統括するシステムであり、以下の要件を厳格に満たす必要がある：
1. 業務データ（注文数、売上、タスク、承認ボタン、字幕）の可読性と操作性を最優先とし、Canvas内に業務UIを埋め込まない。
2. WebGL非対応環境、GPU過負荷時、`prefers-reduced-motion`、低電力モードでも業務操作が完全に継続できること。
3. Marvel等の映画・作品の固有アセット・声・商標をコピーせず、ダークネイビー基盤、青白い発光球体、層状回転リング、低負荷粒子による独自デザインとする。

## 決定事項
1. **局所的R3F採用**:
   R3F `<Canvas>` は Presence画面の中央コア領域（`Core3DViewport`）のみに限定する。背景の全画面3D化や他パネルのWebGL化は禁止する。
2. **三位一体のコンポーネント分離**:
   - `CoreVisualState`: 状態機械（`IDLE`, `LISTENING`, `DELEGATING/THINKING`, `SPEAKING`, `EXECUTING`, `AWAITING_APPROVAL`, `ERROR`, `OFFLINE`）の定義とトークン色の管理。
   - `Core3DViewport`: Next.js `dynamic(..., { ssr: false })` による遅延ロードR3F実装。軽量シェーダー/ジオメトリ、低粒子数で設計。
   - `Core2DFallback`: 既存のCSS/SVG実装を活用した2Dフォールバック。WebGL未対応、低モーション設定、手動省電力トグル時にシームレスに切り替え。
3. **DOMファーストのアクセシビリティ**:
   HTMLテキスト、数値、承認ボタン、字幕、キーボード操作（Tab/Enter/Escape）はすべて Canvas 外のアクセス可能なDOMに配置する。
4. **依存関係の選定**:
   React 19 に公式対応した最新安定版 `@react-three/fiber` (9.8.x) および `three` (0.186.x) を採用。

## 結果・影響
- 期待する影響: 初期から中央コアをR3Fで描き、業務UIはDOMに残す。手動2D切替は確認済み。WebGL無効・GPU過負荷時の自動切替は実機で継続検証する。
- 負の影響/トレードオフ: `@react-three/fiber` と `three` のパッケージ追加（約数MBのバンドル増）。クライアントサイド限定描画のための遅延ロード設計が必須となる。
