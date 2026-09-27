# ADR 0002: M0 UI Shell および最小フロントエンド設計・検証アーキテクチャの選定

## 状態
承認済み (Accepted) / M0-01, M0-02 完了

## 背景
- 本プロジェクトは個人事業（Shopify EC、MIX/制作受託、配信活動）を統合する自律型ビジネスOSの基盤構築（M0/M1）である。
- 外部APIへの無断課金や依存を防止し、初期は完全な `DEMO` / `READ_ONLY` かつオフラインで動作可能な最小スタックが求められている。
- Antigravity IDE（Windows環境、Node v24.18.0, npm 11.16.0）上において、最新の安定版互換スタックを採用する必要がある。
- ブラウザ自動QAにおいて、Playwrightの外部バイナリ取得が環境要因（404 Not Found）で不可となったため、利用者の承諾のもと、Windows標準のローカルMicrosoft Edge（ヘッドレスモード）を活用した代替キャプチャ方式を実装した。

## 決定事項
1. **フロントエンドフレームワーク**:
   - Next.js (v15.2.x, App Router) + React 19 + TypeScript 5.8
   - パッケージ構成: モノレポ構造への過度な複雑化を避け、単一Next.jsプロジェクト内に仕様境界（`src/contracts/` にZod/TS契約、`src/fixtures/` にモックデータ、`src/components/` にUIコンポーネント）を明確に分離した。
2. **デザインシステム**:
   - `config/design-tokens.json` および `prototype/index.html` の仕様に準拠した Vanilla CSS (`src/app/globals.css`) を採用。
   - ダークネイビー (`#050B17`)、シアン (`#52D8FF`)、アンバー (`#FFBE76`) のデザイントークン。
   - 同心円軌道（CSS/SVG `spin` アニメーション）、呼吸パルス、音響波形を軽量かつ安定して描画。重い3D（Three.js）はM4以降の評価事項として保留。
   - `prefers-reduced-motion` のアクセシビリティ対応を完全実装。
3. **契約とデータモデル (`docs/05_DATA_AND_API.md` 準拠)**:
   - `DataMode` (`DEMO`, `READ_ONLY`, `SUPERVISED`, `LIMITED_AUTOMATION`)
   - `DataProvenance` (`DEMO`, `LIVE_VERIFIED`, `STALE`, `UNKNOWN`)
   - `CoreState`, `SourceEventEnvelope`, `MorningBriefing`, `ApprovalItem`, `BusinessSummary`, `SystemStatus` を Zod スキーマおよび型定義として整備。
4. **テスト・検証**:
   - Node 24 組み込みテスト (`node --experimental-strip-types`) による契約スキーマおよび負のテスト（未知のmodeや不正ステータスの拒絶）を自動化。
   - ヘッドレスEdgeによるデスクトップ (1440×900) およびモバイル (390×844) の自動スクリーンショット撮影スクリプト (`scripts/capture-screenshots.ps1`) を配備。

## 影響とリスク
- 外部課金APIの契約は0件、追加コスト0円を維持。
- Playwrightの公式ドライバが利用できない環境でも、WindowsローカルEdgeにより確実な視覚検証が可能。
- 次のタスク（M0-03: Codexによる内部イベント・承認ポリシー・ユニットテスト）に向けて、明確なTypeScript/Zod契約が提供される。
