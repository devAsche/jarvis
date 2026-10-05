import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { readConfig } from "../src/server/config.ts";
import { createSession, hashPassword, verifyPassword, verifySession } from "../src/server/auth.ts";
import { toMinor } from "../src/server/money.ts";
import { createFileStore, createMemoryStore } from "../src/server/store.ts";
import { clearShopifyTokenCache, mapWebhookOrder, verifyWebhookHmac } from "../src/server/providers/shopify.ts";
import { freshness, syncShopify } from "../src/server/sync.ts";
import { buildLiveBriefing, buildReviews } from "../src/server/rules.ts";
import { decideLive, liveState, startLiveRun } from "../src/server/live.ts";

const NOW = new Date("2026-10-05T00:00:00Z");
const SECRET = "x".repeat(40);
const shopifyCfg = (extra = {}) => readConfig({
  JARVIS_MODE: "READ_ONLY", JARVIS_OWNER_PASSWORD_HASH: hashPassword("pw"), JARVIS_SESSION_SECRET: SECRET,
  SHOPIFY_SHOP: "demo-store.myshopify.com", SHOPIFY_CLIENT_ID: "id", SHOPIFY_CLIENT_SECRET: "shh",
  JARVIS_SHIPPING_ESTIMATE_MINOR: '{"JPY": 900}', ...extra,
});

const node = (id, hoursAgo, { total = "4900", ship = "1550", fin = "PAID", ful = "UNFULFILLED" } = {}) => {
  const at = new Date(NOW.getTime() - hoursAgo * 3600_000).toISOString();
  return { id: `gid://shopify/Order/${id}`, name: `#${id}`, processedAt: at, updatedAt: at, cancelledAt: null,
    displayFinancialStatus: fin, displayFulfillmentStatus: ful,
    currentTotalPriceSet: { shopMoney: { amount: total, currencyCode: "JPY" } }, totalShippingPriceSet: { shopMoney: { amount: ship, currencyCode: "JPY" } } };
};

function fakeShopify(nodes, { failGraphql = false } = {}) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, headers: init?.headers, body: init?.body });
    if (url.endsWith("/admin/oauth/access_token")) return Response.json({ access_token: "shpat_test", expires_in: 86399, scope: "read_orders" });
    if (failGraphql) return new Response("nope", { status: 403 });
    assert.ok(!String(init.body).includes("mutation"), "adapter must never send mutations");
    return Response.json({ data: { orders: { pageInfo: { hasNextPage: false, endCursor: null }, nodes } } });
  };
  return { impl, calls };
}

test("config refuses READ_ONLY without owner auth and validates the shop domain", () => {
  assert.equal(readConfig({ JARVIS_MODE: "READ_ONLY" }).mode, "DEMO");
  assert.match(readConfig({ JARVIS_MODE: "READ_ONLY" }).modeProblem, /requires/);
  assert.equal(readConfig({ SHOPIFY_SHOP: "evil.com", SHOPIFY_CLIENT_ID: "a", SHOPIFY_CLIENT_SECRET: "b" }).shopify, null);
  assert.equal(shopifyCfg().mode, "READ_ONLY");
});

test("owner password and session tokens", () => {
  const stored = hashPassword("correct horse");
  assert.equal(verifyPassword("correct horse", stored), true);
  assert.equal(verifyPassword("wrong", stored), false);
  const { token } = createSession(SECRET, NOW.getTime());
  assert.equal(verifySession(token, SECRET, NOW.getTime() + 1000), true);
  assert.equal(verifySession(token, SECRET, NOW.getTime() + 13 * 3600_000), false, "expired");
  assert.equal(verifySession(token, "y".repeat(40), NOW.getTime()), false, "wrong secret");
  assert.equal(verifySession(token.replace(/.$/, (c) => (c === "A" ? "B" : "A")), SECRET, NOW.getTime()), false, "tampered");
});

test("money conversion uses currency decimals without floats", () => {
  assert.equal(toMinor("4900", "JPY"), 4900);
  assert.equal(toMinor("598.94", "USD"), 59894);
  assert.equal(toMinor("0.1", "USD"), 10);
  assert.equal(toMinor("abc", "USD"), null);
});

test("webhook HMAC is checked over the raw body", () => {
  const body = JSON.stringify({ id: 1 });
  const good = createHmac("sha256", "shh").update(body).digest("base64");
  assert.equal(verifyWebhookHmac(body, good, "shh"), true);
  assert.equal(verifyWebhookHmac(body + " ", good, "shh"), false);
  assert.equal(verifyWebhookHmac(body, null, "shh"), false);
  const order = mapWebhookOrder({ admin_graphql_api_id: "gid://shopify/Order/9", name: "#9", processed_at: NOW.toISOString(), updated_at: NOW.toISOString(), financial_status: "paid", current_total_price_set: { shop_money: { amount: "12.50", currency_code: "USD" } } });
  assert.equal(order.totalMinor, 1250);
  assert.equal(order.financialStatus, "PAID");
});

test("sync is read-only, idempotent, and marks failures STALE without deleting data", async () => {
  clearShopifyTokenCache();
  const store = createMemoryStore();
  const cfg = shopifyCfg();
  const { impl, calls } = fakeShopify([node(1, 2), node(2, 60)]);
  const first = await syncShopify(store, cfg, impl, NOW);
  assert.deepEqual(first, { ok: true, changed: 2 });
  assert.equal(calls.filter((c) => c.url.includes("graphql.json")).every((c) => c.headers["X-Shopify-Access-Token"] === "shpat_test"), true);
  assert.equal((await syncShopify(store, cfg, impl, NOW)).changed, 0, "same versions are not re-stored");
  assert.equal(freshness((await store.read()).sync.shopify, 90, NOW), "LIVE_VERIFIED");
  assert.equal(freshness((await store.read()).sync.shopify, 90, new Date(NOW.getTime() + 2 * 3600_000)), "STALE");
  clearShopifyTokenCache();
  const failed = await syncShopify(store, cfg, fakeShopify([], { failGraphql: true }).impl, NOW);
  assert.equal(failed.ok, false);
  assert.doesNotMatch(failed.error, /shpat|shh/, "errors never contain secrets");
  const after = await store.read();
  assert.equal(Object.keys(after.orders).length, 2);
  assert.equal(freshness(after.sync.shopify, 90, NOW), "STALE");
  assert.equal(freshness(undefined, 90, NOW), "UNKNOWN");
});

test("rules are deterministic: stuck orders, shipping over estimate, per-currency totals", () => {
  const orders = [node(1, 2), node(2, 60, { ship: "500" }), node(3, 70, { ful: "FULFILLED" })].map((n) => ({
    id: n.id, name: n.name, processedAt: n.processedAt, updatedAt: n.updatedAt, currency: "JPY", totalMinor: 4900,
    shippingMinor: Number(n.totalShippingPriceSet.shopMoney.amount), financialStatus: n.displayFinancialStatus, fulfillmentStatus: n.displayFulfillmentStatus, cancelled: false,
  }));
  const input = { orders, now: NOW, shippingEstimateMinor: { JPY: 900 } };
  const brief = buildLiveBriefing(input);
  assert.equal(brief.data_mode, "READ_ONLY");
  assert.equal(brief.sections.find((s) => s.kind === "pending").items.length, 1, "only #2 is paid, unfulfilled and >48h");
  assert.equal(brief.sections.find((s) => s.kind === "anomalies").items.length, 1, "only #1 (recent) exceeds the estimate");
  const reviews = buildReviews(input);
  assert.deepEqual(reviews.map((r) => r.action_type).sort(), ["review.shipping_over_estimate", "review.unfulfilled_order"]);
  assert.deepEqual(buildReviews(input).map((r) => r.intent_id), reviews.map((r) => r.intent_id), "stable intent IDs");
  assert.equal(buildReviews({ ...input, shippingEstimateMinor: null }).length, 1, "shipping rule is off without an estimate");
});

test("live run: real taskRunId, sync job, reviews, one effect-free decision; file store persists", async () => {
  clearShopifyTokenCache();
  const dir = await mkdtemp(path.join(tmpdir(), "jarvis-"));
  const store = createFileStore(dir);
  const cfg = shopifyCfg();
  const { run, done } = await startLiveRun(store, cfg, fakeShopify([node(1, 2), node(2, 60)]).impl, "text", () => NOW);
  assert.equal(run.status, "running");
  assert.equal(run.mode, "READ_ONLY");
  await done;
  const state = await liveState(store, cfg, NOW);
  assert.equal(state.run.status, "waiting_approval");
  assert.equal(state.run.jobs[0].sourceId, "shopify");
  assert.equal(state.provenance, "LIVE_VERIFIED");
  assert.equal(state.system.live_operations_enabled, false);
  const pending = state.approvals.filter((a) => a.status === "pending");
  assert.equal(pending.length, 2);
  assert.equal((await decideLive(store, pending[0].intent_id, "approved", NOW)).reviewed_by, "owner");
  assert.equal(await decideLive(store, pending[0].intent_id, "approved", NOW), null, "duplicate decision rejected");
  assert.equal(await decideLive(store, pending[1].intent_id, "approved", new Date(NOW.getTime() + 25 * 3600_000)), null, "expired");
  await decideLive(store, pending[1].intent_id, "rejected", NOW);
  assert.equal((await liveState(store, cfg, NOW)).run.status, "succeeded");
  const disk = JSON.parse(await readFile(path.join(dir, "jarvis-store.json"), "utf8"));
  assert.ok(disk.audit.some((a) => a.type === "review.decision" && a.detail.includes("effect=none")));
  assert.doesNotMatch(JSON.stringify(disk), /shpat_|shh/, "no tokens or secrets persisted");
  assert.equal(Object.keys(createFileStore(dir) && disk.orders).length, 2);
});

test("network failures and hangs become a bounded, secret-free sync error", async () => {
  clearShopifyTokenCache();
  const store = createMemoryStore();
  const result = await syncShopify(store, shopifyCfg(), async (_url, init) => { assert.ok(init.signal, "every request carries a timeout signal"); throw new TypeError("fetch failed"); }, NOW);
  assert.deepEqual(result, { ok: false, changed: 0, error: "could not reach Shopify" });
  assert.equal((await store.read()).sync.shopify.consecutiveFailures, 1);
});
