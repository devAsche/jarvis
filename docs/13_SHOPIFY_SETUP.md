# 13 — Shopify 読み取り専用接続の手順（オーナー作業）

対象: JARVISのREAD_ONLYモード。JARVISはShopifyへ**書き込みません**（注文・発送・返金・商品を変更するコードはない）。必要な権限は `read_orders` だけです。
確認日: 2026-10-05（shopify.dev のドキュメント検索で確認。Admin API `2026-10`）。

## 前提（公式ドキュメントで確認済み）

- 管理画面で作る「カスタムアプリ（admin-created custom app）」は**新規作成できなくなった**。新しいアプリは Dev Dashboard（または Shopify CLI）で作る。
- 自分の組織のストアだけで使うサーバー連携は **client credentials grant** で、`client_id` と `client_secret` からアクセストークンを取得する。トークンは約24時間で切れ、JARVISが自動で取り直す。
- Webhook は生のリクエスト本文に対する HMAC-SHA256（`X-Shopify-Hmac-SHA256`）で検証し、`X-Shopify-Webhook-Id` で重複を除く。

## 手順

1. Shopify の Dev Dashboard でアプリを作成する（名前は例: `JARVIS read-only`）。
2. アクセス権限（scopes）は **`read_orders` のみ**にする。書き込み系の権限は付けない。
3. アプリを自分のストアにインストールする。
4. アプリ設定の Credentials から Client ID と Client secret を控える。**チャットやコミットに貼らない。**
5. JARVISを動かすPC/サーバーの `.env.local`（クラウドなら秘密値の設定画面）に入れる:
   ```
   JARVIS_MODE=READ_ONLY
   JARVIS_OWNER_PASSWORD_HASH=   ← node scripts/hash-password.mjs の出力
   JARVIS_SESSION_SECRET=        ← 32文字以上のランダム文字列
   SHOPIFY_SHOP=xxxx.myshopify.com
   SHOPIFY_CLIENT_ID=...
   SHOPIFY_CLIENT_SECRET=...
   JARVIS_SHIPPING_ESTIMATE_MINOR={"JPY":900}   ← 送料の想定（不要なら空欄でルール停止）
   ```
6. `npm run build && npm run start` で起動し、ブラウザーでログイン → 「朝の報告」を押す。初回は過去7日間に更新された注文を読み取る。
7. 上部の表示が `READ ONLY · Shopify 最新` になれば接続成功。失敗時は左の「記録」に理由（例: `unauthorized (check app install and read_orders scope)`）が出る。

## 任意: Webhook と定期同期（クラウド常時稼働時）

- 定期同期: スケジューラーから `POST https://<あなたのドメイン>/api/cron/sync` を30分ごとに呼ぶ。ヘッダー `Authorization: Bearer <JARVIS_CRON_SECRET>`。
- Webhook（即時反映）: アプリ設定で `orders/create`, `orders/updated`, `orders/paid`, `orders/cancelled`, `orders/fulfilled` を `https://<あなたのドメイン>/api/webhooks/shopify` に送るよう登録する。署名はClient secretで検証される。Webhookが無くても定期同期だけで動く。

## 保存されるもの / されないもの

保存する: 注文ID、注文番号、日時、通貨、合計額、送料、支払い・発送状態、キャンセル有無。
保存しない: 顧客名、メール、住所、電話、商品明細、アクセストークン（メモリ内だけ）。

## ルール（AIは使わない）

| ルール | 条件 | 表示 |
| --- | --- | --- |
| 送料超過 | 過去24時間の注文で、送料 > `JARVIS_SHIPPING_ESTIMATE_MINOR` の通貨別想定 | 異常 + 確認カード |
| 未発送の滞留 | 支払い済み・未発送のまま48時間超 | 滞留 + 確認カード（最大5件） |
| 24時間の注文 | 通貨ごとに件数と合計（通貨をまたいで足さない） | 今日 / 事業の数字 |
| キャンセル | 過去24時間に更新されたキャンセル注文 | 異常 |

利益は原価・手数料・広告費のデータがないため常に「不明」。確認カードの「確認済みにする」は確認したことを記録するだけで、Shopify上は何も変わらない。
