"use client";

import React, { useState } from "react";
import { BusinessSummary } from "../contracts";
import { useDialogFocus } from "../lib/useDialogFocus";
import { money } from "./demoText";

interface DashboardModalProps {
  summary: BusinessSummary;
  mode: "DEMO" | "READ_ONLY";
  onClose: () => void;
}

export function DashboardModal({ summary, mode, onClose }: DashboardModalProps) {
  const live = mode === "READ_ONLY";
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
          <h2 id="dashboard-modal-title">事業別の数字 · {live ? "READ ONLY" : "DEMO"}</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="閉じる"
          >
            閉じる
          </button>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", alignItems: "center" }}>
          <span className="pill-tag">{live ? `Shopify · ${summary.provenance}` : "実サービス未接続"}</span>
          <span className="pill-tag">
            {live ? "読み取り専用" : "サンプル表示"}
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
            <small>{live ? `24時間の注文額 · ${summary.example_orders_count}件` : "サンプル注文額 · 実売上ではありません"}</small>
            <strong>{money(summary.order_revenue_minor, summary.order_revenue_currency)}</strong>
            <small>純利益: 不明（原価データなし）</small>
          </div>
          <div className="stat-card">
            <small>{live ? "48時間以上の未発送" : "制作問い合わせの例"}</small>
            <strong>{live ? summary.shipping_alerts_count : summary.mix_inquiries_count}</strong>
            <small>{live ? "支払い済み · ルールで計数" : "送信メール0件 · 本人確認が必要"}</small>
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
            {live ? "数値はShopifyの読み取りデータからルールで集計しています。純利益は原価・手数料データがないため不明です。" : "これらの数値はサンプルです。最終同期はなく、純利益を計算するための原価データもありません。"}
          </p>
          <ul>
            <li>{live ? "メール・予定表は未接続です。" : "注文・メール・予定表はすべて未接続です。"}</li>
            <li>模擬承認は外部サービスへの実行権限を持ちません。</li>
          </ul>
        </div>

        <p className="modal-foot">
          {live ? "READ ONLY" : "DEMO"} · 実サービスへの書込みなし
        </p>
      </div>
    </div>
  );
}
