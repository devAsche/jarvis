import { demoWriteAllowed, startDemoRun } from "../../../../lib/demoStore.ts";

export async function POST(request: Request) {
  if (!demoWriteAllowed(request)) return Response.json({ error: "Demo writes disabled" }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({ error: "JSON required" }, { status: 415 });
  const body = await request.text();
  if (body.length > 256) return Response.json({ error: "Payload too large" }, { status: 413 });
  let input: unknown;
  try { input = JSON.parse(body); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (typeof input !== "object" || input === null || !("input" in input) || (input.input !== "text" && input.input !== "voice")) return Response.json({ error: "Invalid input" }, { status: 400 });
  return Response.json({ mode: "DEMO", effect: "none", run: startDemoRun(input.input) }, { status: 201 });
}
