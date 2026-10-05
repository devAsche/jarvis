import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Single-owner authentication: scrypt password hash + HMAC-signed, expiring session cookie.

export const SESSION_COOKIE = "jarvis_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function hashPassword(password: string, salt = randomBytes(16).toString("base64url")): string {
  const hash = scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 }).toString("base64url");
  return `scrypt:16384:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, n, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || n !== "16384" || !salt || !hash || password.length > 256) return false;
  const actual = scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 }).toString("base64url");
  return safeEqual(actual, hash);
}

const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");

export function createSession(secret: string, now = Date.now()): { token: string; expiresAt: number } {
  const expiresAt = now + SESSION_TTL_MS;
  const payload = `v1.${expiresAt}.${randomBytes(12).toString("base64url")}`;
  return { token: `${payload}.${sign(payload, secret)}`, expiresAt };
}

export function verifySession(token: string | undefined, secret: string, now = Date.now()): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return false;
  const payload = parts.slice(0, 3).join(".");
  if (!safeEqual(sign(payload, secret), parts[3])) return false;
  const expiresAt = Number(parts[1]);
  return Number.isFinite(expiresAt) && expiresAt > now;
}

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

export function sessionCookie(token: string, expiresAt: number, secure: boolean): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Expires=${new Date(expiresAt).toUTCString()}${secure ? "; Secure" : ""}`;
}

export const clearedSessionCookie = (secure: boolean) => `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}`;

/** Same-origin check for state-changing requests (CSRF defence alongside SameSite=Strict). */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host") ?? new URL(request.url).host;
  try { return !!origin && new URL(origin).host === host; } catch { return false; }
}

/** In-memory login throttle: 5 failures per 15 minutes per key. */
const failures = new Map<string, number[]>();
export function loginAllowed(key: string, now = Date.now()): boolean {
  const recent = (failures.get(key) ?? []).filter((t) => now - t < 15 * 60 * 1000);
  failures.set(key, recent);
  return recent.length < 5;
}
export function recordLoginFailure(key: string, now = Date.now()) {
  failures.set(key, [...(failures.get(key) ?? []), now]);
}
