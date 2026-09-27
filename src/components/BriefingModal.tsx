"use client";

import React, { useEffect, useRef } from "react";
import { MorningBriefing } from "../contracts";

interface BriefingModalProps {
  briefing: MorningBriefing;
  onClose: () => void;
  onGoToApprovals: () => void;
  onSpeak: () => void;
}

export function BriefingModal({
  briefing,
  onClose,
  onGoToApprovals,
  onSpeak,
}: BriefingModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

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
      aria-labelledby="briefing-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-window">
        <div className="modal-header">
          <h2 id="briefing-modal-title">MORNING BRIEF / SAMPLE</h2>
          <button
            ref={closeBtnRef}
            className="modal-close-btn"
            onClick={onClose}
            aria-label="閉じる"
          >
            ✕ CLOSE
          </button>
        </div>

        <span className="pill-tag">DEMO DATA ONLY</span>

        <div className="card-grid-2">
          <div className="stat-card">
            <small>LAST 24 HOURS</small>
            <strong>01</strong>
            <small>EXAMPLE SHIPPING ALERT</small>
          </div>
          <div className="stat-card">
            <small>PENDING WORK</small>
            <strong>02</strong>
            <small>EXAMPLE MIX INQUIRIES</small>
          </div>
        </div>

        <div className="narrative-block">
          <p>
            <b>おはようございます。</b>
            これはReelsで見た朝の業務報告を再現したサンプルです。実際の店舗・メール・予定表には接続されていません。
          </p>
          <ol>
            {briefing.sections.map((sec) => (
              <li key={sec.kind}>
                <b>{sec.title}:</b>{" "}
                {sec.items.map((it) => it.headline).join(" / ")}
              </li>
            ))}
          </ol>
        </div>

        <div className="button-row" style={{ marginTop: "18px" }}>
          <button
            className="cyber-btn primary"
            onClick={() => {
              onClose();
              onGoToApprovals();
            }}
          >
            REVIEW SAMPLE APPROVAL
          </button>
          <button className="cyber-btn" onClick={onSpeak}>
            READ ALOUD (BROWSER TTS)
          </button>
        </div>

        <div className="tiny-label" style={{ marginTop: "16px" }}>
          SOURCE: LOCAL FIXTURES / FRESHNESS: SAMPLE / GENERATED: {briefing.generated_at}
        </div>
        <p style={{ marginTop: "12px", fontSize: "11px", color: "#7b9bb1" }}>
          OFFLINE VISUAL PROTOTYPE • NO API CALLS • NO BUSINESS ACTIONS
        </p>
      </div>
    </div>
  );
}
