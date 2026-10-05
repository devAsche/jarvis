import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { hashPassword } from "../src/server/auth.ts";

// Each test file runs in its own process, so READ_ONLY env here never leaks into DEMO tests.
Object.assign(process.env, {
  JARVIS_MODE: "READ_ONLY",
  JARVIS_OWNER_PASSWORD_HASH: hashPassword("open sesame"),
  JARVIS_SESSION_SECRET: "s".repeat(40),
  JARVIS_CRON_SECRET: "c".repeat(40),
  JARVIS_DATA_DIR: await mkdtemp(path.join(tmpdir(), "jarvis-routes-")),
  SHOPIFY_SHOP: "demo-store.myshopify.com", SHOPIFY_CLIENT_ID: "id", SHOPIFY_CLIENT_SECRET: "hook-secret",
});
const { GET: state } = await import("../src/app/api/state/route.ts");
const { POST: login } = await import("../src/app/api/auth/login/route.ts");
const { POST: runs } = await import("../src/app/api/runs/route.ts");
const { POST: webhook } = await import("../src/app/api/webhooks/shopify/route.ts");
const { POST: cron } = await import("../src/app/api/cron/sync/route.ts");
const { POST: demoEvents } = await import("../src/app/api/demo/events/route.ts");

const origin = "http://local.test";
const req = (url, { method = "GET", headers = {}, body } = {}) => new Request(`${origin}${url}`, { method, headers: { origin, host: "local.test", ...headers }, body });

test("READ_ONLY data requires the owner session", async () => {
  assert.equal((await state(req("/api/state"))).status, 401);
  assert.equal((await runs(req("/api/runs", { method: "POST", headers: { "content-type": "application/json" }, body: '{"input":"text"}' }))).status, 403);
  const bad = await login(req("/api/auth/login", { method: "POST", body: '{"password":"nope"}' }));
  assert.equal(bad.status, 401);
  const crossSite = await login(req("/api/auth/login", { method: "POST", headers: { origin: "http://evil.test" }, body: '{"password":"open sesame"}' }));
  assert.equal(crossSite.status, 403);
  const ok = await login(req("/api/auth/login", { method: "POST", body: '{"password":"open sesame"}' }));
  assert.equal(ok.status, 200);
  const cookie = ok.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly; SameSite=Strict/);
  const authed = await state(req("/api/state", { headers: { cookie: cookie.split(";")[0] } }));
  assert.equal(authed.status, 200);
  const body = await authed.json();
  assert.equal(body.mode, "READ_ONLY");
  assert.equal(body.provenance, "UNKNOWN", "never synced");
});

test("Shopify webhook: signature, shop and duplicate delivery checks", async () => {
  const payload = JSON.stringify({ admin_graphql_api_id: "gid://shopify/Order/77", name: "#77", processed_at: "2026-10-05T00:00:00Z", updated_at: "2026-10-05T00:00:00Z", financial_status: "paid", current_total_price_set: { shop_money: { amount: "4900", currency_code: "JPY" } } });
  const sig = createHmac("sha256", "hook-secret").update(payload).digest("base64");
  const hook = (headers) => webhook(req("/api/webhooks/shopify", { method: "POST", headers: { "x-shopify-topic": "orders/paid", "x-shopify-shop-domain": "demo-store.myshopify.com", "x-shopify-webhook-id": "d-1", ...headers }, body: payload }));
  assert.equal((await hook({ "x-shopify-hmac-sha256": "bad" })).status, 401);
  assert.equal((await hook({ "x-shopify-hmac-sha256": sig, "x-shopify-shop-domain": "other.myshopify.com" })).status, 401);
  assert.equal((await (await hook({ "x-shopify-hmac-sha256": sig })).json()).result, "stored");
  assert.equal((await (await hook({ "x-shopify-hmac-sha256": sig })).json()).result, "duplicate");
  assert.equal((await (await hook({ "x-shopify-hmac-sha256": sig, "x-shopify-webhook-id": "d-2" })).json()).result, "older", "same order version is idempotent");
});

test("cron needs the bearer secret; demo writes stay closed", async () => {
  assert.equal((await cron(req("/api/cron/sync", { method: "POST", headers: { authorization: "Bearer wrong" } }))).status, 401);
  const res = await demoEvents(req("/api/demo/events", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }));
  assert.equal(res.status, 403, "demo fixtures cannot be injected into a READ_ONLY server");
});
