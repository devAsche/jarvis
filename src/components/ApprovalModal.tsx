"use client";

import React from "react";
import { ApprovalItem } from "../contracts";
import { useDialogFocus } from "../lib/useDialogFocus";
import { money } from "./demoText";

const STATUS: Record<ApprovalItem["status"], string> = { pending: "確認待ち", approved: "承認済み", rejected: "見送り済み", expired: "期限切れ", cancelled: "取消" };

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
  const demo = item.action_type.startsWith("demo.");

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
          <h2 id="approval-modal-title">{demo ? "配送費の確認 · DEMO" : `${item.title} · READ ONLY`}</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="閉じる"
          >
            閉じる
          </button>
        </div>

        <span className="pill-tag">{demo ? "実際の発注・支払いなし" : "Shopifyへの書き込みなし"}</span>

        <div className="approval-box">
          <div className="section-kicker">
            {demo ? "サンプル注文" : item.account} · {item.target_id}
          </div>
          <strong>{demo ? "サンプル注文の配送費差額" : item.title}</strong>
          <p className="narrative-block">
            対象: {item.account} / 注文額: {money(item.amount_cap_minor, item.currency)}{demo ? "（サンプル）" : ""}
            <br />
            {demo ? "見積 ¥900 に対し、配送費の提示額は ¥1,550 です。差額 ¥650 を確認してください。ここで判断を記録しても、実際の発注・支払い・出荷は行いません。" : item.description}
          </p>
          <div className="tiny-label">
            {demo ? "模擬判断" : "確認の記録"} · 外部への効果なし · {STATUS[item.status]}
          </div>
          <div className="tiny-label">
            根拠: {demo ? "サンプル注文の配送費提示額が見積を ¥650 上回っています。" : item.reason}
            <br />
            確認期限: {new Date(item.expires_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} JST
          </div>
          <details className="approval-source-detail"><summary>元データを確認</summary><p>{item.title} · {item.reason}</p><p>{item.description}</p></details>

          {isPending ? (
            <div className="button-row">
              <button
                className="cyber-btn primary"
                onClick={() => onApprove(item.intent_id)}
              >
                {demo ? "模擬承認を記録" : "確認済みにする"}
              </button>
              <button
                className="cyber-btn gold"
                onClick={() => onReject(item.intent_id)}
              >
                {demo ? "模擬拒否を記録" : "見送る"}
              </button>
            </div>
          ) : (
            <div className="modal-notice">
              判断を記録しました。外部操作はありません。
            </div>
          )}
        </div>

        <div className="narrative-block">
          <p>
            <b>安全条件:</b>
          </p>
          <ul>
            <li>音声入力の「はい」のみでは高リスク操作（発注/出金/広告変更）を実行しません。</li>
            <li>対象ID、固定項目、有効期限、金額をサーバー側で照合します。</li>
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
