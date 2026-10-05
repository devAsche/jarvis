# ADR 0006: READ_ONLYモード — Shopify読み取り、オーナー認証、ファイル保存

## ステータス
Accepted（2026-10-05。ユーザー選択: 最初の連携=Shopify、有料API=0円のまま、稼働=クラウド常時稼働〔デプロイは別途承認〕）

## 決定
1. `JARVIS_MODE=DEMO|READ_ONLY`。READ_ONLYはオーナー認証（scryptハッシュ＋HMAC署名Cookie、12時間、HttpOnly/SameSite=Strict）が設定されていなければ起動せずDEMOに戻る。READ_ONLYではデモ書き込みAPIも閉じる。
2. 画面は統一API（`/api/state`, `/api/runs`, `/api/approvals/:id/decision`）を使い、サーバー側でモードを切り替える。旧 `/api/demo/*` は残す。
3. Shopifyは Admin GraphQL `2026-10`、client credentials grant、`read_orders`。アダプターにmutationは存在しない。全リクエストに15秒のタイムアウト、429/5xx/THROTTLEDは指数バックオフで最大4回。
4. 保存は単一JSONファイル（tmp書き込み→rename、直列化キュー）。注文は金額・状態のみで個人情報を持たない。破損ファイルは上書きせずエラーにする。
5. 鮮度: 同期成功から`JARVIS_STALE_AFTER_MINUTES`以内かつ直近の試行が成功ならLIVE_VERIFIED、それ以外はSTALE、未同期はUNKNOWN。同期失敗時もデータは消さず、STALEとして表示する。
6. 朝の報告と確認カードは決定的なルール（`src/server/rules.ts`）だけで作る。AI・有料APIは使わない。確認カードの判断は「確認した」記録のみで、効果アダプターは存在しない（M3で別途承認）。
7. Webhookは生の本文でHMAC検証、ショップドメイン一致、配信ID重複排除、注文は`updatedAt`が新しい時だけ更新（冪等）。

## 影響
- 常駐Nodeサーバーが前提（サーバーレス不可）。クラウド候補は`docs/12_CLOUD_PLAN.md`。
- 実ストアでの接続は未確認（この開発環境からShopifyへの通信は遮断されている）。テストは偽のShopify応答で行った。
