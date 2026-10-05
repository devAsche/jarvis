"use client";

import React from "react";
import type { SourceEventEnvelope } from "../contracts";
import type { SourceProgress } from "./presence/CoreVisualState";
import { jstDateTime, yen } from "./demoText";

const PROGRESS_TEXT: Record<SourceProgress, string> = { pending: "待機", running: "読取中", done: "読取済", failed: "不一致" };

interface SourceCalloutsProps {
  events: SourceEventEnvelope[];
  progress: SourceProgress[];
}

/** The three fixture lanes the core's arcs represent. Business text stays in the DOM. */
export function sourceRows(events: SourceEventEnvelope[]) {
  const order = events.find((e) => e.event_id === "demo_001");
  const mixes = events.filter((e) => e.type === "creative.mix.lead");
  const cal = events.find((e) => e.type === "calendar.event.upcoming");
  return [
    { k: "fixture.shopify", id: "demo_001", v: order ? `注文1件 送料 ${yen(order.data.estimated_shipping_minor)} → ${yen(order.data.quoted_shipping_minor)}` : "サンプル注文" },
    { k: "fixture.gmail", id: mixes.map((m) => m.event_id).sort().join(" / ") || "demo_002 / demo_004", v: `MIX問い合わせ ${mixes.length}件 返信待ち` },
    { k: "fixture.calendar", id: cal?.event_id ?? "demo_005", v: typeof cal?.data.starts_at === "string" ? `予定 ${jstDateTime(cal.data.starts_at)}` : "予定の例" },
  ];
}

export function SourceCallouts({ events, progress, layout }: SourceCalloutsProps & { layout: "orbit" | "list" }) {
  const rows = sourceRows(events);
  return (
    <ul className={`callouts ${layout}`} aria-label="照合する出典（DEMO）">
      {layout === "orbit" && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points="10,20 22,20 34,34" /><polyline points="88,44 78,44 68,47" /><polyline points="14,82 26,82 36,68" />
        </svg>
      )}
      {rows.map((row, i) => (
        <li key={row.k} className={`hp co co${i + 1} ${progress[i]}`}>
          <div className="k"><span>{row.k}</span><span>{PROGRESS_TEXT[progress[i]]}</span></div>
          <div className="v">{row.v}</div>
          <div className="k sub"><span>{row.id}</span><span>DEMO</span></div>
          <div className="bar" aria-hidden="true"><i /></div>
        </li>
      ))}
    </ul>
  );
}
