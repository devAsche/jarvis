"use client";

import React, { useEffect, useRef, useState } from "react";
import { BusinessSummary } from "../contracts";

interface DashboardModalProps {
  summary: BusinessSummary;
  onClose: () => void;
}

export function DashboardModal({ summary, onClose }: DashboardModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "commerce" | "creative" | "security">("overview");

  useEffect(() => {
    closeBtnRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-window">
        <div className="modal-header">
          <h2 id="dashboard-modal-title">OPERATIONS / DASHBOARD</h2>
          <button
            ref={closeBtnRef}
            className="modal-close-btn"
            onClick={onClose}
            aria-label="閉じる"
          >
            ✕ CLOSE
          </button>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", alignItems: "center" }}>
          <span className="pill-tag">NOT CONNECTED</span>
          <span className="pill-tag" style={{ borderColor: "#64b6e5", color: "#b3e5fc" }}>
            MODE: DEMO
          </span>
        </div>

        <div className="button-row" style={{ marginBottom: "16px" }}>
          <button
            className={`cyber-btn ${activeTab === "overview" ? "primary" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            OVERVIEW
          </button>
          <button
            className={`cyber-btn ${activeTab === "commerce" ? "primary" : ""}`}
            onClick={() => setActiveTab("commerce")}
          >
            COMMERCE
          </button>
          <button
            className={`cyber-btn ${activeTab === "creative" ? "primary" : ""}`}
            onClick={() => setActiveTab("creative")}
          >
            CREATIVE
          </button>
          <button
            className={`cyber-btn ${activeTab === "security" ? "primary" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            SECURITY
          </button>
        </div>

        <div className="card-grid-2">
          <div className="stat-card">
            <small>COMMERCE / SAMPLE ORDER REVENUE</small>
            <strong>
              {summary.order_revenue_currency === "JPY" ? "¥" : "$"}
              {summary.order_revenue_minor.toLocaleString()}
            </strong>
            <small>NET PROFIT: UNKNOWN (NO COST DATA)</small>
          </div>
          <div className="stat-card">
            <small>CREATIVE / SAMPLE LEADS</small>
            <strong>
              {summary.mix_inquiries_count < 10 ? `0${summary.mix_inquiries_count}` : summary.mix_inquiries_count}
            </strong>
            <small>0 EMAILS SENT (HUMAN REVIEW REQUIRED)</small>
          </div>
          <div className="stat-card">
            <small>EXECUTIVE ASSISTANT</small>
            <strong>0</strong>
            <small>REAL CALENDAR CONNECTIONS</small>
          </div>
          <div className="stat-card">
            <small>SECURITY / EXTERNAL EFFECTS</small>
            <strong>LOCKED</strong>
            <small>APPROVAL-GATED DESIGN</small>
          </div>
        </div>

        <div className="narrative-block">
          <p>
            実装フェーズ（M2以降）では各指標に最終同期時刻・一次データ・欠損項目を表示します。
            データ不足時に推定利益を確定値として扱いません。
          </p>
          <ul style={{ fontSize: "12px", color: "#a5c2d7" }}>
            <li><b>Shopify連携:</b> 注文通知の冪等性チェックと利益計算アダプターをM2で接続</li>
            <li><b>Mix/制作問い合わせ:</b> 受信構造化と返信下書きの作成までを許可し、送信は本人承認制</li>
            <li><b>API予算管理:</b> AIモデル利用料金上限と月次推論コストを常時監視</li>
          </ul>
        </div>

        <p style={{ marginTop: "14px", fontSize: "11px", color: "#7b9bb1" }}>
          OFFLINE VISUAL PROTOTYPE • NO API CALLS • NO BUSINESS ACTIONS
        </p>
      </div>
    </div>
  );
}
