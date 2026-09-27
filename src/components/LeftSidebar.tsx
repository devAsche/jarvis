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
        <h2 className="block-title">CONNECTED SYSTEMS</h2>
        {connections.map((conn) => (
          <div key={conn.id} className="source-item">
            <span className="source-name">
              <span className="left-icon" aria-hidden="true">
                {conn.icon}
              </span>
              {conn.name}
            </span>
            <b className={conn.connected ? "status-on" : "status-off"}>
              {conn.statusText}
            </b>
          </div>
        ))}
        <div className="divider-line" />
        <div className="mini-meta">
          <span>DATA STATUS</span>
          <span className="color-amber">FIXTURES / MOCK</span>
        </div>
      </section>

      <section className="glass-block" style={{ flex: 1 }}>
        <h2 className="block-title">EVENT STREAM</h2>
        <ul className="event-feed" aria-live="polite">
          {events.map((evt) => (
            <li key={evt.event_id}>
              <strong>{evt.type.toUpperCase().replace(/\./g, " ")}</strong>
              <span>
                {typeof evt.data.headline === "string"
                  ? evt.data.headline
                  : typeof evt.data.message === "string"
                  ? evt.data.message
                  : `Source: ${evt.source} (Order: ${evt.correlation_id})`}
              </span>
              <time>{evt.occurred_at ? evt.occurred_at.split("T")[1]?.slice(0, 5) : "LOCAL"}</time>
            </li>
          ))}
        </ul>
      </section>

      <div className="mini-meta" style={{ padding: "3px 5px 10px" }}>
        <span>ENCRYPTION: NOT CONFIGURED</span>
        <span>BUILD: CONCEPT / 0.1</span>
      </div>
    </aside>
  );
}
