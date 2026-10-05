import { createSession, loginAllowed, recordLoginFailure, sameOrigin, sessionCookie, verifyPassword } from "../../../../server/auth.ts";
import { getConfig, json } from "../../../../server/runtime.ts";

export async function POST(request: Request) {
  const cfg = getConfig();
  if (cfg.mode !== "READ_ONLY" || !cfg.ownerPasswordHash || !cfg.sessionSecret) return json({ error: "Login is not enabled" }, 404);
  if (!sameOrigin(request)) return json({ error: "Not allowed" }, 403);
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!loginAllowed(key)) return json({ error: "Too many attempts. Try again later." }, 429);
  const body = await request.text();
  if (body.length > 512) return json({ error: "Payload too large" }, 413);
  let password: unknown;
  try { password = (JSON.parse(body) as { password?: unknown }).password; } catch { return json({ error: "Invalid JSON" }, 400); }
  if (typeof password !== "string" || !verifyPassword(password, cfg.ownerPasswordHash)) {
    recordLoginFailure(key);
    return json({ error: "Wrong password" }, 401);
  }
  const { token, expiresAt } = createSession(cfg.sessionSecret);
  return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(token, expiresAt, process.env.NODE_ENV === "production") });
}
