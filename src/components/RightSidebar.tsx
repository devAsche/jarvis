"use client";

import React, { useState } from "react";
import type { ApprovalItem, BusinessSummary, MorningBriefing, SourceEventEnvelope } from "../contracts";
import { HudPanel } from "./HudPanel";
import { SECTION_LABEL, briefItemText, jstDateTime, jstTime, money, yen } from "./demoText";

interface RightSidebarProps {
  mode: "DEMO" | "READ_ONLY";
  approvals: ApprovalItem[];
  order: SourceEventEnvelope | undefined;
  briefing: MorningBriefing | null;
  briefReady: boolean;
  briefNote: string;
  summary: BusinessSummary;
  clientReady: boolean;
  decisionRef?: React.Ref<HTMLElement>;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onOpenEvidence: (id: string) => void;
  onOpenBriefing: () => void;
  onOpenNumbers: () => void;
}

const STATUS_TEXT: Record<ApprovalItem["status"], string> = {
  pending: "確認待ち", approved: "承認済み", rejected: "見送り済み", expired: "期限切れ", cancelled: "取消",
};

function DemoShippingDiff({ order }: { order: SourceEventEnvelope | undefined }) {
  const est = order?.data.estimated_shipping_minor;
  const quoted = order?.data.quoted_shipping_minor;
  const diff = typeof est === "number" && typeof quoted === "number" ? quoted - est : null;
  const ratio = typeof est === "number" && typeof quoted === "number" && quoted > 0 ? (est / quoted) * 100 : 100;
  return (
    <>
      <div className="diff">
        <div><div className="cap">見積</div><div className="n">{yen(est)}</div></div>
        <div className="arr" aria-hidden="true">→</div>
        <div><div className="cap">請求{diff !== null && ` · +${yen(diff)}`}</div><div className="n to">{yen(quoted)}</div></div>
      </div>
      <div className="meter" aria-hidden="true"><i style={{ width: `${ratio}%` }} /><b style={{ left: `${ratio}%` }} /></div>
    </>
  );
}

export function RightSidebar(props: RightSidebarProps) {
  const { mode, approvals, order, briefing, briefReady, briefNote, summary, clientReady, decisionRef, onApprove, onReject, onOpenEvidence, onOpenBriefing, onOpenNumbers } = props;
  const pendingList = approvals.filter((a) => a.status === "pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const item = approvals.find((a) => a.intent_id === selectedId) ?? pendingList[0] ?? approvals[0];
  const pending = item?.status === "pending";
  const demo = item?.action_type.startsWith("demo.");
  const live = mode === "READ_ONLY";
  return (
    <aside className="hud-col hud-right" aria-label="判断と報告">
      <HudPanel tone="decision" panelRef={decisionRef} tabIndex={-1} aria-labelledby="decision-title">
        {item ? (
          <>
            <div className="dec-label"><span>{pendingList.length ? `判断が必要 · ${pendingList.length}件` : "記録済み"}</span><span className="hp-code">期限 {clientReady ? jstDateTime(item.expires_at) : "--/-- --:--"}</span></div>
            <h3 id="decision-title">{demo ? "サンプル注文の配送費差額" : item.title}</h3>
            {demo ? <DemoShippingDiff order={order} /> : <p className="dec-desc">{item.description}</p>}
            <dl className="facts">
              <dt>対象</dt><dd>{item.account}</dd>
              <dt>注文</dt><dd className="mono">{item.target_id} · {money(item.amount_cap_minor, item.currency)}{demo ? "（例示）" : ""}</dd>
              <dt>状態</dt><dd>{pending ? STATUS_TEXT.pending : <span className="done-stamp">{demo ? "模擬" : ""}{STATUS_TEXT[item.status]}{item.reviewed_at && ` · ${jstTime(item.reviewed_at)}`}</span>}</dd>
            </dl>
            <div className="acts">
              {pending && <>
                <button className="btn gold" onClick={() => onApprove(item.intent_id)}>{demo ? "模擬承認する" : "確認済みにする"}</button>
                <button className="btn ghost" onClick={() => onReject(item.intent_id)}>見送る</button>
              </>}
              <button className="btn ghost" onClick={() => onOpenEvidence(item.intent_id)}>根拠を見る</button>
            </div>
            {pendingList.length > 1 && (
              <ul className="queue" aria-label="ほかの確認待ち">
                {pendingList.filter((a) => a.intent_id !== item.intent_id).slice(0, 4).map((a) => (
                  <li key={a.intent_id}><button className="link-btn" onClick={() => setSelectedId(a.intent_id)}>{a.title}</button></li>
                ))}
              </ul>
            )}
            <p className="fine">{live ? "記録するのは「確認した」ことだけです。Shopifyの注文・発送・返金は変更しません。" : "記録しても発注・支払い・出荷は行いません。"}音声の「はい」では確定しません。</p>
          </>
        ) : (
          <>
            <div className="dec-label"><span>判断が必要なものはありません</span></div>
            <p className="muted">{live ? "「朝の報告」でShopifyを読み取ると、ルールに当てはまる注文がここに並びます。" : "確認待ちはありません。"}</p>
          </>
        )}
      </HudPanel>
      <HudPanel title="朝の報告" code={briefReady && briefing ? `出典 · ${jstTime(briefing.generated_at)} 作成` : "未作成"}>
        {briefReady && briefing ? (
          <>
            <ul className="brief">
              {briefing.sections.flatMap((sec) => sec.items.map((it) => (
                <li key={it.id}>
                  <span className={`kind${sec.kind === "anomalies" ? " alert" : ""}`}>{live && sec.kind === "pending" ? "滞留" : SECTION_LABEL[sec.kind]}</span>
                  <div><p>{briefItemText(it)}</p><span className="src">{it.source}</span></div>
                </li>
              )))}
            </ul>
            <button className="link-btn" onClick={onOpenBriefing}>報告の詳細を開く</button>
          </>
        ) : <p className="muted">{briefNote}</p>}
      </HudPanel>
      <HudPanel title="事業の数字" code={live ? `Shopify · ${summary.provenance === "LIVE_VERIFIED" ? "LIVE" : summary.provenance}` : "サンプル値"}>
        <div className="nums">
          <div><span>{live ? "24時間の注文額" : "注文額の例"}</span><b>{money(summary.order_revenue_minor, summary.order_revenue_currency)}</b></div>
          <div><span>{live ? "24時間の注文" : "MIX問い合わせ"}</span><b>{live ? summary.example_orders_count : summary.mix_inquiries_count}<small>件</small></b></div>
          <div><span>利益</span><b className="unk">{summary.net_profit_status === "UNKNOWN" ? "不明" : summary.net_profit_status === "ESTIMATED" ? "推定" : "計算済み"}</b></div>
          <div><span>最終同期</span><b className="unk">{summary.last_verified_sync === "NEVER" ? "なし" : clientReady ? jstDateTime(summary.last_verified_sync) : "—"}</b></div>
        </div>
        <button className="link-btn" onClick={onOpenNumbers}>事業別の数字を開く</button>
      </HudPanel>
    </aside>
  );
}
