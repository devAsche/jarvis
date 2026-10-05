import { demoWriteAllowed, recordDemoDecision } from "../../../../../../lib/demoStore.ts";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!demoWriteAllowed(request)) return Response.json({ error: "Demo writes disabled" }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({ error: "JSON required" }, { status: 415 });
  const body = await request.text();
  if (body.length > 256) return Response.json({ error: "Payload too large" }, { status: 413 });
  let input: unknown;
  try { input = JSON.parse(body); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const decision = typeof input === "object" && input !== null && "decision" in input ? input.decision : undefined;
  if (decision !== "approved" && decision !== "rejected") return Response.json({ error: "Invalid decision" }, { status: 400 });
  const { id } = await context.params;
  const updated = recordDemoDecision(id, decision);
  return updated ? Response.json({ mode: "DEMO", effect: "none", approval: updated }) : Response.json({ error: "Unknown, expired, changed or already decided" }, { status: 409 });
}
