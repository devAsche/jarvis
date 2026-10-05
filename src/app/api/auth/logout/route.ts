import { clearedSessionCookie, sameOrigin } from "../../../../server/auth.ts";
import { json } from "../../../../server/runtime.ts";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Not allowed" }, 403);
  return json({ ok: true }, 200, { "Set-Cookie": clearedSessionCookie(process.env.NODE_ENV === "production") });
}
