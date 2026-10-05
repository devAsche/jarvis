import { mapWebhookOrder, verifyWebhookHmac } from "../../../../server/providers/shopify.ts";
import { upsertOrder } from "../../../../server/sync.ts";
import { appendAudit } from "../../../../server/store.ts";
import { getConfig, getStore, json } from "../../../../server/runtime.ts";

const TOPICS = new Set(["orders/create", "orders/updated", "orders/paid", "orders/cancelled", "orders/fulfilled"]);

// Read-only ingestion: verify HMAC on the raw body, drop duplicate deliveries, store the order snapshot.
export async function POST(request: Request) {
  const cfg = getConfig();
  if (cfg.mode !== "READ_ONLY" || !cfg.shopify) return json({ error: "Not enabled" }, 404);
  const raw = await request.text();
  if (raw.length > 512 * 1024) return json({ error: "Payload too large" }, 413);
  if (!verifyWebhookHmac(raw, request.headers.get("x-shopify-hmac-sha256"), cfg.shopify.clientSecret)) return json({ error: "Invalid signature" }, 401);
  if (request.headers.get("x-shopify-shop-domain") !== cfg.shopify.shop) return json({ error: "Unknown shop" }, 401);
  const topic = request.headers.get("x-shopify-topic") ?? "";
  const deliveryId = request.headers.get("x-shopify-webhook-id") ?? "";
  if (!deliveryId) return json({ error: "Missing webhook id" }, 400);
  if (!TOPICS.has(topic)) return json({ ignored: topic });
  let payload: Record<string, unknown>;
  try { payload = JSON.parse(raw) as Record<string, unknown>; } catch { return json({ error: "Invalid JSON" }, 400); }
  const order = mapWebhookOrder(payload);
  const result = await getStore(cfg).update((data) => {
    if (data.deliveries.includes(deliveryId)) return "duplicate";
    data.deliveries.push(deliveryId);
    if (!order) { appendAudit(data, { type: "webhook.shopify.unparsed", actor: "shopify", correlationId: deliveryId, detail: topic }); return "unparsed"; }
    const changed = upsertOrder(data, order, "webhook");
    appendAudit(data, { type: "webhook.shopify.received", actor: "shopify", correlationId: deliveryId, detail: `${topic}; ${changed ? "stored" : "older version ignored"}` });
    return changed ? "stored" : "older";
  });
  return json({ result });
}
