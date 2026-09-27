"use client";

import React from "react";
import { CoreState } from "../contracts";

interface CentralCoreProps {
  coreState: CoreState;
  stateLabel: string;
  subLabel: string;
  caption: string;
  pendingApprovalsCount: number;
  onOpenBriefing: () => void;
  onOpenDashboard: () => void;
  onOpenApprovals: () => void;
}

export function CentralCore({
  coreState,
  stateLabel,
  subLabel,
  caption,
  pendingApprovalsCount,
  onOpenBriefing,
  onOpenDashboard,
  onOpenApprovals,
}: CentralCoreProps) {
  const isAwaiting = coreState === "AWAITING_APPROVAL";

  return (
    <section className="center-column" aria-label="JARVIS中央コア">
      <div className="top-code-bar">
        <span>CORE INTERFACE / V.01</span>
        <span>LOCAL VISUAL SIMULATION</span>
      </div>

      <div className="core-wrap" aria-hidden="true">
        <div className="cross-hair" />
        <div className="orb-back" />
        <div className="orbit o1">
          <div className="satellite-dot" />
        </div>
        <div className="orbit o2" />
        <div className="orbit o3">
          <div className="satellite-dot" />
        </div>
        <div className="orbit o4" />
        <div className="halo-ring" />
        <div className="arc-line" />
        <div className="central-core" />
        <span className="radar-label n">000°</span>
        <span className="radar-label e">090°</span>
        <span className="radar-label s">180°</span>
        <span className="radar-label w">270°</span>
      </div>

      <div className="core-status-box" aria-live="polite">
        <strong>{stateLabel}</strong>
        <p>{subLabel}</p>
      </div>

      <div className="waveform-bar" aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i /><i />
        <i /><i /><i /><i /><i /><i /><i /><i />
        <i /><i /><i /><i /><i /><i /><i /><i />
      </div>

      <div className="center-explainer">{caption}</div>

      <div className="button-row" style={{ marginBottom: "10px" }}>
        <button
          className="cyber-btn primary"
          onClick={onOpenBriefing}
          aria-label="朝の業務報告を開く"
        >
          ▶ MORNING BRIEF
        </button>
        <button
          className="cyber-btn"
          onClick={onOpenDashboard}
          aria-label="実務ダッシュボードを開く"
        >
          ▤ DASHBOARD
        </button>
        <button
          className={`cyber-btn ${isAwaiting || pendingApprovalsCount > 0 ? "gold" : ""}`}
          onClick={onOpenApprovals}
          aria-label={`承認センターを開く (未処理: ${pendingApprovalsCount}件)`}
        >
          ◈ APPROVALS{" "}
          <span style={{ fontWeight: "bold" }}>
            {pendingApprovalsCount < 10 ? `0${pendingApprovalsCount}` : pendingApprovalsCount}
          </span>
        </button>
      </div>
    </section>
  );
}
