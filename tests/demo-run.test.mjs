import test from "node:test";
import assert from "node:assert/strict";
import { getDemoState, startDemoRun, recordDemoDecision, validDemoSources } from "../src/lib/demoStore.ts";
import { initialEvents } from "../src/fixtures/index.ts";

test("briefing source gate rejects stale, duplicate and contradictory fixtures", () => {
  const refs = initialEvents.filter((item) => ["demo_001", "demo_002", "demo_004", "demo_005"].includes(item.event_id));
  assert.equal(validDemoSources(refs, "demo-order-001"), true);
  assert.equal(validDemoSources([{ ...refs[0], source_freshness: "STALE" }, ...refs.slice(1)], "demo-order-001"), false);
  assert.equal(validDemoSources([refs[0], refs[1], refs[1], refs[3]], "demo-order-001"), false);
  assert.equal(validDemoSources(refs, "other-order"), false);
});

test("fixture run has task ID, cited READ jobs, true transitions, and one effect-free decision", async () => {
  const start = new Date();
  const run = startDemoRun("text", start);
  assert.equal(run.mode, "DEMO");
  assert.equal(run.status, "running");
  assert.equal(run.operationalState, "delegating");
  assert.equal(run.jobs.length, 0);
  await new Promise(setImmediate);
  const ready = getDemoState();
  assert.equal(ready.run.status, "waiting_approval");
  assert.equal(ready.run.jobs.length, 4);
  assert.ok(ready.run.jobs.every((job) => job.reason && ready.run.sourceRefs.includes(job.sourceId)));
  assert.ok(ready.events.some((event) => event.type === "task.run.fixture_read_complete" && event.correlation_id === run.taskRunId));
  assert.equal(ready.briefing.data_mode, "DEMO");
  assert.ok(ready.briefing.sections.flatMap((section) => section.items).some((item) => item.source.includes("demo_001")));
  assert.ok(ready.events.some((event) => event.type === "task.run.waiting_approval" && event.correlation_id === run.taskRunId));
  assert.equal(recordDemoDecision(run.approvalId, "approved")?.status, "approved");
  assert.equal(recordDemoDecision(run.approvalId, "approved"), null);
  assert.equal(getDemoState().run.status, "succeeded");
  assert.ok(getDemoState().events.some((event) => event.type === "task.run.demo_decision" && event.data.message.includes("effect=none")));
});
