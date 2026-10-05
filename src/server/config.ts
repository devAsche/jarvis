// Server-only runtime configuration. Secrets come from the environment (.env.local / platform secret store).
// Missing or partial configuration always falls back to the safe side: DEMO, or READ_ONLY with the source "not connected".

export type RuntimeMode = "DEMO" | "READ_ONLY";

export interface ShopifyConfig {
  shop: string; // e.g. "my-store.myshopify.com"
  clientId: string;
  clientSecret: string;
  apiVersion: string;
}

export interface JarvisConfig {
  mode: RuntimeMode;
  /** Why READ_ONLY was refused, if it was requested but unsafe to enable. */
  modeProblem: string | null;
  ownerPasswordHash: string | null;
  sessionSecret: string | null;
  cronSecret: string | null;
  dataDir: string;
  shopify: ShopifyConfig | null;
  /** Per-currency shipping estimate (minor units) used by the shipping rule; null = rule off. */
  shippingEstimateMinor: Record<string, number> | null;
  /** Minutes after which a successful sync is shown as STALE. */
  staleAfterMinutes: number;
}

export const SHOPIFY_API_VERSION = "2026-10";

function parseEstimates(raw: string | undefined): Record<string, number> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;
    const out: Record<string, number> = {};
    for (const [currency, value] of Object.entries(parsed)) {
      if (/^[A-Z]{3}$/.test(currency) && Number.isInteger(value) && (value as number) >= 0) out[currency] = value as number;
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

export function readConfig(env: Record<string, string | undefined> = process.env): JarvisConfig {
  const shopRaw = env.SHOPIFY_SHOP?.trim().toLowerCase();
  const shop = shopRaw && /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shopRaw) ? shopRaw : null;
  const shopify = shop && env.SHOPIFY_CLIENT_ID && env.SHOPIFY_CLIENT_SECRET
    ? { shop, clientId: env.SHOPIFY_CLIENT_ID, clientSecret: env.SHOPIFY_CLIENT_SECRET, apiVersion: env.SHOPIFY_API_VERSION || SHOPIFY_API_VERSION }
    : null;
  const ownerPasswordHash = env.JARVIS_OWNER_PASSWORD_HASH?.startsWith("scrypt:") ? env.JARVIS_OWNER_PASSWORD_HASH : null;
  const sessionSecret = env.JARVIS_SESSION_SECRET && env.JARVIS_SESSION_SECRET.length >= 32 ? env.JARVIS_SESSION_SECRET : null;

  let mode: RuntimeMode = "DEMO";
  let modeProblem: string | null = null;
  if (env.JARVIS_MODE === "READ_ONLY") {
    // Real data is never served without an owner login.
    if (!ownerPasswordHash || !sessionSecret) modeProblem = "READ_ONLY requires JARVIS_OWNER_PASSWORD_HASH and JARVIS_SESSION_SECRET (32+ chars).";
    else mode = "READ_ONLY";
  }

  const stale = Number(env.JARVIS_STALE_AFTER_MINUTES);
  return {
    mode,
    modeProblem,
    ownerPasswordHash,
    sessionSecret,
    cronSecret: env.JARVIS_CRON_SECRET && env.JARVIS_CRON_SECRET.length >= 32 ? env.JARVIS_CRON_SECRET : null,
    dataDir: env.JARVIS_DATA_DIR || ".data",
    shopify,
    shippingEstimateMinor: parseEstimates(env.JARVIS_SHIPPING_ESTIMATE_MINOR),
    staleAfterMinutes: Number.isFinite(stale) && stale > 0 ? stale : 90,
  };
}
