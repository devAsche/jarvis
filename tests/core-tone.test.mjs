import test from "node:test";
import assert from "node:assert/strict";
import { toCoreTone, toSourceProgress } from "../src/components/presence/CoreVisualState.ts";

const run = (status, jobs = []) => ({ taskRunId: "r1", status, operationalState: "idle", mode: "DEMO", sourceRefs: [], reason: "", startedAt: "", approvalId: "a", jobs });
const LANES = [["demo_001"], ["demo_002", "demo_004"], ["demo_005"]].map((ids) => ({ source: ids[0], label: ids[0], ids, detail: "", connected: true }));
const ok = (id) => ({ sourceId: id, reason: "", status: "succeeded" });

test("unconnected lanes never show progress", () => {
  const lanes = [{ source: "shopify", label: "shopify", ids: ["shopify"], detail: "", connected: true }, { source: "gmail", label: "gmail", ids: [], detail: "", connected: false }];
  assert.deepEqual(toSourceProgress(run("running"), lanes), ["running", "pending"]);
});

test("core tone follows operational state; recorded only after a succeeded run", () => {
  assert.equal(toCoreTone("executing", false), "working");
  assert.equal(toCoreTone("awaiting_approval", false), "review");
  assert.equal(toCoreTone("idle", false), "standby");
  assert.equal(toCoreTone("idle", true), "recorded");
  assert.equal(toCoreTone("error", true), "error");
});

test("source lanes never show progress without a real run", () => {
  assert.deepEqual(toSourceProgress(null, LANES), ["pending", "pending", "pending"]);
  assert.deepEqual(toSourceProgress(run("running"), LANES), ["running", "running", "running"]);
  assert.deepEqual(toSourceProgress(run("waiting_approval", ["demo_001", "demo_002", "demo_004", "demo_005"].map(ok)), LANES), ["done", "done", "done"]);
  assert.deepEqual(toSourceProgress(run("waiting_approval", [ok("demo_001"), ok("demo_002")]), LANES), ["done", "pending", "pending"]);
  assert.deepEqual(toSourceProgress(run("failed", [{ sourceId: "demo_002", reason: "", status: "failed" }]), LANES), ["failed", "failed", "failed"]);
});
