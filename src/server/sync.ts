import type { JarvisConfig } from "./config.ts";
import type { DataProvenance, SourceEventEnvelope } from "../contracts/index.ts";
import { appendAudit, emptySync, type OrderRecord, type Store, type StoreData, type SyncState } from "./store.ts";
import { fetchOrdersSince, ShopifyError, type FetchLike } from "./providers/shopify.ts";

const INITIAL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Insert or update an order only when the incoming version is newer. Returns true when stored data changed. */
export function upsertOrder(data: StoreData, order: OrderRecord, via: "sync" | "webhook", now = new Date()): boolean {
  const current = data.orders[order.id];
  if (current && Date.parse(current.updatedAt) >= Date.parse(order.updatedAt)) return false;
  data.orders[order.id] = order;
  const event: SourceEventEnvelope = {
    event_id: `${order.id}@${order.updatedAt}`,
    source: "shopify",
    type: current ? "commerce.order.updated" : "commerce.order.received",
    mode: "READ_ONLY",
    occurred_at: order.updatedAt,
    received_at: now.toISOString(),
    source_freshness: "LIVE_VERIFIED",
    correlation_id: order.id,
    data: { order: order.name, via },
  };
  if (!data.events.some((e) => e.source === event.source && e.event_id === event.event_id)) {
    data.events = [event, ...data.events].sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at));
  }
  return true;
}

/** Errors are summarised without tokens or response bodies. */
const describe = (error: unknown) => error instanceof ShopifyError ? error.message : "unexpected sync failure";

export async function syncShopify(store: Store, cfg: JarvisConfig, fetchImpl: FetchLike, now = new Date()): Promise<{ ok: boolean; changed: number; error?: string }> {
  if (!cfg.shopify) return { ok: false, changed: 0, error: "Shopify is not configured" };
  const before = (await store.read()).sync.shopify ?? emptySync();
  const since = before.cursor ?? new Date(now.getTime() - INITIAL_WINDOW_MS).toISOString();
  try {
    const orders = await fetchOrdersSince(cfg.shopify, fetchImpl, since);
    return await store.update((data) => {
      let changed = 0;
      for (const order of orders) if (upsertOrder(data, order, "sync", now)) changed++;
      const cursor = orders.reduce((max, o) => (Date.parse(o.updatedAt) > Date.parse(max) ? o.updatedAt : max), before.cursor ?? since);
      data.sync.shopify = { lastAttemptAt: now.toISOString(), lastSuccessAt: now.toISOString(), lastError: null, consecutiveFailures: 0, cursor };
      appendAudit(data, { type: "sync.shopify.succeeded", actor: "system", correlationId: "shopify", detail: `read ${orders.length} orders, ${changed} changed; read-only` }, now);
      return { ok: true, changed };
    });
  } catch (error) {
    const message = describe(error);
    await store.update((data) => {
      const prev = data.sync.shopify ?? emptySync();
      data.sync.shopify = { ...prev, lastAttemptAt: now.toISOString(), lastError: message, consecutiveFailures: prev.consecutiveFailures + 1 };
      appendAudit(data, { type: "sync.shopify.failed", actor: "system", correlationId: "shopify", detail: message }, now);
    });
    return { ok: false, changed: 0, error: message };
  }
}

/** LIVE_VERIFIED only while the last attempt succeeded recently; never-synced data is UNKNOWN. */
export function freshness(sync: SyncState | undefined, staleAfterMinutes: number, now = new Date()): DataProvenance {
  if (!sync?.lastSuccessAt) return "UNKNOWN";
  if (sync.consecutiveFailures > 0) return "STALE";
  return now.getTime() - Date.parse(sync.lastSuccessAt) > staleAfterMinutes * 60 * 1000 ? "STALE" : "LIVE_VERIFIED";
}
