import { demoWriteAllowed, recordDemoDecision } from "../../../../../lib/demoStore.ts";
import { decideLive } from "../../../../../server/live.ts";
import { getConfig, getStore, json, ownerWriteAllowed } from "../../../../../server/runtime.ts";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const cfg = getConfig();
  const allowed = cfg.mode === "DEMO" ? demoWriteAllowed(request) : ownerWriteAllowed(request, cfg);
  if (!allowed) return json({ error: "Not allowed" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "JSON required" }, 415);
  const body = await request.text();
  if (body.length > 256) return json({ error: "Payload too large" }, 413);
  let input: unknown;
  try { input = JSON.parse(body); } catch { return json({ error: "Invalid JSON" }, 400); }
  const decision = typeof input === "object" && input !== null && "decision" in input ? input.decision : undefined;
  if (decision !== "approved" && decision !== "rejected") return json({ error: "Invalid decision" }, 400);
  const { id } = await context.params;
  const updated = cfg.mode === "DEMO" ? recordDemoDecision(id, decision) : await decideLive(getStore(cfg), id, decision);
  return updated ? json({ mode: cfg.mode, effect: "none", approval: updated }) : json({ error: "Unknown, expired, changed or already decided" }, 409);
}
