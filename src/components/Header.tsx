"use client";

import React, { useEffect, useState } from "react";

export function Header() {
  const [clockText, setClockText] = useState("--:--:--");

  useEffect(() => {
    const updateTime = () => {
      const formatted = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Tokyo",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date());
      setClockText(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="top-header" role="banner">
      <div className="brand">
        <div className="brandmark" aria-hidden="true"><span>✦</span></div>
        <div>
          <h1 className="wordmark">JARVIS <span>Business OS</span></h1>
          <div className="sub-title">今日の判断と業務の状況</div>
        </div>
      </div>
      <div className="top-right">
        <span className="demo-badge">DEMO · 実サービス未接続</span>
        <div>
          <div className="clock-display" aria-label="Current Tokyo Time">
            {clockText}
          </div>
          <div className="tiny-label">東京</div>
        </div>
      </div>
    </header>
  );
}
