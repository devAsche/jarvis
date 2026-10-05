# 06 — 連携計画・認証・現在の未確認事項

**接続済みと仮定しない。** ChatGPT内のコネクター権限を自作JARVISやAntigravityのアクセス権と取り違えない。利用者は接続画面で認証し、Tokenをチャットに貼らない。サービスごとのOAuth scopes・rate limits・料金・利用規約を接続時に公式文書で確認する。

| サービス | 目的 | 初期アプローチ | 外部作用 |
| --- | --- | --- | --- |
| Shopify | 注文・商品・売上・在庫・webhook | M1 fixture、M2読み取り専用＋署名検証、M3発注準備 | 商品更新/注文などは承認 |
| Gmail | 重要メール・MIX問い合わせ・返信下書き | 読み取り範囲を最小化、初期はfixture | 送信は承認 |
| Google Calendar | 予定と集中枠候補 | 読み取り→提案、時間帯 Asia/Tokyo | 予定作成/変更は承認 |
| TickTick | 朝ToDo、MIX案件、タスク同期 | アダプター・重複同期/競合方針を先に確定 | 更新は承認/段階解禁 |
| CJ等の仕入れ | 送料と仕入れ候補の確認 | 規約・API・販売/素材権を検証するまで手動データ | 発注は承認 |
| SNS（X/Instagram等） | 投稿候補/反応分析 | 公開API/規約を確認。スクレイピングや規約違反の自動化なし | 投稿/DM/追客は承認 |
| 音声 | ブリーフ/会話 | VoiceProvider + MockVoiceAdapterで字幕と状態を先行検証。ブラウザーTTSは任意の読み上げ補助 | 実音声API・電話・費用発生は後日明示選択 |

## Shopify

Webhook endpoint は raw bodyで署名照合（プロバイダー公式方式）、速やかに受理し非同期処理、同一イベントの重複排除と、失敗時のリコンシリエーションが必要。初期の受注利益算出では実際の決済手数料・送料・関税・仕入れ価格・広告費の欠損を扱う。`orders/paid`等の正確な現在のTopic/スコープは実装前に公式ドキュメントで再検証する。

## Gmail / Calendar / TickTick

メール本文は機密情報かつプロンプトインジェクション入力になり得る。必要な件名/日時/差出人/抜粋だけから下書きを作り、送信しない。Calendarへの変更は既存会議との競合確認と人間の承認。TickTickの既存プロジェクト名/IDが不明な場合は勝手に新規重複プロジェクトを作らない。

## 音声・通話

ブラウザー音声機能はOS/ブラウザーごとに制約あり。聞き間違い/同音異義/誤ウェイク時の危険性から、音声は読み取りと下書き指示を中心にする。端末へ発信する電話は別途通話事業者、ユーザー同意、課金上限、着信時間帯、録音通知などを設計するまで実装しない。

## テスト用の契約

インターフェース `ProviderAdapter` を共有: `id`, `capabilities`, `connectionStatus`, `health`, `fetchEvents(cursor)`, `fetchSummary(range)`。外部作用は別インターフェース `EffectAdapter.execute(ApprovedIntent)` に分離。モック時に本番Tokenを参照しない。新サービスの追加時はまず fixture → contract test → read-only → optional approval-gated actions。
