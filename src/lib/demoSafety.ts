import { ApprovalItemSchema, SourceEventEnvelopeSchema, type ApprovalItem, type SourceEventEnvelope } from "../contracts/index.ts";

// M0 only: these functions never authorize or perform an external action.
export function acceptDemoEvent(existing: SourceEventEnvelope[], input: unknown): SourceEventEnvelope[] {
  const parsed = SourceEventEnvelopeSchema.safeParse(input);
  if (!parsed.success || parsed.data.mode !== "DEMO" || parsed.data.source_freshness !== "DEMO") return existing;
  const event = parsed.data;
  if (existing.some((item) => item.source === event.source && item.event_id === event.event_id && item.type === event.type)) return existing;
  return [event, ...existing].sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at));
}

export function decideDemoApproval(
  current: ApprovalItem,
  original: ApprovalItem,
  intentId: string,
  decision: "approved" | "rejected",
  now = new Date(),
  policy: { actionPrefix: "demo." | "review."; reviewer: string } = { actionPrefix: "demo.", reviewer: "local-demo-ui" },
): ApprovalItem | null {
  if (!ApprovalItemSchema.safeParse(current).success || !ApprovalItemSchema.safeParse(original).success) return null;
  if (decision !== "approved" && decision !== "rejected") return null;
  if (current.intent_id !== intentId || original.intent_id !== intentId || current.status !== "pending" || original.status !== "pending") return null;
  if (current.reviewed_at || current.reviewed_by || current.execution_ref) return null;
  if (!original.action_type.startsWith(policy.actionPrefix) || !Number.isFinite(now.getTime()) || Date.parse(current.expires_at) <= now.getTime()) return null;
  for (const field of ["action_type", "account", "target_id", "title", "description", "amount_cap_minor", "currency", "expires_at", "reason", "risk"] as const) {
    if (current[field] !== original[field]) return null;
  }
  return { ...current, status: decision, reviewed_by: policy.reviewer, reviewed_at: now.toISOString() };
}
