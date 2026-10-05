import { initialApprovals, initialBriefing, initialEvents } from "../fixtures/index.ts";
import { SourceEventEnvelopeSchema, type ApprovalItem, type MorningBriefing, type SourceEventEnvelope, type TaskRun } from "../contracts/index.ts";
import { acceptDemoEvent, decideDemoApproval } from "./demoSafety.ts";

// ponytail: one process-local demo store; use durable storage before multi-worker deployment.
type DemoState = { events: SourceEventEnvelope[]; approvals: ApprovalItem[]; originalApprovals: ApprovalItem[]; run: TaskRun | null; briefing: MorningBriefing };
const shared = globalThis as typeof globalThis & { __jarvisDemoState?: DemoState };
const demo = shared.__jarvisDemoState ??= {
  events: [...initialEvents].sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at)), approvals: initialApprovals.map((item) => ({ ...item })), originalApprovals: initialApprovals.map((item) => ({ ...item })),
  run: null, briefing: initialBriefing,
};

export function validDemoSources(items: SourceEventEnvelope[], approvalTarget: string): boolean {
  if (items.length !== 4 || new Set(items.map((item) => item.event_id)).size !== 4) return false;
  if (!items.every((item) => item.mode === "DEMO" && item.source_freshness === "DEMO" && item.source.startsWith("fixture."))) return false;
  const order = items.find((item) => item.event_id === "demo_001");
  const mixes = items.filter((item) => item.type === "creative.mix.lead");
  const calendar = items.find((item) => item.event_id === "demo_005");
  return order?.data.order_id === approvalTarget &&
    typeof order.data.estimated_shipping_minor === "number" &&
    typeof order.data.quoted_shipping_minor === "number" &&
    order.data.quoted_shipping_minor > order.data.estimated_shipping_minor &&
    mixes.length === 2 && new Set(mixes.map((item) => item.data.request_id)).size === 2 &&
    typeof calendar?.data.starts_at === "string" && Number.isFinite(Date.parse(calendar.data.starts_at));
}

function audit(type: string, taskRunId: string, message: string) {
  const now = new Date().toISOString();
  demo.events = acceptDemoEvent(demo.events, {
    event_id: crypto.randomUUID(), source: "fixture.demo-run", type, mode: "DEMO",
    occurred_at: now, received_at: now, source_freshness: "DEMO",
    correlation_id: taskRunId, data: { message, taskRunId },
  });
}

export function startDemoRun(input: "text" | "voice", now = new Date()): TaskRun {
  if (demo.run?.status === "running") return { ...demo.run };
  if (demo.run && demo.approvals[0].status !== "pending") return { ...demo.run };
  demo.run = {
    taskRunId: crypto.randomUUID(), status: "running",
    operationalState: "delegating", mode: "DEMO",
    sourceRefs: [], reason: "Fixture READを照合中",
    startedAt: now.toISOString(), approvalId: demo.originalApprovals[0].intent_id,
    jobs: [],
  };
  const taskRunId = demo.run.taskRunId;
  audit("task.run.started", taskRunId, `${input} input; fixture READ started`);
  void Promise.all(["fixture.shopify", "fixture.gmail", "fixture.calendar"].map(async (source) =>
    initialEvents.filter((item) => item.source === source && ["demo_001", "demo_002", "demo_004", "demo_005"].includes(item.event_id))
  )).then((groups) => {
    if (demo.run?.taskRunId !== taskRunId) return;
    const sourceEvents = groups.flat();
    const valid = validDemoSources(sourceEvents, demo.originalApprovals[0].target_id);
    const order = sourceEvents.find((item) => item.event_id === "demo_001");
    const mixCount = sourceEvents.filter((item) => item.type === "creative.mix.lead").length;
    const sourceRefs = sourceEvents.map((item) => item.event_id);
    demo.run = {
      ...demo.run, operationalState: valid ? "executing" : "error", status: valid ? "running" : "failed",
      sourceRefs, reason: valid ? `Fixture READ: 送料差額 + MIX ${mixCount}件 + 予定1件を確認` : "Fixture provenance or shipping data inconsistent",
      jobs: sourceEvents.map((item) => ({ sourceId: item.event_id, reason: `${item.source} のサンプル事実を読み取る`, status: valid ? "succeeded" : "failed" })),
    };
    audit("task.run.fixture_read_complete", taskRunId, `${valid ? "verified" : "failed"}; source IDs: ${sourceRefs.join(", ")}; no external action`);
    if (!valid) return;
    demo.briefing = {
      ...initialBriefing, generated_at: now.toISOString(),
      sections: initialBriefing.sections.map((section) => ({
        ...section,
        items: section.items.map((item) => ({
          ...item,
          headline: item.id === "demo_shipping_alert" ? `サンプル注文1件の送料見積 ¥${order?.data.estimated_shipping_minor} → 請求 ¥${order?.data.quoted_shipping_minor}` : item.id === "demo_mix" ? `サンプルMIX問い合わせ ${mixCount}件` : item.headline,
          source: item.id === "demo_shipping_alert" ? "demo_001" : item.id === "demo_mix" ? "demo_002, demo_004" : item.id === "demo_focus" ? "demo_005" : "demo-rule",
        })),
      })),
    };
    demo.run = { ...demo.run, status: "waiting_approval", operationalState: "awaiting_approval" };
    audit("task.run.waiting_approval", taskRunId, `Briefing ready; source IDs: ${sourceRefs.join(", ")}`);
  }).catch(() => {
    if (demo.run?.taskRunId !== taskRunId) return;
    demo.run = { ...demo.run, status: "failed", operationalState: "error", reason: "Fixture READ failed" };
    audit("task.run.failed", taskRunId, "Fixture READ failed; no external action");
  });
  return { ...demo.run };
}

export function getDemoState() {
  return { mode: "DEMO" as const, events: [...demo.events], approvals: demo.approvals.map((item) => ({ ...item })), run: demo.run ? { ...demo.run } : null, briefing: demo.briefing };
}

export function addDemoEvent(input: unknown): { status: "added" | "duplicate" | "invalid"; event?: SourceEventEnvelope } {
  const parsed = SourceEventEnvelopeSchema.safeParse(input);
  if (!parsed.success || parsed.data.mode !== "DEMO" || parsed.data.source_freshness !== "DEMO" || !parsed.data.source.startsWith("fixture.")) {
    return { status: "invalid" };
  }
  const updated = acceptDemoEvent(demo.events, parsed.data);
  if (updated === demo.events) return { status: "duplicate" };
  demo.events = updated;
  return { status: "added", event: parsed.data };
}

export function recordDemoDecision(intentId: string, decision: "approved" | "rejected", now = new Date()): ApprovalItem | null {
  const original = demo.originalApprovals.find((item) => item.intent_id === intentId);
  const current = demo.approvals.find((item) => item.intent_id === intentId);
  if (!original || !current) return null;
  const updated = decideDemoApproval(current, original, intentId, decision, now);
  if (!updated) return null;
  demo.approvals = demo.approvals.map((item) => item.intent_id === intentId ? updated : item);
  if (demo.run?.approvalId === intentId && demo.run.status === "waiting_approval") {
    demo.run = { ...demo.run, status: "succeeded", operationalState: "idle" };
    audit("task.run.demo_decision", demo.run.taskRunId, `${decision}; effect=none; idempotency=${intentId}`);
  } else {
    audit("approval.demo_decision", intentId, `${decision}; effect=none`);
  }
  return { ...updated };
}

export function demoWriteAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host") ?? new URL(request.url).host;
  try { return process.env.NODE_ENV !== "production" && !!origin && new URL(origin).host === host; }
  catch { return false; }
}
