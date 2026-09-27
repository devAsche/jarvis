"use client";

import React from "react";
import { AgentInfo, BusinessSummary } from "../contracts";

interface RightSidebarProps {
  summary: BusinessSummary;
  agents: AgentInfo[];
  modelRequestsCount: number;
  onReviewPriorityAction: () => void;
}

export function RightSidebar({
  summary,
  agents,
  modelRequestsCount,
  onReviewPriorityAction,
}: RightSidebarProps) {
  return (
    <aside className="side-column right-column" aria-label="業務概要とエージェント">
      <section className="glass-block">
        <h2 className="block-title">
          BUSINESS OVERVIEW <span className="pill-tag">SAMPLE</span>
        </h2>
        <div className="metric-row">
          <span>
            ORDER REVENUE
            <br />
            <em>Sample data, not real sales</em>
          </span>
          <b>
            {summary.order_revenue_currency === "JPY" ? "¥" : "$"}
            {summary.order_revenue_minor.toLocaleString()}
          </b>
        </div>
        <div className="metric-row">
          <span>EXAMPLE ORDERS</span>
          <b>{summary.example_orders_count < 10 ? `0${summary.example_orders_count}` : summary.example_orders_count}</b>
        </div>
        <div className="metric-row">
          <span>MIX INQUIRIES</span>
          <b>{summary.mix_inquiries_count < 10 ? `0${summary.mix_inquiries_count}` : summary.mix_inquiries_count}</b>
        </div>
        <div className="metric-row" style={{ marginBottom: 0 }}>
          <span>SHIPPING ALERTS</span>
          <b className="color-amber">
            {summary.shipping_alerts_count < 10 ? `0${summary.shipping_alerts_count}` : summary.shipping_alerts_count}
          </b>
        </div>
        <div className="divider-line" style={{ marginTop: "18px" }} />
        <div className="mini-meta">
          <span>LAST VERIFIED SYNC</span>
          <span>{summary.last_verified_sync}</span>
        </div>
      </section>

      <section className="glass-block">
        <h2 className="block-title">AGENT STATUS</h2>
        {agents.map((ag) => (
          <div key={ag.id} className="source-item">
            <span>{ag.name}</span>
            <span className={ag.idle ? "status-off" : "status-on"}>
              {ag.statusText}
            </span>
          </div>
        ))}
        <div className="divider-line" />
        <div className="mini-meta">
          <span>MODEL REQUESTS</span>
          <span>{modelRequestsCount}</span>
        </div>
        <div className="progress-track" aria-hidden="true">
          <span className="progress-fill" />
        </div>
        <div className="mini-meta">
          <span>LIVE OPERATIONS</span>
          <span className="color-amber">DISABLED</span>
        </div>
      </section>

      <section className="glass-block">
        <h2 className="block-title">PRIORITY ACTION</h2>
        <p style={{ fontSize: "13px", lineHeight: "1.7", margin: "0 0 17px" }}>
          Example order exceeds expected delivery cost. No real purchase or shipment will occur.
        </p>
        <button
          className="cyber-btn gold"
          onClick={onReviewPriorityAction}
          aria-label="優先案件の模擬レビューを開く"
        >
          REVIEW DEMO REQUEST →
        </button>
      </section>
    </aside>
  );
}
