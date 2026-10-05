import test from "node:test";
import assert from "node:assert/strict";
import { acceptDemoEvent, decideDemoApproval } from "../src/lib/demoSafety.ts";
import { initialApprovals, initialEvents } from "../src/fixtures/index.ts";

test("demo event intake rejects duplicates and non-demo data, and orders late events", () => {
  const first = initialEvents[0];
  assert.equal(acceptDemoEvent([first], first).length, 1);
  assert.equal(acceptDemoEvent([first], { ...first, event_id: "spoof", mode: "READ_ONLY" }).length, 1);
  const older = { ...first, event_id: "older", occurred_at: "2026-09-27T00:00:00+09:00" };
  assert.deepEqual(acceptDemoEvent([first], older).map((event) => event.event_id), [first.event_id, "older"]);
});

test("demo approval rejects expiry, changed target, changed amount, and repeated decision", () => {
  const original = initialApprovals[0];
  const beforeExpiry = new Date(Date.parse(original.expires_at) - 1000);
  const accepted = decideDemoApproval(original, original, original.intent_id, "approved", beforeExpiry);
  assert.equal(accepted?.status, "approved");
  assert.equal(decideDemoApproval(accepted, original, original.intent_id, "approved", beforeExpiry), null);
  assert.equal(decideDemoApproval(original, original, original.intent_id, "approved", new Date(original.expires_at)), null);
  assert.equal(decideDemoApproval({ ...original, target_id: "other-order" }, original, original.intent_id, "approved", beforeExpiry), null);
  assert.equal(decideDemoApproval({ ...original, amount_cap_minor: 9999 }, original, original.intent_id, "approved", beforeExpiry), null);
  assert.equal(decideDemoApproval({ ...original, description: "changed payload" }, original, original.intent_id, "approved", beforeExpiry), null);
  assert.equal(decideDemoApproval({ ...original, execution_ref: "already-executed" }, original, original.intent_id, "approved", beforeExpiry), null);
  assert.equal(decideDemoApproval(original, original, original.intent_id, "executed", beforeExpiry), null);
  assert.equal(decideDemoApproval(original, original, "wrong-intent", "approved", beforeExpiry), null);
});
