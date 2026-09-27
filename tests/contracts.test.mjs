import test from "node:test";
import assert from "node:assert/strict";
import {
  DataModeSchema,
  DataProvenanceSchema,
  SourceEventEnvelopeSchema,
  MorningBriefingSchema,
  ApprovalItemSchema,
} from "../src/contracts/index.ts";

test("Contract Schema: DataMode verifies DEMO and rejects invalid modes", () => {
  assert.equal(DataModeSchema.parse("DEMO"), "DEMO");
  assert.equal(DataModeSchema.parse("READ_ONLY"), "READ_ONLY");
  assert.throws(() => DataModeSchema.parse("UNCONTROLLED_PRODUCTION"));
});

test("Contract Schema: SourceEventEnvelope parses valid mock event", () => {
  const validEvent = {
    event_id: "demo_001",
    source: "fixture.shopify",
    type: "commerce.order.paid",
    mode: "DEMO",
    occurred_at: "2026-09-28T08:58:00+09:00",
    received_at: "2026-09-28T08:58:02+09:00",
    source_freshness: "DEMO",
    correlation_id: "demo-order-001",
    data: { order_id: "demo-order-001", amount_minor: 4900, currency: "JPY" },
  };

  const parsed = SourceEventEnvelopeSchema.parse(validEvent);
  assert.equal(parsed.event_id, "demo_001");
  assert.equal(parsed.mode, "DEMO");
});

test("Contract Schema: SourceEventEnvelope rejects missing event_id or invalid mode", () => {
  const invalidEvent = {
    source: "fixture.shopify",
    type: "commerce.order.paid",
    mode: "INVALID_MODE",
  };
  assert.throws(() => SourceEventEnvelopeSchema.parse(invalidEvent));
});

test("Contract Schema: MorningBriefing parses fixture structure", () => {
  const validBriefing = {
    date: "2026-09-28",
    timezone: "Asia/Tokyo",
    data_mode: "DEMO",
    generated_at: "2026-09-28T09:30:00+09:00",
    disclaimer: "DEMO ONLY. Sample data.",
    sections: [
      {
        kind: "anomalies",
        title: "Past 24 hours",
        items: [
          {
            id: "alert_1",
            headline: "Shipping variance detected",
            source: "fixture.shopify",
            confidence: "demo",
          },
        ],
        sources: ["fixture.shopify"],
      },
    ],
  };

  const parsed = MorningBriefingSchema.parse(validBriefing);
  assert.equal(parsed.sections.length, 1);
  assert.equal(parsed.data_mode, "DEMO");
});

test("Contract Schema: ApprovalItem validates pending status and amount", () => {
  const validApproval = {
    intent_id: "demo-intent-001",
    action_type: "demo.review_shipping",
    account: "Shopify Pet Store",
    target_id: "SAMPLE-0001",
    title: "REVIEW ESTIMATED COST",
    description: "Sample verification before order execution",
    amount_cap_minor: 4900,
    currency: "JPY",
    expires_at: "2026-09-28T23:59:59+09:00",
    status: "pending",
    reason: "Shipping fee anomaly",
    risk: "low",
  };

  const parsed = ApprovalItemSchema.parse(validApproval);
  assert.equal(parsed.status, "pending");
  assert.equal(parsed.amount_cap_minor, 4900);
});

test("Negative Test: ApprovalItem rejects non-whitelisted status", () => {
  const invalidApproval = {
    intent_id: "demo-intent-001",
    status: "auto_executed_by_ai", // Forbidden!
  };
  assert.throws(() => ApprovalItemSchema.parse(invalidApproval));
});
