# 10 — テスト計画 / 品質ゲート

## M1の必須E2E（架空データのみ）

 1. **初期表示:** 起動直後に`DEMO DATA`/`NOT CONNECTED`と表示。数字が実データであるかのように装わない。
 2. **R3F中央コア検証:** 中央PresenceコアがReact Three Fiber `<Canvas>` で正しく描画されること。WebGL無効時、`prefers-reduced-motion` 時、手動Low-Graphics時に安全にCSS 2D fallbackに切り替わること。
 3. **音声モックと状態連携:** `MockVoiceAdapter` により `IDLE → LISTENING → DELEGATING/THINKING → SPEAKING → EXECUTING → AWAITING_APPROVAL → IDLE` の遷移、および `ERROR` / `OFFLINE` が検証できること。音声なし（字幕のみ）でも100%の内容が把握できること。
 4. **偽のAI状態の防止:** 実モードでは実タスクID、デモではデモsessionId/taskIdとDEMO明示がない状態での「考え中」を拒否。音声指示だけで高リスク承認を通さない。
 5. **朝のブリーフ:** モックEC注文/滞留MIX案件/カレンダー候補が根拠参照付きで出る。「今日は何をすべきか」を短く確認できる。
 6. **注文イベント:** モックイベント到着→イベント欄→異常カード→承認センターに一貫した同じIDと額で反映。
 7. **承認デモ:** 許可/否認/期限切れを試す。どれも本番APIを呼ばず、監査ログに可視化。二重操作は不可。
 8. **プロバイダー障害:** Shopify/Gmailをoffline相当にしてもアプリがクラッシュしない。STALEの表示が変わる。
 9. **レスポンシブ:** `1440×900`, `1920×1080`, `390×844`で目視スクショ保存。横スクロール/操作不能なし。
 10. **アクセシビリティ:** keyboard-only/Tab/Enter/Escape、フォームラベル/コントラスト/reduced-motionで機能維持。
 11. **費用:** M1実行中にネットワーク上の有料AI/リアルEC APIアクセスが発生していないことを確認。

## M2/M3の防御的テスト

- 重複Webhook 5回、逆順イベント、無効署名、再実行、ネットワーク障害、処理途中の再起動、日付境界(Asia/Tokyo)、USD/JPY混在、送料未知、広告費欠損。
- 外部メール本文でポリシー上書きを指示しても実行されない。モデル応答に予期せぬツールcallが含まれてもブロック。
- APIの未認証/期限切れセッション/CSRF/異なる対象のapproval ID/変更payload hashを拒否。
- ブリーフが未知と確認済みを区別。外部処理成功か不明なら「成功」とみなさず照合。

## UIの視覚的評価

スクショに必須状態: `IDLE`, `BRIEF`, `AWAITING_APPROVAL`, `OFFLINE`, `REDUCED_MOTION`; 基準は `docs/03_UI_SPEC.md`。動画画像は**雰囲気参照のみ**で正確な文字位置コピーを義務としない。画面サイズ別の改善点/変更前後を `docs/WORK_LOG.md` へ記録。MVPでは高度な3Dより読みやすさ・動作整合性を合否条件にする。
