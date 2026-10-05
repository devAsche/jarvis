"use client";

import React from "react";
import { ApprovalItem } from "../contracts";
import { useDialogFocus } from "../lib/useDialogFocus";

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
  const dialogRef = useDialogFocus(onClose);
  const isPending = item.status === "pending";

  return (
    <div
      className="modal-overlay"
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-window">
        <div className="modal-header">
          <h2 id="approval-modal-title">配送費の確認 · DEMO</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="閉じる"
          >
            閉じる
          </button>
        </div>

        <span className="pill-tag">実際の発注・支払いなし</span>

        <div className="approval-box">
          <div className="section-kicker">
            サンプル注文 · {item.target_id}
          </div>
          <strong>サンプル注文の配送費差額</strong>
          <p className="narrative-block">
            対象: {item.account} / 注文額: ¥{item.amount_cap_minor.toLocaleString()}（サンプル）
            <br />
            見積 ¥900 に対し、配送費の提示額は ¥1,550 です。差額 ¥650 を確認してください。ここで判断を記録しても、実際の発注・支払い・出荷は行いません。
          </p>
          <div className="tiny-label" style={{ margin: "10px 0" }}>
            模擬判断 · 外部への効果なし · {item.status === "pending" ? "確認待ち" : item.status === "approved" ? "模擬承認済み" : item.status === "rejected" ? "模擬拒否済み" : item.status}
          </div>
          <div className="tiny-label" style={{ margin: "10px 0" }}>
            根拠: サンプル注文の配送費提示額が見積を ¥650 上回っています。
            <br />
            確認期限: {new Date(item.expires_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} JST
          </div>
          <details className="approval-source-detail"><summary>元データを確認</summary><p>{item.title} · {item.reason}</p><p>{item.description}</p></details>

          {isPending ? (
            <div className="button-row" style={{ marginTop: "14px" }}>
              <button
                className="cyber-btn primary"
                onClick={() => onApprove(item.intent_id)}
              >
                模擬承認を記録
              </button>
              <button
                className="cyber-btn gold"
                onClick={() => onReject(item.intent_id)}
              >
                模擬拒否を記録
              </button>
            </div>
          ) : (
            <div className="modal-notice" style={{ marginTop: "14px" }}>
              模擬判断をローカルに記録しました。外部操作はありません。
            </div>
          )}
        </div>

        <div className="narrative-block">
          <p>
            <b>このデモの安全条件:</b>
          </p>
          <ul>
            <li>音声入力の「はい」のみでは高リスク操作（発注/出金/広告変更）を実行しません。</li>
            <li>このdemoでは対象ID、固定項目、有効期限、金額をサーバー側で照合します。</li>
            <li>同じ承認の再送や内容差替えは拒否されます。実行権限はありません。</li>
          </ul>
        </div>

        <p className="modal-foot">
          ローカルのサンプルのみ · 実サービスへの書込みなし
        </p>
      </div>
    </div>
  );
}
