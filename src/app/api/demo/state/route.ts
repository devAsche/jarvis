import { getDemoState } from "../../../../lib/demoStore.ts";
import { initialBusinessSummary, initialSystemStatus } from "../../../../fixtures/index.ts";

export function GET() {
  return Response.json({ ...getDemoState(), summary: initialBusinessSummary, system: initialSystemStatus }, {
    headers: { "Cache-Control": "no-store" },
  });
}
