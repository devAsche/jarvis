"use client";

import React, { useEffect, useRef } from "react";
import { ApprovalItem } from "../contracts";

interface ApprovalModalProps {
  item: ApprovalItem;
  onClose: () => void;
  onApprove: (intentId: string) => void;
  onReject: (intentId: string) => void;
}

export function ApprovalModal({
  item,
  onClose,
  onApprove,
  onReject,
}: ApprovalModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const isPending = item.status === "pending";

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
      aria-labelledby="approval-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-window">
        <div className="modal-header">
          <h2 id="approval-modal-title">APPROVAL CENTER / DEMO</h2>
          <button
            ref={closeBtnRef}
            className="modal-close-btn"
            onClick={onClose}
            aria-label="閉じる"
          >
            ✕ CLOSE
          </button>
        </div>

        <span className="pill-tag">NO REAL PURCHASE</span>

        <div className="approval-box">
          <div className="section-kicker">
            FIXTURE.SHOPIFY · {item.target_id}
          </div>
          <strong>{item.title}</strong>
          <p className="narrative-block">
            対象: {item.account} / 注文額: ¥{item.amount_cap_minor.toLocaleString()}（サンプル）
            <br />
            {item.description}
          </p>
          <div className="tiny-label" style={{ margin: "10px 0" }}>
            ACTION: {item.action_type} • EFFECT: NONE • STATE: {item.status.toUpperCase()}
          </div>

          {isPending ? (
            <div className="button-row" style={{ marginTop: "14px" }}>
              <button
                className="cyber-btn primary"
                onClick={() => onApprove(item.intent_id)}
              >
                APPROVE (SIMULATED)
              </button>
              <button
                className="cyber-btn gold"
                onClick={() => onReject(item.intent_id)}
              >
                REJECT (SIMULATED)
              </button>
            </div>
          ) : (
            <div className="modal-notice" style={{ marginTop: "14px" }}>
              Decision recorded locally ({item.status.toUpperCase()}). No external action executed.
            </div>
          )}
        </div>

        <div className="narrative-block">
          <p>
            <b>本番実装の安全設計:</b>
          </p>
          <ul style={{ fontSize: "12px", color: "#a5c2d7" }}>
            <li>音声入力の「はい」のみでは高リスク操作（発注/出金/広告変更）を実行しません。</li>
            <li>承認画面で対象ID、固定payload hash、有効期限、金額上限を検証します。</li>
            <li>承認後に内容が改ざんされた場合、サーバー側の照合で即座に拒絶されます。</li>
          </ul>
        </div>

        <p style={{ marginTop: "14px", fontSize: "11px", color: "#7b9bb1" }}>
          OFFLINE VISUAL PROTOTYPE • NO API CALLS • NO BUSINESS ACTIONS
        </p>
      </div>
    </div>
  );
}
