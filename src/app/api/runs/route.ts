import { demoWriteAllowed, startDemoRun } from "../../../lib/demoStore.ts";
import { startLiveRun } from "../../../server/live.ts";
import { getConfig, getStore, json, ownerWriteAllowed } from "../../../server/runtime.ts";

export async function POST(request: Request) {
  const cfg = getConfig();
  const allowed = cfg.mode === "DEMO" ? demoWriteAllowed(request) : ownerWriteAllowed(request, cfg);
  if (!allowed) return json({ error: "Not allowed" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "JSON required" }, 415);
  const body = await request.text();
  if (body.length > 256) return json({ error: "Payload too large" }, 413);
  let input: unknown;
  try { input = JSON.parse(body); } catch { return json({ error: "Invalid JSON" }, 400); }
  const kind = typeof input === "object" && input !== null && "input" in input ? input.input : undefined;
  if (kind !== "text" && kind !== "voice") return json({ error: "Invalid input" }, 400);
  if (cfg.mode === "DEMO") return json({ mode: "DEMO", effect: "none", run: startDemoRun(kind) }, 201);
  const { run } = await startLiveRun(getStore(cfg), cfg, fetch, kind);
  return json({ mode: "READ_ONLY", effect: "none", run }, 201);
}
