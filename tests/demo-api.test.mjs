import test from "node:test";
import assert from "node:assert/strict";
import { GET } from "../src/app/api/demo/state/route.ts";
import { POST } from "../src/app/api/demo/events/route.ts";
import { POST as decide } from "../src/app/api/demo/approvals/[id]/decision/route.ts";
import { initialEvents } from "../src/fixtures/index.ts";

test("demo API exposes only DEMO data and rejects cross-origin or live writes", async () => {
  const state = await GET().json();
  assert.equal(state.mode, "DEMO");
  assert.equal(state.system.live_operations_enabled, false);
  const event = { ...initialEvents[0], event_id: "route-test-event" };
  const request = (origin, data) => new Request("http://local.test/api/demo/events", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  assert.equal((await POST(request("http://evil.test", event))).status, 403);
  assert.equal((await POST(request("http://local.test", { ...event, mode: "READ_ONLY" }))).status, 400);
  assert.equal((await POST(request("http://local.test", event))).status, 201);
  assert.equal((await POST(request("http://local.test", event))).status, 200);
  assert.equal((await GET().json()).events.filter((item) => item.event_id === event.event_id).length, 1);
});

test("demo decision endpoint rejects unknown and repeated approvals without external effect", async () => {
  const request = () => new Request("http://local.test/api/demo/approvals/demo-intent-001/decision", {
    method: "POST",
    headers: { origin: "http://local.test", "content-type": "application/json" },
    body: JSON.stringify({ decision: "approved" }),
  });
  assert.equal((await decide(request(), { params: Promise.resolve({ id: "other-intent" }) })).status, 409);
  const first = await decide(request(), { params: Promise.resolve({ id: "demo-intent-001" }) });
  assert.equal(first.status, 200);
  assert.equal((await first.json()).effect, "none");
  assert.equal((await decide(request(), { params: Promise.resolve({ id: "demo-intent-001" }) })).status, 409);
});
