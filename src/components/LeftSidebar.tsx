"use client";

import React from "react";
import type { ConnectionInfo, SourceEventEnvelope } from "../contracts";
import { HudPanel } from "./HudPanel";
import type { JstNow } from "./useJstNow";
import { eventTitle, jstDateTime, jstTime } from "./demoText";

interface LeftSidebarProps {
  now: JstNow | null;
  connections: ConnectionInfo[];
  events: SourceEventEnvelope[];
  briefGeneratedAt: string | null;
  logRef?: React.Ref<HTMLElement>;
}

const SERVICE_NAME: Record<string, string> = { shopify: "Shopify", gmail: "Gmail", calendar: "Calendar", ticktick: "TickTick" };

function DateDial({ now }: { now: JstNow | null }) {
  const days = now ? new Date(now.year, now.month, 0).getDate() : 31;
  const today = (now?.day ?? 1) - 1;
  return (
    <svg viewBox="0 0 132 132" aria-hidden="true">
      {Array.from({ length: days }, (_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / days;
        const r2 = i === today ? 49 : 54;
        const at = (r: number, f: (x: number) => number) => (66 + f(a) * r).toFixed(2);
        return <line key={i} x1={at(60, Math.cos)} y1={at(60, Math.sin)} x2={at(r2, Math.cos)} y2={at(r2, Math.sin)} stroke={i <= today ? "var(--glow)" : "var(--line)"} strokeWidth={i === today ? 3 : 2} />;
      })}
      <circle cx="66" cy="66" r="44" fill="none" stroke="var(--line-soft)" />
      <text x="66" y="56" textAnchor="middle" className="d-mon">{now ? `${now.month}月 ${now.weekday}曜` : ""}</text>
      <text x="66" y="92" textAnchor="middle" className="d-num">{now ? String(now.day).padStart(2, "0") : "--"}</text>
    </svg>
  );
}

export function LeftSidebar({ now, connections, events, briefGeneratedAt, logRef }: LeftSidebarProps) {
  const next = events.find((e) => e.type === "calendar.event.upcoming");
  const nextAt = typeof next?.data.starts_at === "string" ? jstDateTime(next.data.starts_at) : "なし";
  const linked = connections.filter((c) => c.connected).length;
  return (
    <aside className="hud-col hud-left" aria-label="日付・接続・記録">
      <HudPanel aria-label="今日">
        <div className="dial">
          <DateDial now={now} />
          <dl>
            <dt>朝の報告</dt><dd>{briefGeneratedAt ? <>{jstTime(briefGeneratedAt)}<small>作成</small></> : <>--:--<small>未作成</small></>}</dd>
            <dt>次の予定（例）</dt><dd>{nextAt}</dd>
          </dl>
        </div>
      </HudPanel>
      <HudPanel title="接続" code={`${linked} / ${connections.length} 接続`}>
        <div className="links">
          {connections.map((c) => (
            <div key={c.id} className={c.connected ? "on" : ""}>
              <svg viewBox="0 0 54 54" aria-hidden="true"><circle cx="27" cy="27" r="22" fill="none" stroke="var(--line)" strokeWidth="2" strokeDasharray={c.connected ? undefined : "3 4"} /><circle cx="27" cy="27" r="14" fill="none" stroke={c.connected ? "var(--glow)" : "var(--line-soft)"} strokeWidth="6" /><text x="27" y="31" textAnchor="middle">{c.icon}</text></svg>
              <div className="nm">{SERVICE_NAME[c.id] ?? c.name}</div>
              <div className="st">{c.connected ? "接続中" : "未接続"}</div>
            </div>
          ))}
        </div>
      </HudPanel>
      <HudPanel title="記録" code="DEMO · 監査" panelRef={logRef} tabIndex={-1}>
        <ul className="log" aria-live="polite">
          {events.slice(0, 6).map((evt) => (
            <li key={`${evt.source}:${evt.event_id}`}>
              <time dateTime={evt.occurred_at}>{jstTime(evt.occurred_at)}</time>
              <div>{eventTitle(evt)}<span className="src">{evt.event_id.length > 12 ? evt.correlation_id.slice(0, 8) : evt.event_id} · {evt.source}</span></div>
            </li>
          ))}
        </ul>
      </HudPanel>
    </aside>
  );
}
