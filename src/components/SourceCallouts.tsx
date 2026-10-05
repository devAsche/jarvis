"use client";

import React from "react";
import type { SourceLane } from "../contracts";
import type { SourceProgress } from "./presence/CoreVisualState";

const PROGRESS_TEXT: Record<SourceProgress, string> = { pending: "待機", running: "読取中", done: "読取済", failed: "失敗" };

interface SourceCalloutsProps {
  lanes: SourceLane[];
  progress: SourceProgress[];
  provenance: string;
  layout: "orbit" | "list";
}

/** The source lanes the core's arcs represent. Business text stays in the DOM. */
export function SourceCallouts({ lanes, progress, provenance, layout }: SourceCalloutsProps) {
  return (
    <ul className={`callouts ${layout}`} aria-label="照合する出典">
      {layout === "orbit" && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points="10,20 22,20 34,34" /><polyline points="88,44 78,44 68,47" /><polyline points="14,82 26,82 36,68" />
        </svg>
      )}
      {lanes.slice(0, 3).map((lane, i) => (
        <li key={lane.source} className={`hp co co${i + 1} ${progress[i] ?? "pending"}${lane.connected ? "" : " off"}`}>
          <div className="k"><span>{lane.label}</span><span>{lane.connected ? PROGRESS_TEXT[progress[i] ?? "pending"] : "未接続"}</span></div>
          <div className="v">{lane.detail}</div>
          <div className="k sub"><span>{lane.ids.join(" / ") || "—"}</span><span>{lane.connected ? (provenance === "LIVE_VERIFIED" ? "LIVE" : provenance) : "—"}</span></div>
          <div className="bar" aria-hidden="true"><i /></div>
        </li>
      ))}
    </ul>
  );
}
