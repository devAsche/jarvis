"use client";

import React from "react";
import { ConnectionInfo, SourceEventEnvelope } from "../contracts";

interface LeftSidebarProps {
  connections: ConnectionInfo[];
  events: SourceEventEnvelope[];
}

export function LeftSidebar({ connections, events }: LeftSidebarProps) {
  return (
    <aside className="side-column left-column" aria-label="接続とイベント">
      <section className="glass-block">
        <h2 className="block-title">接続状況</h2>
        {connections.map((conn) => (
          <div key={conn.id} className="source-item">
            <span className="source-name">
              <span className="left-icon" aria-hidden="true">
                {conn.icon}
              </span>
              {conn.name}
            </span>
            <b className={conn.connected ? "status-on" : "status-off"}>
              {conn.connected ? conn.statusText : "未接続"}
            </b>
          </div>
        ))}
        <div className="divider-line" />
        <div className="mini-meta">
          <span>表示中のデータ</span>
          <span className="color-amber">DEMO / サンプル</span>
        </div>
      </section>

      <section className="glass-block" style={{ flex: 1 }}>
        <h2 className="block-title">最近の動き <span className="block-subtitle">すべてサンプル</span></h2>
        <ul className="event-feed" aria-live="polite">
          {events.map((evt) => (
            <li key={evt.event_id}>
              <strong>{evt.type === "commerce.order.paid" ? "サンプル注文" : evt.type === "creative.mix.lead" ? "MIX問い合わせの例" : evt.type === "calendar.event.upcoming" ? "予定の例" : evt.type.startsWith("task.run") ? "デモタスク" : evt.type.startsWith("voice.") ? "音声モック" : "デモ履歴"}</strong>
              <span>
                {evt.source.startsWith("fixture.")
                  ? evt.type === "commerce.order.paid" ? "注文額と配送費を確認する例" : evt.type === "creative.mix.lead" ? "返信前に内容を確認する例" : evt.type === "calendar.event.upcoming" ? "作業予定を確認する例" : "オフラインのデモが利用できます"
                  : typeof evt.data.headline === "string"
                  ? evt.data.headline
                  : typeof evt.data.message === "string"
                  ? evt.data.message
                  : `Source: ${evt.source} · ID: ${evt.correlation_id}`}
              </span>
              <time>{evt.occurred_at ? new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" }).format(new Date(evt.occurred_at)) : "UNKNOWN"}</time>
            </li>
          ))}
        </ul>
      </section>

      <div className="mini-meta" style={{ padding: "3px 5px 10px" }}><span>外部接続なし</span><span>DEMO</span></div>
    </aside>
  );
}
