# UI再制作で守る契約と受入条件

この文書は2026-10-05のコード調査に基づく引継ぎ。着手時に実コード、テスト、Git差分を再確認すること。過去のCR001〜CR003文書は経緯であり、現行実装と食い違う箇所は記録して判断する。

## 現行の動作と参照先

| 対象 | 現状と主なファイル | 再制作時の条件 |
| --- | --- | --- |
| 画面の結線 | `src/app/page.tsx`。朝の報告、事業概況、承認、コマンド入力、音声モック、中央Presenceを接続 | 操作の入口を見つけやすくする。状態更新の根拠を失わない |
| デモAPI | `src/app/api/demo/state/route.ts`, `runs/route.ts`, `events/route.ts`, `approvals/[id]/decision/route.ts` | 現行の契約を利用し、実サービスへの書込みに置き換えない |
| 状態と真実性 | `src/contracts/index.ts`, `src/lib/demoStore.ts`, `src/lib/demoSafety.ts` | `taskRunId`のない実行中・思考中を表示しない。重複・遅延イベントで状態を逆行させない |
| 根拠付き報告 | `src/fixtures/index.ts`とブリーフ表示 | 出典、生成時刻、データの鮮度を読める形で示す。デモ数字を売上実績と断定しない |
| 承認 | `src/components/ApprovalModal.tsx`と承認API | 対象、金額、期限、現在の状態を確認できる。重複承認は拒否。UIでのデモ承認は外部行動を起こさない |
| 音声 | `src/lib/voice/`, `src/components/VoiceControls.tsx` | Mockと明示。音声の「承認」を承認として扱わない。実APIキーをブラウザーへ渡さない |
| 描画 | `src/components/presence/`, `src/components/CentralCore.tsx` | 業務情報はDOM。R3Fは中央の表現に限定。WebGL失敗時も承認と数値は残る |

## 表示の真実性

- 現在のアプリはローカルDEMO。画面の見やすい位置に`DEMO`または`MOCK`を継続表示する。`LIVE_VERIFIED`、`STALE`、`UNKNOWN`は区別する。
- `TaskRun`は`taskRunId`、`status`、`operationalState`、`sourceRefs`を持つ。`running`等の実行状態は実際のデモAPIから得た同一runに結び付ける。装飾アニメーションだけで「処理中」を捏造しない。
- `UIEvent`は`eventId`、`occurredAt`、`source`、`sessionId`/`taskId`等を持つ。`delegating`、`thinking`、`executing`はsessionとtaskのIDが必要。イベントの重複・順不同を無視または安全に処理する。
- モックの発話・待機はデモ音声であり、業務タスクの実行や会話AIの判断として見せない。TTSと会話AIを同一視しない。
- 数字の例: ¥4,900はfixtureの例示注文額。配送費の¥900・¥1,550・差額¥650も例示。利益は不明なものを確定値にしない。

## 安全境界

- 起動モードはMOCK/DEMOまたはREAD_ONLY。実注文、メール、広告、返金、送金、契約、外部公開を行わない。課金API、実サービス認証情報を追加しない。
- 承認は人間の認証済みUIで行う構想。現状はローカルのデモ承認だけ。承認対象のaction、account、target、金額、通貨、期限を固定し、期限切れ・変更・重複を拒否する。音声の返事では確定しない。
- ブラウザー向けコード、ログ、スクリーンショット、コミットに秘密値や個人情報を残さない。fixtureを本番データと混ぜない。
- WebGL、音声、APIの不具合は失敗表示に留める。承認結果やデータの出所を楽観的に書き換えない。

## 視覚・操作の受入条件

1. 既存アプリのデスクトップと390px幅で、朝の報告、根拠、事業概況、承認待ち、コマンド入力に届く。日本語を省略しすぎず、キーボードで主要操作を完了できる。
2. 少なくとも通常状態、タスク実行、承認待ち、承認後、エラー、狭幅、描画off、GPU失敗、reduced motionを実画面で確認する。新しいデザインはユーザーの視覚的選択後に本番ルートへ反映する。
3. 描画品質`auto/balanced/low/off`を選べる。`off`、WebGL失敗、reduced motionでは2D fallbackが読める。中央Canvas以外の文字・操作・売上表示は消えない。
4. 動きがある場合は、視認できる一方で読解・入力・クリックを妨げず、非表示タブやアンマウント時に無駄なRAF/audio処理を残さない。性能問題が出たら装飾を減らす。
5. デモであること、数字の出典と鮮度、承認の対象と結果を見誤らない。見た目の完成と機能テスト合格は別々に記録する。
6. 現行の`npm run typecheck`、`npm run lint`、`npm test`、`npm run build`を実行し、結果を記録する。`build`は動作中のdevサーバーが使う`.next`に干渉するため、同じ出力先で同時実行しない。既存の失敗は変更前との差を示す。

## 受入証跡

保存先は着手時に既存の`docs/`またはscreenshots領域から選ぶ。現行UIと完成UIのデスクトップ/390px、通常・承認・描画失敗の画面を撮り、撮影条件・URL・時刻・設定を添える。動画は任意。スクリーンショットだけで操作成立や性能を証明したことにしない。
