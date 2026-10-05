"use client";

import React from "react";
import type { JstNow } from "./useJstNow";

interface HeaderProps {
  now: JstNow | null;
  voiceLabel: string;
  /** YYYY-MM-DD dates (JST) that carry a sample event. */
  markedDates: string[];
}

export function Header({ now, voiceLabel, markedDates }: HeaderProps) {
  const daysInMonth = now ? new Date(now.year, now.month, 0).getDate() : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const key = (d: number) => now ? `${now.year}-${String(now.month).padStart(2, "0")}-${String(d).padStart(2, "0")}` : "";
  return (
    <>
      <header className="hud-top" role="banner">
        <div className="hud-mark">
          <svg viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="15" fill="none" stroke="var(--glow)" strokeWidth="1.5" /><circle cx="17" cy="17" r="9" fill="none" stroke="var(--glow)" strokeWidth="3" strokeDasharray="10 4.1" /><circle cx="17" cy="17" r="3" fill="var(--glow-hi)" /></svg>
          <div><h1>JARVIS</h1><span>Business OS</span></div>
        </div>
        <span className="hud-demo">DEMO · 実サービス未接続 · 外部操作なし</span>
        <div className="hud-top-right">
          <span className="voice-chip"><i aria-hidden="true" />{voiceLabel}</span>
          <span>東京</span>
          <span className="hud-clock" aria-label="東京の現在時刻">{now?.time ?? "--:--:--"}</span>
        </div>
      </header>
      <nav className="hud-ruler" aria-label={now ? `${now.year}年${now.month}月 · 今日は${now.day}日` : "今月"} style={{ "--days": daysInMonth } as React.CSSProperties}>
        <span className="ym">{now ? `${now.year}.${String(now.month).padStart(2, "0")}` : "----.--"}</span>
        {days.map((d) => {
          const dow = now ? new Date(now.year, now.month - 1, d).getDay() : 1;
          const cls = [d === now?.day ? "today" : "", dow === 0 || dow === 6 ? "wk" : "", markedDates.includes(key(d)) ? "ev" : "", now && Math.abs(d - now.day) > 4 ? "far" : ""].join(" ");
          return <span key={d} className={cls} aria-current={d === now?.day ? "date" : undefined}>{String(d).padStart(2, "0")}</span>;
        })}
      </nav>
    </>
  );
}
