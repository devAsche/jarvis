import { createHmac, timingSafeEqual } from "node:crypto";
import type { ShopifyConfig } from "../config.ts";
import type { OrderRecord } from "../store.ts";
import { toMinor } from "../money.ts";

// Read-only Shopify adapter (GraphQL Admin API). Scope needed: read_orders. No mutations exist here.

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const REQUEST_TIMEOUT_MS = 15_000;
/** Every Shopify call is bounded so a hung connection fails the sync instead of leaving a run "running" forever. */
async function call(fetchImpl: FetchLike, url: string, init: RequestInit): Promise<Response> {
  try { return await fetchImpl(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }); }
  catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    throw new ShopifyError(timedOut ? "Shopify did not respond in time" : "could not reach Shopify", true);
  }
}

export class ShopifyError extends Error {
  readonly retryable: boolean;
  constructor(message: string, retryable: boolean) { super(message); this.name = "ShopifyError"; this.retryable = retryable; }
}

const tokenCache = new Map<string, { token: string; expiresAt: number }>();
export const clearShopifyTokenCache = () => tokenCache.clear();

/** Client credentials grant (Dev Dashboard app installed on the owner's own store). Tokens last ~24h. */
export async function getAccessToken(cfg: ShopifyConfig, fetchImpl: FetchLike, now = Date.now()): Promise<string> {
  const cached = tokenCache.get(cfg.shop);
  if (cached && cached.expiresAt - 5 * 60 * 1000 > now) return cached.token;
  const response = await call(fetchImpl, `https://${cfg.shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: cfg.clientId, client_secret: cfg.clientSecret, grant_type: "client_credentials" }),
  });
  if (!response.ok) throw new ShopifyError(`token request failed (HTTP ${response.status})`, response.status >= 500 || response.status === 429);
  const body = await response.json() as { access_token?: unknown; expires_in?: unknown };
  if (typeof body.access_token !== "string") throw new ShopifyError("token response missing access_token", false);
  const ttl = typeof body.expires_in === "number" ? body.expires_in : 3600;
  tokenCache.set(cfg.shop, { token: body.access_token, expiresAt: now + ttl * 1000 });
  return body.access_token;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function graphql<T>(cfg: ShopifyConfig, fetchImpl: FetchLike, query: string, variables: Record<string, unknown>, wait = sleep): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const token = await getAccessToken(cfg, fetchImpl);
    const response = await call(fetchImpl, `https://${cfg.shop}/admin/api/${cfg.apiVersion}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      body: JSON.stringify({ query, variables }),
    });
    if (response.status === 401) { tokenCache.delete(cfg.shop); throw new ShopifyError("unauthorized (check app install and read_orders scope)", false); }
    if (response.status === 429 || response.status >= 500) { await wait(500 * 2 ** attempt); continue; }
    if (!response.ok) throw new ShopifyError(`GraphQL HTTP ${response.status}`, false);
    const body = await response.json() as { data?: T; errors?: Array<{ message?: string; extensions?: { code?: string } }> };
    if (body.errors?.some((e) => e.extensions?.code === "THROTTLED")) { await wait(1000 * 2 ** attempt); continue; }
    if (body.errors?.length) throw new ShopifyError(`GraphQL error: ${body.errors.map((e) => e.message).join("; ").slice(0, 200)}`, false);
    if (!body.data) throw new ShopifyError("GraphQL response without data", false);
    return body.data;
  }
  throw new ShopifyError("rate limited or unavailable after retries", true);
}

const ORDERS_QUERY = `query JarvisOrders($first: Int!, $after: String, $query: String) {
  orders(first: $first, after: $after, query: $query, sortKey: UPDATED_AT) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id name processedAt updatedAt cancelledAt displayFinancialStatus displayFulfillmentStatus
      currentTotalPriceSet { shopMoney { amount currencyCode } }
      totalShippingPriceSet { shopMoney { amount currencyCode } }
    }
  }
}`;

interface MoneyBag { shopMoney?: { amount?: string; currencyCode?: string } }
interface OrderNode {
  id: string; name: string; processedAt: string; updatedAt: string; cancelledAt: string | null;
  displayFinancialStatus: string | null; displayFulfillmentStatus: string | null;
  currentTotalPriceSet: MoneyBag; totalShippingPriceSet: MoneyBag | null;
}

export function mapOrderNode(node: OrderNode): OrderRecord | null {
  const currency = node.currentTotalPriceSet?.shopMoney?.currencyCode;
  if (!node.id || !currency) return null;
  const total = toMinor(node.currentTotalPriceSet.shopMoney?.amount, currency);
  if (total === null) return null;
  return {
    id: node.id, name: node.name, processedAt: node.processedAt, updatedAt: node.updatedAt, currency,
    totalMinor: total,
    shippingMinor: toMinor(node.totalShippingPriceSet?.shopMoney?.amount, currency),
    financialStatus: node.displayFinancialStatus ?? "UNKNOWN",
    fulfillmentStatus: node.displayFulfillmentStatus ?? "UNKNOWN",
    cancelled: !!node.cancelledAt,
  };
}

/** Orders updated after `since` (ISO). Bounded to 20 pages × 50 orders per sync. */
export async function fetchOrdersSince(cfg: ShopifyConfig, fetchImpl: FetchLike, since: string, wait = sleep): Promise<OrderRecord[]> {
  const out: OrderRecord[] = [];
  let after: string | null = null;
  for (let page = 0; page < 20; page++) {
    const data: { orders: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: OrderNode[] } } =
      await graphql(cfg, fetchImpl, ORDERS_QUERY, { first: 50, after, query: `updated_at:>'${since}'` }, wait);
    for (const node of data.orders.nodes) { const mapped = mapOrderNode(node); if (mapped) out.push(mapped); }
    if (!data.orders.pageInfo.hasNextPage || !data.orders.pageInfo.endCursor) break;
    after = data.orders.pageInfo.endCursor;
  }
  return out;
}

/** Webhook payloads use the REST order shape. */
export function mapWebhookOrder(payload: Record<string, unknown>): OrderRecord | null {
  const set = (key: string) => (payload[key] as { shop_money?: { amount?: string; currency_code?: string } } | undefined)?.shop_money;
  const total = set("current_total_price_set");
  const currency = total?.currency_code ?? (typeof payload.currency === "string" ? payload.currency : undefined);
  const id = typeof payload.admin_graphql_api_id === "string" ? payload.admin_graphql_api_id : null;
  if (!id || !currency) return null;
  const totalMinor = toMinor(total?.amount ?? (payload.current_total_price as string | undefined), currency);
  if (totalMinor === null) return null;
  return {
    id,
    name: String(payload.name ?? ""),
    processedAt: String(payload.processed_at ?? payload.created_at ?? ""),
    updatedAt: String(payload.updated_at ?? ""),
    currency,
    totalMinor,
    shippingMinor: toMinor(set("total_shipping_price_set")?.amount, currency),
    financialStatus: String(payload.financial_status ?? "unknown").toUpperCase(),
    fulfillmentStatus: payload.fulfillment_status ? String(payload.fulfillment_status).toUpperCase() : "UNFULFILLED",
    cancelled: !!payload.cancelled_at,
  };
}

/** base64(HMAC-SHA256(rawBody, clientSecret)) compared in constant time. */
export function verifyWebhookHmac(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const computed = Buffer.from(createHmac("sha256", secret).update(rawBody, "utf8").digest("base64"));
  const provided = Buffer.from(header);
  return computed.length === provided.length && timingSafeEqual(computed, provided);
}
