# 05 — データモデルとイベント/API契約（設計案）

このファイルはM1のモック実装契約であり、実プロバイダーの最新ペイロードは接続時に公式仕様で再確認する。

## コアテーブル（M2で実装）

- `accounts`: source, display_name, connection_state, permission_scopes, last_sync_at, health（Token生値をここに保存しない）。
- `source_events`: id, source, provider_event_id, topic, occurred_at, received_at, payload_redacted_ref, fingerprint; unique(source, provider_event_id, topic)（プロバイダーがイベントIDを提供しないケースは代替キーを明記）。
- `business_records`: kind, external_id, source_event_id, amount_minor, currency, known_costs, missing_fields, recorded_at。
- `tasks`: owner, kind, status, priority, due_at, source_refs, summary, confidence/source freshness。
- `jobs`: id, idempotency_key, job_type, payload_ref, status, retry_count, next_attempt_at, last_error。
- `approvals`: intent_id, action_type, account, target_id, payload_hash, amount_cap_minor, currency, expires_at, status, reviewed_by, reviewed_at, execution_ref。
- `audit_events`: id, type, correlation_id, actor, action, decision, safe_metadata, at; append only。
- `agent_runs`: run_id, type, model/provider, input_source_ids, outcome, token_cost_estimate, errors, started_at, ended_at。
- `preferences`: locale/Asia-Tokyo, briefing_time (unset until user chooses), reduced_motion, notification settings, optional budgets。

個人情報は最小化し保存期間/削除手順をサービス導入時に決定。複数通貨はminor units + currency。日本円と米ドルを根拠なく加算しない。利益が不完全なら`estimated`と`missing_fields`。

## 標準内部イベントEnvelope

```json
{
  "event_id": "demo_evt_001",
  "source": "fixture.shopify",
  "type": "commerce.order.paid",
  "mode": "DEMO",
  "occurred_at": "2026-09-28T00:00:00+09:00",
  "received_at": "2026-09-28T00:00:02+09:00",
  "source_freshness": "demo",
  "correlation_id": "sample-order-1",
  "data": { "order_id": "sample-order-1", "amount_minor": 4900, "currency": "JPY" }
}
```

内部イベントは外部プロバイダー固有payloadから変換する。`mode`はサーバー側で強制設定し、Webhook任意フィールドを信じない。`event_id`だけでなく`source+id`の一意制約。`occurred_at`と`received_at`を分離。

## API案

M0実装済み: `GET /api/demo/state` はfixtureとプロセス内デモ状態を返す。`POST /api/demo/events` と `POST /api/demo/approvals/:id/decision` は開発/テスト時の同一Origin・JSON限定で、外部作用はない。本番ビルドでは書き込みを403で拒否する。保存はプロセス内だけで再起動時に消える。下表の個別業務APIと認証付き承認は今後の設計案であり、実装済みではない。

| METHOD | PATH | 内容 | M1 |
| --- | --- | --- | --- |
| GET | `/api/system/status` | mode, source-health, last sync | mock |
| GET | `/api/briefings/today` | 今日のbriefとevidence refs | fixture |
| GET | `/api/events?cursor=` | safe event feed | fixture |
| GET | `/api/business/summary` | 各事業概況と数値の既知/未確認 | fixture |
| GET | `/api/approvals` | pendingなどの一覧 | fixture |
| POST | `/api/demo/events` | dev/test環境限定のmockイベント投入 | mock限定 |
| POST | `/api/approvals/:id/decision` | auth/CSRF/固定payload照合（M1: mock） | mock限定 |
| GET | `/api/audit` | セキュアな監査イベント | mock限定 |

本番時は認証/認可、CSRF/Origin、rate limit、ページング、データマスキング、ロールバックを設計。デモイベント投入APIは本番無効。UI用push更新はSSEまたはWebSocketを測定して採用。

## 実装済みAPI（2026-10-05, ADR 0006）

| METHOD | PATH | 内容 |
| --- | --- | --- |
| GET | `/api/state` | DEMO: fixture状態。READ_ONLY: オーナーのみ（未ログインは401）。events/approvals/run/briefing/summary/system/lanes/provenance/sync/audit |
| POST | `/api/runs` | DEMO: fixture照合。READ_ONLY: Shopify読み取り同期→ルールで報告と確認カード（オーナー＋同一Origin） |
| POST | `/api/approvals/:id/decision` | 固定項目・期限・重複を照合して記録のみ（effect=none） |
| POST | `/api/auth/login`, `/api/auth/logout` | オーナー認証（5回失敗で15分停止） |
| POST | `/api/webhooks/shopify` | HMAC検証・ショップ一致・配信ID重複排除。READ_ONLYのみ |
| POST | `/api/cron/sync` | `Authorization: Bearer JARVIS_CRON_SECRET`。READ_ONLYのみ |

保存は`JARVIS_DATA_DIR/jarvis-store.json`（`src/server/store.ts`）。上の「コアテーブル」のうち orders/source_events/approvals/audit/sync状態を1ファイルで実装し、DB化はクラウド移行時に再検討。

## 朝のbriefの回答構造案

```json
{
  "date": "2026-09-28",
  "timezone": "Asia/Tokyo",
  "data_mode": "DEMO",
  "generated_at": "2026-09-28T09:30:00+09:00",
  "sections": [
    {"kind":"anomalies","title":"Past 24 hours","items":[],"sources":[]},
    {"kind":"schedule","title":"Today","items":[],"sources":[]},
    {"kind":"pending","title":"Pending","items":[],"sources":[]},
    {"kind":"suggestions","title":"Deep work","items":[],"sources":[]}
  ]
}
```
