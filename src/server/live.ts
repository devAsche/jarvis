import type { ApprovalItem, ConnectionInfo, SourceLane, SystemStatus, TaskRun } from "../contracts/index.ts";
import type { JarvisConfig } from "./config.ts";
import { appendAudit, type Store } from "./store.ts";
import { freshness, syncShopify } from "./sync.ts";
import { buildLiveBriefing, buildLiveSummary, buildReviews } from "./rules.ts";
import { decideDemoApproval } from "../lib/demoSafety.ts";
import type { FetchLike } from "./providers/shopify.ts";

export type Lane = SourceLane;

const FRESH_TEXT = { LIVE_VERIFIED: "読取済み · 最新", STALE: "読取済み · 古い", UNKNOWN: "未同期", DEMO: "DEMO" } as const;

/** Run = one real sync of every connected source, then deterministic brief + review cards. */
export async function startLiveRun(store: Store, cfg: JarvisConfig, fetchImpl: FetchLike, input: "text" | "voice", now = () => new Date()): Promise<{ run: TaskRun; done: Promise<void> }> {
  const started = now();
  const run = await store.update((data) => {
    if (data.run?.status === "running") return data.run;
    data.run = {
      taskRunId: crypto.randomUUID(), status: "running", operationalState: "delegating", mode: "READ_ONLY",
      sourceRefs: [], reason: "Shopifyを読み取り中（書き込みなし）", startedAt: started.toISOString(), approvalId: "", jobs: [],
    };
    appendAudit(data, { type: "task.run.started", actor: "owner", correlationId: data.run.taskRunId, detail: `${input} input; read-only sync` }, started);
    return data.run;
  });
  if (run.startedAt !== started.toISOString()) return { run, done: Promise.resolve() }; // already running
  const done = (async () => {
    const result = cfg.shopify ? await syncShopify(store, cfg, fetchImpl, now()) : { ok: false, changed: 0, error: "Shopify is not configured" };
    await store.update((data) => {
      if (data.run?.taskRunId !== run.taskRunId) return;
      const at = now();
      const orders = Object.values(data.orders);
      const input = { orders, now: at, shippingEstimateMinor: cfg.shippingEstimateMinor };
      const jobs: TaskRun["jobs"] = [{ sourceId: "shopify", reason: result.ok ? `注文を読み取り（変更 ${result.changed}件）` : `読み取り失敗: ${result.error}`, status: result.ok ? "succeeded" : "failed" }];
      if (!result.ok && !Object.keys(data.orders).length) {
        data.run = { ...data.run, status: "failed", operationalState: "error", jobs, reason: result.error ?? "読み取り失敗" };
        appendAudit(data, { type: "task.run.failed", actor: "system", correlationId: run.taskRunId, detail: result.error ?? "failed" }, at);
        return;
      }
      // A failed sync with older data still produces a brief, but every view marks it STALE.
      data.briefing = buildLiveBriefing(input);
      const decided = data.reviews.current.filter((r) => r.status !== "pending");
      const fresh = buildReviews(input).filter((r) => !decided.some((d) => d.intent_id === r.intent_id));
      data.reviews.current = [...fresh, ...decided].slice(0, 20);
      data.reviews.originals = [...fresh, ...data.reviews.originals.filter((o) => decided.some((d) => d.intent_id === o.intent_id))];
      const pending = data.reviews.current.find((r) => r.status === "pending");
      data.run = {
        ...data.run, jobs, sourceRefs: ["shopify"], approvalId: pending?.intent_id ?? "",
        status: pending ? "waiting_approval" : "succeeded", operationalState: pending ? "awaiting_approval" : "idle",
        reason: result.ok ? `Shopify読み取り完了 · 確認 ${fresh.length}件` : `同期に失敗したため前回のデータで作成（${result.error}）`,
      };
      appendAudit(data, { type: pending ? "task.run.waiting_approval" : "task.run.completed", actor: "system", correlationId: run.taskRunId, detail: `reviews ${fresh.length}; read-only` }, at);
    });
  })();
  return { run, done };
}

export async function decideLive(store: Store, intentId: string, decision: "approved" | "rejected", now = new Date()): Promise<ApprovalItem | null> {
  return store.update((data) => {
    const current = data.reviews.current.find((r) => r.intent_id === intentId);
    const original = data.reviews.originals.find((r) => r.intent_id === intentId);
    if (!current || !original) return null;
    const updated = decideDemoApproval(current, original, intentId, decision, now, { actionPrefix: "review.", reviewer: "owner" });
    if (!updated) return null;
    data.reviews.current = data.reviews.current.map((r) => (r.intent_id === intentId ? updated : r));
    const pending = data.reviews.current.some((r) => r.status === "pending");
    if (data.run && data.run.status === "waiting_approval" && !pending) data.run = { ...data.run, status: "succeeded", operationalState: "idle" };
    else if (data.run && data.run.status === "waiting_approval") data.run = { ...data.run, approvalId: data.reviews.current.find((r) => r.status === "pending")?.intent_id ?? "" };
    appendAudit(data, { type: "review.decision", actor: "owner", correlationId: intentId, detail: `${decision}; effect=none` }, now);
    return updated;
  });
}

export async function liveState(store: Store, cfg: JarvisConfig, now = new Date()) {
  const data = await store.read();
  const sync = data.sync.shopify;
  const provenance = cfg.shopify ? freshness(sync, cfg.staleAfterMinutes, now) : "UNKNOWN";
  const orders = Object.values(data.orders);
  const shopify: ConnectionInfo = {
    id: "shopify", name: "SHOPIFY", icon: "S", connected: !!cfg.shopify && !!sync?.lastSuccessAt,
    statusText: cfg.shopify ? FRESH_TEXT[provenance] : "未設定",
  };
  const unconnected = (id: string, name: string): ConnectionInfo => ({ id, name: name.toUpperCase(), icon: name[0], connected: false, statusText: "未接続" });
  const system: SystemStatus = {
    mode: "READ_ONLY", encryption_configured: true, build_version: "0.2.0", live_operations_enabled: false, model_requests_count: 0,
    connections: [shopify, unconnected("gmail", "Gmail"), unconnected("calendar", "Calendar"), unconnected("ticktick", "TickTick")],
    agents: [],
  };
  const recentCount = orders.filter((o) => now.getTime() - Date.parse(o.processedAt) <= 86_400_000).length;
  const lanes: Lane[] = [
    { source: "shopify", label: "shopify", ids: ["shopify"], detail: cfg.shopify ? `注文 ${recentCount}件（24時間）` : "未設定", connected: !!cfg.shopify },
    { source: "gmail", label: "gmail", ids: [], detail: "未接続", connected: false },
    { source: "calendar", label: "calendar", ids: [], detail: "未接続", connected: false },
  ];
  return {
    mode: "READ_ONLY" as const,
    provenance,
    sync: sync ? { lastSuccessAt: sync.lastSuccessAt, lastAttemptAt: sync.lastAttemptAt, lastError: sync.lastError } : null,
    events: data.events.slice(0, 30),
    approvals: data.reviews.current,
    run: data.run,
    briefing: data.briefing,
    summary: buildLiveSummary(orders, now, provenance, sync?.lastSuccessAt ?? null),
    system,
    lanes,
    audit: data.audit.slice(-30).reverse(),
  };
}
