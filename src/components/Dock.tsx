"use client";

import React from "react";

export type DockAction = "brief" | "approve" | "numbers" | "log" | "voice" | "settings";

const ICON: Record<DockAction, React.ReactNode> = {
  brief: <><path d="M6 3h9l4 4v14H6z" /><path d="M9 11h7M9 15h7M9 7h3" /></>,
  approve: <><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  numbers: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  log: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>,
  voice: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" /></>,
};

interface DockProps {
  pendingApprovals: number;
  open: "voice" | "settings" | null;
  onAction: (action: DockAction) => void;
}

export function Dock({ pendingApprovals, open, onAction }: DockProps) {
  const item = (action: DockAction, label: string, extra = "") => (
    <button
      className={`dk ${extra}`}
      onClick={() => onAction(action)}
      aria-pressed={action === "voice" || action === "settings" ? open === action : undefined}
      aria-label={action === "approve" ? `承認 · 未処理${pendingApprovals}件` : undefined}
    >
      <span className="ring">
        <svg viewBox="0 0 24 24" aria-hidden="true">{ICON[action]}</svg>
        {action === "approve" && pendingApprovals > 0 && <span className="badge" aria-hidden="true">{pendingApprovals}</span>}
      </span>
      {label}
    </button>
  );
  return (
    <nav className="dock" aria-label="主要操作">
      {item("brief", "朝の報告")}
      {item("approve", "承認", pendingApprovals > 0 ? "gold" : "")}
      {item("numbers", "数字")}
      {item("log", "記録")}
      {item("voice", "音声")}
      {item("settings", "表示設定", "opt")}
    </nav>
  );
}
