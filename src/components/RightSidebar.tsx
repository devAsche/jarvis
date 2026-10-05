"use client";

import React from "react";
import type { ApprovalItem, BusinessSummary, MorningBriefing, SourceEventEnvelope } from "../contracts";
import { HudPanel } from "./HudPanel";
import { SECTION_LABEL, briefItemText, jstDateTime, jstTime, yen } from "./demoText";

interface RightSidebarProps {
  approval: ApprovalItem | undefined;
  order: SourceEventEnvelope | undefined;
  briefing: MorningBriefing;
  briefReady: boolean;
  briefNote: string;
  summary: BusinessSummary;
  /** False during SSR: fixture expiry is computed per process, so render it on the client only. */
  clientReady: boolean;
  decisionRef?: React.Ref<HTMLElement>;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onOpenEvidence: () => void;
  onOpenBriefing: () => void;
  onOpenNumbers: () => void;
}

const STATUS_TEXT: Record<ApprovalItem["status"], string> = {
  pending: "確認待ち", approved: "模擬承認済み", rejected: "見送り済み", expired: "期限切れ", cancelled: "取消",
};

export function RightSidebar({ approval, order, briefing, briefReady, briefNote, summary, clientReady, decisionRef, onApprove, onReject, onOpenEvidence, onOpenBriefing, onOpenNumbers }: RightSidebarProps) {
  const est = order?.data.estimated_shipping_minor;
  const quoted = order?.data.quoted_shipping_minor;
  const diff = typeof est === "number" && typeof quoted === "number" ? quoted - est : null;
  const ratio = typeof est === "number" && typeof quoted === "number" && quoted > 0 ? (est / quoted) * 100 : 100;
  const pending = approval?.status === "pending";
  return (
    <aside className="hud-col hud-right" aria-label="判断と報告">
      {approval && (
        <HudPanel tone="decision" panelRef={decisionRef} tabIndex={-1} aria-labelledby="decision-title">
          <div className="dec-label"><span>{pending ? "判断が必要 · 1件" : "記録済み"}</span><span className="hp-code">期限 {clientReady ? jstDateTime(approval.expires_at) : "--/-- --:--"}</span></div>
          <h3 id="decision-title">サンプル注文の配送費差額</h3>
          <div className="diff">
            <div><div className="cap">見積</div><div className="n">{yen(est)}</div></div>
            <div className="arr" aria-hidden="true">→</div>
            <div><div className="cap">請求{diff !== null && ` · +${yen(diff)}`}</div><div className="n to">{yen(quoted)}</div></div>
          </div>
          <div className="meter" aria-hidden="true"><i style={{ width: `${ratio}%` }} /><b style={{ left: `${ratio}%` }} /></div>
          <dl className="facts">
            <dt>対象</dt><dd>{approval.account}</dd>
            <dt>注文</dt><dd className="mono">{approval.target_id} · {yen(approval.amount_cap_minor)}（例示）</dd>
            <dt>状態</dt><dd>{pending ? STATUS_TEXT.pending : <span className="done-stamp">{STATUS_TEXT[approval.status]}{approval.reviewed_at && ` · ${jstTime(approval.reviewed_at)}`}</span>}</dd>
          </dl>
          <div className="acts">
            {pending && <>
              <button className="btn gold" onClick={() => onApprove(approval.intent_id)}>模擬承認する</button>
              <button className="btn ghost" onClick={() => onReject(approval.intent_id)}>見送る</button>
            </>}
            <button className="btn ghost" onClick={onOpenEvidence}>根拠を見る</button>
          </div>
          <p className="fine">記録しても発注・支払い・出荷は行いません。音声の「はい」では確定しません。</p>
        </HudPanel>
      )}
      <HudPanel title="朝の報告" code={briefReady ? `出典 · ${jstTime(briefing.generated_at)} 作成` : "未作成"}>
        {briefReady ? (
          <>
            <ul className="brief">
              {briefing.sections.flatMap((sec) => sec.items.map((item) => (
                <li key={item.id}>
                  <span className={`kind${sec.kind === "anomalies" ? " alert" : ""}`}>{SECTION_LABEL[sec.kind]}</span>
                  <div><p>{briefItemText(item)}</p><span className="src">{item.source}</span></div>
                </li>
              )))}
            </ul>
            <button className="link-btn" onClick={onOpenBriefing}>報告の詳細を開く</button>
          </>
        ) : <p className="muted">{briefNote}</p>}
      </HudPanel>
      <HudPanel title="事業の数字" code="サンプル値">
        <div className="nums">
          <div><span>注文額の例</span><b>{yen(summary.order_revenue_minor)}</b></div>
          <div><span>MIX問い合わせ</span><b>{summary.mix_inquiries_count}<small>件</small></b></div>
          <div><span>利益</span><b className="unk">{summary.net_profit_status === "UNKNOWN" ? "不明" : summary.net_profit_status === "ESTIMATED" ? "推定" : "計算済み"}</b></div>
          <div><span>実データ同期</span><b className="unk">{summary.last_verified_sync === "NEVER" ? "なし" : summary.last_verified_sync}</b></div>
        </div>
        <button className="link-btn" onClick={onOpenNumbers}>事業別の数字を開く</button>
      </HudPanel>
    </aside>
  );
}
