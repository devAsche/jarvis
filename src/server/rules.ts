import type { ApprovalItem, BriefingItem, BusinessSummary, DataProvenance, MorningBriefing } from "../contracts/index.ts";
import type { OrderRecord } from "./store.ts";
import { formatMinor } from "./money.ts";

// Deterministic business rules. No AI: every figure is counted from stored orders.

const DAY = 24 * 60 * 60 * 1000;
export const STUCK_AFTER_MS = 48 * 60 * 60 * 1000;

const jstDate = (now: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(now);
const shortId = (gid: string) => gid.split("/").pop() ?? gid;

export interface RuleInput {
  orders: OrderRecord[];
  now: Date;
  shippingEstimateMinor: Record<string, number> | null;
}

export function recentOrders(orders: OrderRecord[], now: Date) {
  return orders.filter((o) => !o.cancelled && now.getTime() - Date.parse(o.processedAt) <= DAY);
}

export function stuckOrders(orders: OrderRecord[], now: Date) {
  return orders.filter((o) => !o.cancelled && o.financialStatus === "PAID" && o.fulfillmentStatus === "UNFULFILLED" && now.getTime() - Date.parse(o.processedAt) > STUCK_AFTER_MS)
    .sort((a, b) => Date.parse(a.processedAt) - Date.parse(b.processedAt));
}

export function shippingOverEstimate(orders: OrderRecord[], estimates: Record<string, number> | null) {
  if (!estimates) return [];
  return orders.filter((o) => !o.cancelled && o.shippingMinor !== null && estimates[o.currency] !== undefined && o.shippingMinor > estimates[o.currency]);
}

export function buildLiveBriefing({ orders, now, shippingEstimateMinor }: RuleInput): MorningBriefing {
  const recent = recentOrders(orders, now);
  const stuck = stuckOrders(orders, now);
  const overShip = shippingOverEstimate(recent, shippingEstimateMinor);
  const byCurrency = new Map<string, { count: number; total: number }>();
  for (const o of recent) {
    const cur = byCurrency.get(o.currency) ?? { count: 0, total: 0 };
    byCurrency.set(o.currency, { count: cur.count + 1, total: cur.total + o.totalMinor });
  }
  const anomalies: BriefingItem[] = overShip.map((o) => ({
    id: `ship:${o.id}`,
    headline: `注文 ${o.name} の送料 ${formatMinor(o.shippingMinor ?? 0, o.currency)} が想定 ${formatMinor(shippingEstimateMinor?.[o.currency] ?? 0, o.currency)} を超えています`,
    source: `shopify ${shortId(o.id)}`, confidence: "rule",
  }));
  const cancelled = orders.filter((o) => o.cancelled && now.getTime() - Date.parse(o.updatedAt) <= DAY);
  if (cancelled.length) anomalies.push({ id: "cancelled-24h", headline: `過去24時間にキャンセルされた注文 ${cancelled.length}件`, source: cancelled.map((o) => `shopify ${shortId(o.id)}`).join(", "), confidence: "rule" });
  const sales: BriefingItem[] = [...byCurrency].map(([currency, v]) => ({
    id: `sales:${currency}`, headline: `過去24時間の注文 ${v.count}件 · 合計 ${formatMinor(v.total, currency)}（${currency}、手数料・原価は未計算）`,
    source: `shopify (${v.count})`, confidence: "rule",
  }));
  return {
    date: jstDate(now),
    timezone: "Asia/Tokyo",
    data_mode: "READ_ONLY",
    generated_at: now.toISOString(),
    disclaimer: "Shopifyの読み取り専用データから決定的なルールで作成。利益は原価・手数料データがないため不明。",
    sections: [
      { kind: "anomalies", title: "異常", items: anomalies, sources: anomalies.map((i) => i.source) },
      { kind: "schedule", title: "今日", items: sales.length ? sales : [{ id: "sales:none", headline: "過去24時間の注文はありません", source: "shopify", confidence: "rule" }], sources: ["shopify"] },
      { kind: "pending", title: "滞留", items: stuck.slice(0, 5).map((o) => ({ id: `stuck:${o.id}`, headline: `注文 ${o.name} が支払い済みのまま48時間以上未発送です`, source: `shopify ${shortId(o.id)}`, confidence: "rule" })), sources: ["shopify"] },
      { kind: "suggestions", title: "提案", items: stuck.length ? [{ id: "suggest:fulfil", headline: "未発送の注文から発送状況を確認する", source: "rule", confidence: "rule" }] : [], sources: ["rule"] },
    ],
  };
}

/** Review cards. Decisions only record that the owner looked; there is no effect adapter. */
export function buildReviews({ orders, now, shippingEstimateMinor }: RuleInput): ApprovalItem[] {
  const expires = new Date(now.getTime() + DAY).toISOString();
  const stuck = stuckOrders(orders, now).slice(0, 5).map((o): ApprovalItem => ({
    intent_id: `review:stuck:${shortId(o.id)}:${Date.parse(o.updatedAt)}`,
    action_type: "review.unfulfilled_order",
    account: "Shopify",
    target_id: o.name || shortId(o.id),
    title: `未発送の注文 ${o.name}`,
    description: `支払い済みのまま48時間以上未発送です。確認を記録しても、Shopify上の注文や発送は変更しません。`,
    amount_cap_minor: o.totalMinor,
    currency: o.currency,
    expires_at: expires,
    status: "pending",
    reason: `processedAt ${o.processedAt}, fulfillment ${o.fulfillmentStatus}`,
    risk: "medium",
  }));
  const ship = shippingOverEstimate(recentOrders(orders, now), shippingEstimateMinor).slice(0, 5).map((o): ApprovalItem => ({
    intent_id: `review:ship:${shortId(o.id)}:${Date.parse(o.updatedAt)}`,
    action_type: "review.shipping_over_estimate",
    account: "Shopify",
    target_id: o.name || shortId(o.id),
    title: `送料が想定を超えた注文 ${o.name}`,
    description: `送料 ${formatMinor(o.shippingMinor ?? 0, o.currency)} が想定 ${formatMinor(shippingEstimateMinor?.[o.currency] ?? 0, o.currency)} を超えています。確認を記録しても、Shopify上の注文は変更しません。`,
    amount_cap_minor: o.totalMinor,
    currency: o.currency,
    expires_at: expires,
    status: "pending",
    reason: `shipping ${o.shippingMinor} > estimate ${shippingEstimateMinor?.[o.currency]}`,
    risk: "low",
  }));
  return [...ship, ...stuck];
}

export function buildLiveSummary(orders: OrderRecord[], now: Date, provenance: DataProvenance, lastSuccessAt: string | null): BusinessSummary {
  const recent = recentOrders(orders, now);
  const counts = new Map<string, number>();
  recent.forEach((o) => counts.set(o.currency, (counts.get(o.currency) ?? 0) + 1));
  const currency = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "JPY";
  const inCurrency = recent.filter((o) => o.currency === currency);
  return {
    order_revenue_minor: inCurrency.reduce((s, o) => s + o.totalMinor, 0),
    order_revenue_currency: currency,
    example_orders_count: inCurrency.length,
    mix_inquiries_count: 0,
    shipping_alerts_count: stuckOrders(orders, now).length,
    net_profit_status: "UNKNOWN",
    last_verified_sync: lastSuccessAt ?? "NEVER",
    provenance,
  };
}
