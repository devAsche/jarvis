import { getDemoState } from "../../../lib/demoStore.ts";
import { initialBusinessSummary, initialSystemStatus } from "../../../fixtures/index.ts";
import { demoLanes } from "../../../server/demoLanes.ts";
import { liveState } from "../../../server/live.ts";
import { getConfig, getStore, isOwner, json } from "../../../server/runtime.ts";

export async function GET(request: Request) {
  const cfg = getConfig();
  if (cfg.mode === "DEMO") {
    const demo = getDemoState();
    return json({ ...demo, provenance: "DEMO", modeProblem: cfg.modeProblem, summary: initialBusinessSummary, system: initialSystemStatus, lanes: demoLanes(demo.events), sync: null, audit: [] });
  }
  if (!isOwner(request, cfg)) return json({ mode: "READ_ONLY", login: true }, 401);
  return json(await liveState(getStore(cfg), cfg));
}
