import { addDemoEvent, demoWriteAllowed } from "../../../../lib/demoStore.ts";

export async function POST(request: Request) {
  if (!demoWriteAllowed(request)) return Response.json({ error: "Demo writes disabled" }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({ error: "JSON required" }, { status: 415 });
  const body = await request.text();
  if (body.length > 8192) return Response.json({ error: "Payload too large" }, { status: 413 });
  let input: unknown;
  try { input = JSON.parse(body); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const result = addDemoEvent(input);
  return Response.json(result, { status: result.status === "invalid" ? 400 : result.status === "added" ? 201 : 200 });
}
