import { timingSafeEqual } from "node:crypto";
import { syncShopify } from "../../../../server/sync.ts";
import { getConfig, getStore, json } from "../../../../server/runtime.ts";

// Scheduler entry point (platform cron / uptime pinger). Bearer JARVIS_CRON_SECRET. Read-only sync only.
export async function POST(request: Request) {
  const cfg = getConfig();
  if (cfg.mode !== "READ_ONLY" || !cfg.cronSecret) return json({ error: "Not enabled" }, 404);
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${cfg.cronSecret}`);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return json({ error: "Unauthorized" }, 401);
  const result = await syncShopify(getStore(cfg), cfg, fetch);
  return json(result, result.ok ? 200 : 502);
}
