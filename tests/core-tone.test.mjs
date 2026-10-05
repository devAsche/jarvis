import test from "node:test";
import assert from "node:assert/strict";
import { toCoreTone, toSourceProgress } from "../src/components/presence/CoreVisualState.ts";

const run = (status, jobs = []) => ({ taskRunId: "r1", status, operationalState: "idle", mode: "DEMO", sourceRefs: [], reason: "", startedAt: "", approvalId: "a", jobs });
const ok = (id) => ({ sourceId: id, reason: "", status: "succeeded" });

test("core tone follows operational state; recorded only after a succeeded run", () => {
  assert.equal(toCoreTone("executing", false), "working");
  assert.equal(toCoreTone("awaiting_approval", false), "review");
  assert.equal(toCoreTone("idle", false), "standby");
  assert.equal(toCoreTone("idle", true), "recorded");
  assert.equal(toCoreTone("error", true), "error");
});

test("source lanes never show progress without a real run", () => {
  assert.deepEqual(toSourceProgress(null), ["pending", "pending", "pending"]);
  assert.deepEqual(toSourceProgress(run("running")), ["running", "running", "running"]);
  assert.deepEqual(toSourceProgress(run("waiting_approval", ["demo_001", "demo_002", "demo_004", "demo_005"].map(ok))), ["done", "done", "done"]);
  assert.deepEqual(toSourceProgress(run("waiting_approval", [ok("demo_001"), ok("demo_002")])), ["done", "pending", "pending"]);
  assert.deepEqual(toSourceProgress(run("failed", [{ sourceId: "demo_002", reason: "", status: "failed" }])), ["failed", "failed", "failed"]);
});
