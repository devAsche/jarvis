"use client";

import React from "react";
import { AgentInfo, BusinessSummary } from "../contracts";

interface RightSidebarProps {
  summary: BusinessSummary;
  agents: AgentInfo[];
  modelRequestsCount: number;
  pendingApprovalsCount: number;
  onReviewPriorityAction: () => void;
}

export function RightSidebar({
  summary,
  agents,
  modelRequestsCount,
  pendingApprovalsCount,
  onReviewPriorityAction,
}: RightSidebarProps) {
  return (
    <aside className="side-column right-column" aria-label="業務概要とエージェント">
      <section className="glass-block action-panel">
        <h2 className="block-title">今、人が確認すること</h2>
        <span className="pill-tag">{pendingApprovalsCount > 0 ? `模擬承認待ち · ${pendingApprovalsCount}件` : "模擬判断を記録済み"}</span>
        <h3>配送費の差額</h3>
        <p className="action-difference">¥900 <span>→</span> ¥1,550</p>
        <p>サンプル注文の送料が想定より¥650高くなっています。{pendingApprovalsCount > 0 ? "判断を記録しても、発注・支払い・出荷は行いません。" : "模擬判断は履歴に記録され、外部操作はありません。"}</p>
        <button className="cyber-btn gold" onClick={onReviewPriorityAction} aria-label="配送費の模擬レビューを開く">{pendingApprovalsCount > 0 ? "内容と根拠を確認 →" : "記録を確認 →"}</button>
      </section>
      <section className="glass-block">
        <h2 className="block-title">
          今日の概況 <span className="pill-tag">DEMO</span>
        </h2>
        <div className="metric-row primary-metric">
          <span>
            注文額の例
            <br />
            <em>サンプル値 · 実際の売上ではありません</em>
          </span>
          <b>
            {summary.order_revenue_currency === "JPY" ? "¥" : "$"}
            {summary.order_revenue_minor.toLocaleString()}
          </b>
        </div>
        <div className="metric-row">
          <span>サンプル注文</span>
          <b>{summary.example_orders_count < 10 ? `0${summary.example_orders_count}` : summary.example_orders_count}</b>
        </div>
        <div className="metric-row">
          <span>MIX問い合わせの例</span>
          <b>{summary.mix_inquiries_count < 10 ? `0${summary.mix_inquiries_count}` : summary.mix_inquiries_count}</b>
        </div>
        <div className="metric-row" style={{ marginBottom: 0 }}>
          <span>配送費の確認</span>
          <b className="color-amber">
            {summary.shipping_alerts_count < 10 ? `0${summary.shipping_alerts_count}` : summary.shipping_alerts_count}
          </b>
        </div>
        <div className="divider-line" style={{ marginTop: "18px" }} />
        <div className="mini-meta">
          <span>実サービスの最終同期</span>
          <span>{summary.last_verified_sync === "NEVER" ? "なし" : summary.last_verified_sync}</span>
        </div>
      </section>

      <section className="glass-block">
        <h2 className="block-title">実行状況 <span className="block-subtitle">デモ</span></h2>
        {agents.map((ag) => (
          <div key={ag.id} className="source-item">
            <span>{ag.id === "commerce" ? "販売" : ag.id === "creative" ? "制作" : ag.id === "assistant" ? "予定と支援" : ag.name}</span>
            <span className={ag.idle ? "status-off" : "status-on"}>
              {ag.idle ? "デモ · 待機中" : ag.statusText}
            </span>
          </div>
        ))}
        <div className="divider-line" />
        <div className="mini-meta">
          <span>モデル呼び出し</span>
          <span>{modelRequestsCount}</span>
        </div>
        <div className="progress-track" aria-hidden="true">
          <span className="progress-fill" />
        </div>
        <div className="mini-meta">
          <span>実サービス操作</span>
          <span className="color-amber">無効</span>
        </div>
      </section>

    </aside>
  );
}
