import type { SourceEventEnvelope } from "../contracts/index.ts";
import type { Lane } from "./live.ts";

const yen = (v: unknown) => (typeof v === "number" ? `¥${v.toLocaleString("ja-JP")}` : "不明");
const jst = (iso: string) => new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

/** The three fixture lanes shown around the core in DEMO mode. */
export function demoLanes(events: SourceEventEnvelope[]): Lane[] {
  const order = events.find((e) => e.event_id === "demo_001");
  const mixes = events.filter((e) => e.type === "creative.mix.lead" && e.source === "fixture.gmail");
  const cal = events.find((e) => e.type === "calendar.event.upcoming");
  return [
    { source: "fixture.shopify", label: "fixture.shopify", ids: ["demo_001"], detail: order ? `注文1件 送料 ${yen(order.data.estimated_shipping_minor)} → ${yen(order.data.quoted_shipping_minor)}` : "サンプル注文", connected: true },
    { source: "fixture.gmail", label: "fixture.gmail", ids: ["demo_002", "demo_004"], detail: `MIX問い合わせ ${mixes.length}件 返信待ち`, connected: true },
    { source: "fixture.calendar", label: "fixture.calendar", ids: ["demo_005"], detail: typeof cal?.data.starts_at === "string" ? `予定 ${jst(cal.data.starts_at)}` : "予定の例", connected: true },
  ];
}
