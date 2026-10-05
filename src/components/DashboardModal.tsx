"use client";

import React, { useState } from "react";
import { BusinessSummary } from "../contracts";
import { useDialogFocus } from "../lib/useDialogFocus";

interface DashboardModalProps {
  summary: BusinessSummary;
  onClose: () => void;
}

export function DashboardModal({ summary, onClose }: DashboardModalProps) {
  const dialogRef = useDialogFocus(onClose);
  const [activeTab, setActiveTab] = useState<"overview" | "commerce" | "creative" | "security">("overview");

  return (
    <div
      className="modal-overlay"
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-window">
        <div className="modal-header">
          <h2 id="dashboard-modal-title">事業別の数字 · DEMO</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="閉じる"
          >
            閉じる
          </button>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", alignItems: "center" }}>
          <span className="pill-tag">実サービス未接続</span>
          <span className="pill-tag" style={{ borderColor: "#64b6e5", color: "#b3e5fc" }}>
            サンプル表示
          </span>
        </div>

        <div className="button-row" style={{ marginBottom: "16px" }}>
          <button
            className={`cyber-btn ${activeTab === "overview" ? "primary" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            全体
          </button>
          <button
            className={`cyber-btn ${activeTab === "commerce" ? "primary" : ""}`}
            onClick={() => setActiveTab("commerce")}
          >
            注文
          </button>
          <button
            className={`cyber-btn ${activeTab === "creative" ? "primary" : ""}`}
            onClick={() => setActiveTab("creative")}
          >
            制作
          </button>
          <button
            className={`cyber-btn ${activeTab === "security" ? "primary" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            安全
          </button>
        </div>

        <div className="card-grid-2">
          <div className="stat-card">
            <small>サンプル注文額 · 実売上ではありません</small>
            <strong>
              {summary.order_revenue_currency === "JPY" ? "¥" : "$"}
              {summary.order_revenue_minor.toLocaleString()}
            </strong>
            <small>純利益: 不明（原価データなし）</small>
          </div>
          <div className="stat-card">
            <small>制作問い合わせの例</small>
            <strong>
              {summary.mix_inquiries_count < 10 ? `0${summary.mix_inquiries_count}` : summary.mix_inquiries_count}
            </strong>
            <small>送信メール0件 · 本人確認が必要</small>
          </div>
          <div className="stat-card">
            <small>予定表の実接続</small>
            <strong>0</strong>
            <small>未接続</small>
          </div>
          <div className="stat-card">
            <small>外部への操作</small>
            <strong>無効</strong>
            <small>このデモから実行できません</small>
          </div>
        </div>

        <div className="narrative-block">
          <p>
            これらの数値はサンプルです。最終同期はなく、純利益を計算するための原価データもありません。
          </p>
          <ul style={{ fontSize: "12px", color: "#a5c2d7" }}>
            <li>注文・メール・予定表はすべて未接続です。</li>
            <li>模擬承認は外部サービスへの実行権限を持ちません。</li>
          </ul>
        </div>

        <p style={{ marginTop: "14px", fontSize: "11px", color: "#7b9bb1" }}>
          DEMO · 実サービスへの書込みなし
        </p>
      </div>
    </div>
  );
}
