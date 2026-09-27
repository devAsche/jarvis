"use client";

import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { LeftSidebar } from "../components/LeftSidebar";
import { CentralCore } from "../components/CentralCore";
import { RightSidebar } from "../components/RightSidebar";
import { CommandBar } from "../components/CommandBar";
import { BriefingModal } from "../components/BriefingModal";
import { DashboardModal } from "../components/DashboardModal";
import { ApprovalModal } from "../components/ApprovalModal";

import {
  CoreState,
  UIMode,
  MorningBriefing,
  SourceEventEnvelope,
  ApprovalItem,
  BusinessSummary,
  SystemStatus,
} from "../contracts";

import {
  initialBriefing,
  initialEvents,
  initialApprovals,
  initialBusinessSummary,
  initialSystemStatus,
} from "../fixtures";

export default function JarvisApp() {
  const [uiMode, setUiMode] = useState<UIMode>("PRESENCE");
  const [coreState, setCoreState] = useState<CoreState>("IDLE");
  const [stateLabel, setStateLabel] = useState("SYSTEM STANDBY");
  const [subLabel, setSubLabel] = useState("All services disconnected · demonstration mode");
  const [caption, setCaption] = useState(
    "おはようございます。現在はデモモードです。業務情報の確認や承認操作を試すことができます。"
  );

  const [briefing] = useState<MorningBriefing>(initialBriefing);
  const [events, setEvents] = useState<SourceEventEnvelope[]>(initialEvents);
  const [approvals, setApprovals] = useState<ApprovalItem[]>(initialApprovals);
  const [summary] = useState<BusinessSummary>(initialBusinessSummary);
  const [systemStatus] = useState<SystemStatus>(initialSystemStatus);

  const pendingApprovalsCount = approvals.filter((a) => a.status === "pending").length;

  useEffect(() => {
    if (coreState === "AWAITING_APPROVAL") {
      document.body.classList.add("alert-mode");
    } else {
      document.body.classList.remove("alert-mode");
    }
  }, [coreState]);

  const addEventLog = (type: string, message: string) => {
    const newEvent: SourceEventEnvelope = {
      event_id: `evt_${Date.now()}`,
      source: "client.simulation",
      type,
      mode: "DEMO",
      occurred_at: new Date().toISOString(),
      received_at: new Date().toISOString(),
      source_freshness: "DEMO",
      correlation_id: `corr_${Date.now()}`,
      data: { message },
    };
    setEvents((prev) => [newEvent, ...prev.slice(0, 7)]);
  };

  const openBriefing = () => {
    setCoreState("SPEAKING");
    setStateLabel("BRIEFING READY");
    setSubLabel("DEMO / NO LIVE AGENT EXECUTION");
    setCaption("サンプルの朝の報告を準備しました。根拠となる実データには未接続です。");
    addEventLog("system.briefing.opened", "Morning briefing displayed (sample data).");
    setUiMode("BRIEFING");
  };

  const openDashboard = () => {
    setCoreState("IDLE");
    setStateLabel("DASHBOARD READY");
    setSubLabel("DEMO / NO LIVE AGENT EXECUTION");
    setCaption("事業ごとの数値を確認できます。すべて架空のサンプルです。");
    addEventLog("system.dashboard.opened", "Cross-business overview opened.");
    setUiMode("DASHBOARD");
  };

  const openApprovals = () => {
    const isPending = pendingApprovalsCount > 0;
    setCoreState(isPending ? "AWAITING_APPROVAL" : "IDLE");
    setStateLabel(isPending ? "AWAITING REVIEW" : "REVIEW COMPLETED");
    setSubLabel("DEMO / NO LIVE AGENT EXECUTION");
    setCaption(
      isPending
        ? "模擬注文について承認または否認を試せます。"
        : "模擬処理は履歴へ記録されました。追加の未処理承認はありません。"
    );
    addEventLog("system.approvals.opened", "Approval center opened.");
    setUiMode("APPROVAL_CENTER");
  };

  const handleApprove = (intentId: string) => {
    setApprovals((prev) =>
      prev.map((item) =>
        item.intent_id === intentId
          ? {
              ...item,
              status: "approved",
              reviewed_by: "local-user",
              reviewed_at: new Date().toISOString(),
            }
          : item
      )
    );
    setCoreState("IDLE");
    setStateLabel("APPROVAL GRANTED (SIMULATED)");
    setSubLabel("No external purchasing or transaction executed");
    setCaption("模擬承認を記録しました。実ストアへの発注や課金は行われません。");
    addEventLog(
      "approval.decision.simulated",
      `Intent ${intentId} approved. No external effect.`
    );
  };

  const handleReject = (intentId: string) => {
    setApprovals((prev) =>
      prev.map((item) =>
        item.intent_id === intentId
          ? {
              ...item,
              status: "rejected",
              reviewed_by: "local-user",
              reviewed_at: new Date().toISOString(),
            }
          : item
      )
    );
    setCoreState("IDLE");
    setStateLabel("APPROVAL REJECTED (SIMULATED)");
    setSubLabel("No external purchasing or transaction executed");
    setCaption("模擬差し戻しを記録しました。");
    addEventLog(
      "approval.decision.simulated",
      `Intent ${intentId} rejected. No external effect.`
    );
  };

  const handleSpeakTTS = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      addEventLog("speech.tts.unavailable", "Browser TTS is not supported in this environment.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      "おはようございます。デモモードです。昨日の配送費の確認が1件、ミックスのお問い合わせが2件あります。これらはすべてサンプルデータです。"
    );
    utterance.lang = "ja-JP";
    utterance.onstart = () => {
      setCoreState("SPEAKING");
      setStateLabel("AGENT SPEAKING");
    };
    utterance.onend = () => {
      setCoreState("IDLE");
      setStateLabel("SYSTEM STANDBY");
    };
    utterance.onerror = () => {
      setCoreState("IDLE");
      setStateLabel("SYSTEM STANDBY");
    };
    window.speechSynthesis.speak(utterance);
    addEventLog("speech.tts.activated", "Browser TTS playback started.");
  };

  const handleCommand = (rawCommand: string) => {
    const cmd = rawCommand.toLowerCase();
    if (/承認|approval|注文|order/i.test(cmd)) {
      openApprovals();
    } else if (/ダッシュ|売上|dashboard|overview/i.test(cmd)) {
      openDashboard();
    } else if (/朝|brief|報告|おはよう|morning/i.test(cmd)) {
      openBriefing();
    } else {
      addEventLog("command.unknown", `Unknown command: ${rawCommand}`);
      setCoreState("ERROR");
      setStateLabel("DEMO COMMAND NOT FOUND");
      setCaption("対応するデモ指示：朝の報告／注文／ダッシュボード／承認");
      setTimeout(() => {
        setCoreState("IDLE");
        setStateLabel("SYSTEM STANDBY");
      }, 3500);
    }
  };

  return (
    <div className="shell">
      <Header />

      <main className="main-grid">
        <LeftSidebar connections={systemStatus.connections} events={events} />

        <CentralCore
          coreState={coreState}
          stateLabel={stateLabel}
          subLabel={subLabel}
          caption={caption}
          pendingApprovalsCount={pendingApprovalsCount}
          onOpenBriefing={openBriefing}
          onOpenDashboard={openDashboard}
          onOpenApprovals={openApprovals}
        />

        <RightSidebar
          summary={summary}
          agents={systemStatus.agents}
          modelRequestsCount={systemStatus.model_requests_count}
          onReviewPriorityAction={openApprovals}
        />
      </main>

      <CommandBar onCommandSubmit={handleCommand} />

      {uiMode === "BRIEFING" && (
        <BriefingModal
          briefing={briefing}
          onClose={() => {
            setUiMode("PRESENCE");
            setCoreState("IDLE");
            setStateLabel("SYSTEM STANDBY");
          }}
          onGoToApprovals={openApprovals}
          onSpeak={handleSpeakTTS}
        />
      )}

      {uiMode === "DASHBOARD" && (
        <DashboardModal
          summary={summary}
          onClose={() => {
            setUiMode("PRESENCE");
            setCoreState("IDLE");
            setStateLabel("SYSTEM STANDBY");
          }}
        />
      )}

      {uiMode === "APPROVAL_CENTER" && approvals.length > 0 && (
        <ApprovalModal
          item={approvals[0]}
          onClose={() => {
            setUiMode("PRESENCE");
            setCoreState("IDLE");
            setStateLabel("SYSTEM STANDBY");
          }}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
