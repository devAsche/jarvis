import { readConfig, type JarvisConfig } from "./config.ts";
import { createFileStore, type Store } from "./store.ts";
import { readCookie, SESSION_COOKIE, sameOrigin, verifySession } from "./auth.ts";

// Process-wide singletons for route handlers. Requires a long-running Node server (not serverless):
// the store is a local file and live runs finish in the background after the response.
const g = globalThis as typeof globalThis & { __jarvisStore?: { dir: string; store: Store } };

export function getConfig(): JarvisConfig { return readConfig(); }

export function getStore(cfg = getConfig()): Store {
  if (!g.__jarvisStore || g.__jarvisStore.dir !== cfg.dataDir) g.__jarvisStore = { dir: cfg.dataDir, store: createFileStore(cfg.dataDir) };
  return g.__jarvisStore.store;
}

export function isOwner(request: Request, cfg: JarvisConfig): boolean {
  return !!cfg.sessionSecret && verifySession(readCookie(request, SESSION_COOKIE), cfg.sessionSecret);
}

/** Owner session + same origin, for every state-changing READ_ONLY call. */
export function ownerWriteAllowed(request: Request, cfg: JarvisConfig): boolean {
  return isOwner(request, cfg) && sameOrigin(request);
}

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
