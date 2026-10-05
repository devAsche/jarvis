"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Header } from "../components/Header";
import { LeftSidebar } from "../components/LeftSidebar";
import { RightSidebar } from "../components/RightSidebar";
import { CommandBar } from "../components/CommandBar";
import { Dock, type DockAction } from "../components/Dock";
import { SourceCallouts } from "../components/SourceCallouts";
import { DisplaySettings } from "../components/DisplaySettings";
import { BriefingModal } from "../components/BriefingModal";
import { DashboardModal } from "../components/DashboardModal";
import { ApprovalModal } from "../components/ApprovalModal";
import { VoiceControls } from "../components/VoiceControls";
import { useJstNow } from "../components/useJstNow";
import { Core2DFallback } from "../components/presence/Core2DFallback";
import { CORE_TONES, LEGEND_TONES, toCoreTone, toSourceProgress, type CoreTone } from "../components/presence/CoreVisualState";

import {
  CoreState,
  GraphicsQuality,
  TaskRun,
  UIMode,
  MorningBriefing,
  SourceEventEnvelope,
  ApprovalItem,
  BusinessSummary,
  SystemStatus,
  toCoreVisualState,
} from "../contracts";

import {
  initialBriefing,
  initialEvents,
  initialApprovals,
  initialBusinessSummary,
  initialSystemStatus,
} from "../fixtures";

import { VoiceSessionController } from "../lib/voice/VoiceSessionController";
import type { VoiceSessionState } from "../lib/voice/VoiceSessionController";
import { acceptDemoEvent } from "../lib/demoSafety";

// Dynamic import for R3F Canvas — SSR disabled, client-only
const Core3DViewport = dynamic(
  () => import("../components/presence/Core3DViewport").then((mod) => ({ default: mod.Core3DViewport })),
  { ssr: false, loading: () => <Core2DFallback tone="standby" sources={["pending", "pending", "pending"]} /> }
);

// Decorative English tag inside the core; the meaning is always repeated in Japanese below it.
const CORE_TAG: Record<CoreTone, string> = {
  standby: "STANDBY", listening: "LISTENING", working: "FIXTURE READ", speaking: "SPEAKING",
  review: "AWAITING HUMAN", recorded: "RECORDED", error: "CHECK FAILED", offline: "OFFLINE",
};
const TONE_TITLE: Record<CoreTone, string> = {
  standby: "待機中", listening: "音声入力を模擬しています", working: "サンプル出典を照合中", speaking: "読み上げ中",
  review: "配送費の確認をお願いします", recorded: "判断を記録しました", error: "確認できません", offline: "切断中（模擬）",
};
const RUN_STATUS: Record<TaskRun["status"], string> = { running: "照合中", waiting_approval: "承認待ち", succeeded: "完了", failed: "失敗" };

export default function JarvisApp() {
  const [uiMode, setUiMode] = useState<UIMode>("PRESENCE");
  const [coreState, setCoreState] = useState<CoreState>("IDLE");
  const [notice, setNotice] = useState<string | null>(null);
  const [caption, setCaption] = useState("おはようございます。現在はデモモードです。「朝の報告」でサンプル出典の照合を始めます。");

  const [generatedBriefing, setGeneratedBriefing] = useState<MorningBriefing>(initialBriefing);
  const [events, setEvents] = useState<SourceEventEnvelope[]>(initialEvents);
  const [approvals, setApprovals] = useState<ApprovalItem[]>(initialApprovals);
  const [run, setRun] = useState<TaskRun | null>(null);
  const [summary] = useState<BusinessSummary>(initialBusinessSummary);
  const [systemStatus] = useState<SystemStatus>(initialSystemStatus);
  const [drawer, setDrawer] = useState<"voice" | "settings" | null>(null);
  const now = useJstNow();
  const decisionRef = useRef<HTMLElement>(null);
  const logRef = useRef<HTMLElement>(null);

  // --- R3F / Visual state ---
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [motion, setMotion] = useState<"normal" | "reduced">("normal");
  const reducedMotion = prefersReducedMotion || motion === "reduced";
  const [quality, setQuality] = useState<GraphicsQuality>("auto");
  const [narrow, setNarrow] = useState(false);
  const [gpuFailed, setGpuFailed] = useState(false);
  const [forceGpuFailure, setForceGpuFailure] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const commandTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    const nq = window.matchMedia("(max-width: 760px)");
    setNarrow(nq.matches);
    const nh = (e: MediaQueryListEvent) => setNarrow(e.matches);
    nq.addEventListener("change", nh);
    return () => { mq.removeEventListener("change", handler); nq.removeEventListener("change", nh); };
  }, []);

  useEffect(() => {
    setForceGpuFailure(process.env.NODE_ENV !== "production" && new URLSearchParams(location.search).get("gpu") === "fail");
  }, []);

  const applyRun = useCallback((next: TaskRun) => {
    setCoreState(next.operationalState.toUpperCase() as CoreState);
    setNotice(null);
    if (next.status === "waiting_approval") setCaption("朝の報告を出典ID付きで作成しました。配送費の差額を確認してください。");
    else if (next.status === "succeeded") setCaption("模擬判断を記録しました。発注・支払い・出荷は行っていません。");
    else if (next.status === "failed") setCaption("出典が一致しないため報告を作りませんでした。外部操作はしていません。");
    else setCaption("注文・問い合わせ・予定の3系統を読み取っています。外部への書き込みはしません。");
  }, []);

  const refreshDemo = useCallback(async () => {
    const response = await fetch("/api/demo/state", { cache: "no-store" });
    if (!response.ok) throw new Error("Demo state unavailable");
    const state = await response.json();
    setEvents(state.events);
    setApprovals(state.approvals);
    setGeneratedBriefing(state.briefing);
    setRun(state.run);
    if (state.run?.taskRunId) applyRun(state.run);
  }, [applyRun]);

  const apiDown = useCallback(() => setNotice("デモAPIに接続できません。実業務は実行していません。"), []);
  useEffect(() => { void refreshDemo().catch(apiDown); }, [refreshDemo, apiDown]);
  useEffect(() => {
    if (run?.status !== "running") return;
    const interval = setInterval(() => { void refreshDemo().catch(apiDown); }, 250);
    return () => clearInterval(interval);
  }, [run?.status, refreshDemo, apiDown]);

  const startRun = async (input: "text" | "voice") => {
    try {
      const response = await fetch("/api/demo/runs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) });
      if (!response.ok) throw new Error("Demo task could not start");
      const result = await response.json();
      setRun(result.run);
      applyRun(result.run);
      if (result.run.status !== "running") await refreshDemo();
    } catch {
      setCoreState("ERROR");
      apiDown();
    }
  };

  // --- Voice Controller (singleton for this page) ---
  const voiceControllerRef = useRef<VoiceSessionController | null>(null);
  if (voiceControllerRef.current === null) {
    voiceControllerRef.current = new VoiceSessionController();
  }
  const voiceController = voiceControllerRef.current;

  useEffect(() => () => {
    if (commandTimeout.current) clearTimeout(commandTimeout.current);
    if (utteranceRef.current) {
      utteranceRef.current.onstart = null;
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      window.speechSynthesis?.cancel();
    }
    void voiceController.dispose();
  }, [voiceController]);

  const [voiceState, setVoiceState] = useState<VoiceSessionState>(voiceController.getCurrentState());

  useEffect(() => {
    const unsubState = voiceController.onStateChange((state) => {
      setVoiceState(state);
      setAudioLevel(state.audioLevel);
    });
    const unsubEvent = voiceController.onUIEvent((event) => {
      // Voice mock may only drive presence states that need no task ID; a real run always wins.
      if (!run && ["listening", "speaking", "offline", "error", "idle"].includes(event.state)) setCoreState(event.state.toUpperCase() as CoreState);
      const newEvent: SourceEventEnvelope = {
        event_id: event.eventId,
        source: `voice.${event.source}`,
        type: `voice.state.${event.state}`,
        mode: "DEMO",
        occurred_at: event.occurredAt,
        received_at: new Date().toISOString(),
        source_freshness: "DEMO",
        correlation_id: event.sessionId || event.eventId,
        data: { message: event.message || "", audioLevel: event.audioLevel },
      };
      setEvents((prev) => acceptDemoEvent(prev, newEvent).slice(0, 12));
    });
    return () => { unsubState(); unsubEvent(); };
  }, [voiceController, run]);

  const pendingApprovalsCount = approvals.filter((a) => a.status === "pending").length;

  const addEventLog = (type: string, message: string) => {
    const newEvent: SourceEventEnvelope = {
      event_id: crypto.randomUUID(),
      source: "client.simulation",
      type,
      mode: "DEMO",
      occurred_at: new Date().toISOString(),
      received_at: new Date().toISOString(),
      source_freshness: "DEMO",
      correlation_id: crypto.randomUUID(),
      data: { message },
    };
    setEvents((prev) => acceptDemoEvent(prev, newEvent).slice(0, 12));
  };

  const reveal = (el: HTMLElement | null) => {
    el?.scrollIntoView({ block: "center", behavior: reducedMotion ? "auto" : "smooth" });
    el?.focus({ preventScroll: true });
  };
  const closeModal = () => setUiMode("PRESENCE");
  const openDashboard = () => { addEventLog("system.dashboard.opened", "Cross-business overview opened."); setUiMode("DASHBOARD"); };
  const focusDecision = () => reveal(decisionRef.current);

  const handleDecision = async (intentId: string, decision: "approved" | "rejected") => {
    const response = await fetch(`/api/demo/approvals/${encodeURIComponent(intentId)}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision }) }).catch(() => null);
    if (!response?.ok) {
      setNotice("記録できませんでした（期限切れ・重複・対象の変更）。外部操作はしていません。");
      return;
    }
    await refreshDemo();
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
    utteranceRef.current = utterance;
    utterance.lang = "ja-JP";
    const restore = () => setCoreState(run ? run.operationalState.toUpperCase() as CoreState : "IDLE");
    utterance.onstart = () => setCoreState("SPEAKING");
    utterance.onend = restore;
    utterance.onerror = restore;
    window.speechSynthesis.speak(utterance);
    addEventLog("speech.tts.activated", "Browser TTS playback started.");
  };

  const handleCommand = (rawCommand: string) => {
    if (/承認|approval|注文|order/i.test(rawCommand)) focusDecision();
    else if (/ダッシュ|売上|数字|dashboard|overview/i.test(rawCommand)) openDashboard();
    else if (/朝|brief|報告|おはよう|morning/i.test(rawCommand)) void startRun("text");
    else {
      addEventLog("command.unknown", `Unknown command: ${rawCommand}`);
      setNotice("その指示には対応していません。対応する指示: 朝の報告 / 承認 / 数字");
      if (commandTimeout.current) clearTimeout(commandTimeout.current);
      commandTimeout.current = setTimeout(() => setNotice(null), 4000);
    }
  };

  const onDock = (action: DockAction) => {
    if (action === "brief") void startRun("text");
    else if (action === "approve") focusDecision();
    else if (action === "numbers") openDashboard();
    else if (action === "log") reveal(logRef.current);
    else setDrawer((d) => (d === action ? null : action));
  };

  // --- derived presence state ---
  const coreVisualState = toCoreVisualState(coreState);
  const tone = toCoreTone(coreVisualState, run?.status === "succeeded");
  const sources = toSourceProgress(run);
  const effectiveQuality: GraphicsQuality = quality === "auto" ? (narrow ? "low" : "balanced") : quality;
  const useR3F = effectiveQuality !== "off" && !reducedMotion && !gpuFailed;
  const handleWebGLError = useCallback(() => setGpuFailed(true), []);
  const briefReady = run?.status === "waiting_approval" || run?.status === "succeeded";
  const voiceLabel = `音声 ${voiceState.providerName.includes("Mock") || voiceState.providerName.includes("モック") ? "モック" : voiceState.providerName}${voiceState.isMuted ? " · ミュート" : ""}`;
  const markedDates = events.filter((e) => e.type === "calendar.event.upcoming" && typeof e.data.starts_at === "string")
    .map((e) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date(e.data.starts_at as string)));
  const toneStyle = { "--st": CORE_TONES[tone].main, "--st2": CORE_TONES[tone].hi } as React.CSSProperties;

  return (
    <div className={`deck${reducedMotion ? "" : " motion"}`} style={toneStyle}>
      <Header now={now} voiceLabel={voiceLabel} markedDates={markedDates} />

      <LeftSidebar now={now} connections={systemStatus.connections} events={events} briefGeneratedAt={briefReady ? generatedBriefing.generated_at : null} logRef={logRef} />

      <main className="stage" aria-label="JARVISの状態">
        <div className="core-wrap">
          {useR3F ? (
            <Core3DViewport tone={tone} sources={sources} quality={effectiveQuality} audioLevel={audioLevel} reducedMotion={reducedMotion} onWebGLError={handleWebGLError} forceFailure={forceGpuFailure} />
          ) : (
            <Core2DFallback tone={tone} sources={sources} />
          )}
          <div className="core-tag" aria-hidden="true"><b>{CORE_TAG[tone]}</b><span>{run ? `RUN ${run.taskRunId.slice(0, 8)}` : "NO ACTIVE TASK"}</span></div>
          {!narrow && <SourceCallouts events={events} progress={sources} layout="orbit" />}
        </div>

        <div className={`status tone-${tone}`} aria-live="polite">
          <span className="s-tag">DEMO · {run ? `デモタスク ${run.taskRunId.slice(0, 8)} · ${RUN_STATUS[run.status]}` : "稼働中タスクなし"}</span>
          <strong>{notice && tone !== "review" ? "確認してください" : TONE_TITLE[tone]}</strong>
          <p>{notice ?? caption}</p>
          {voiceState.currentSubtitle && <p className="subtitle"><span>字幕</span>{voiceState.currentSubtitle}</p>}
        </div>
        <div className="legend" aria-label="コアの色と状態">
          {LEGEND_TONES.map((t) => (
            <span key={t} className={t === tone ? "on" : ""} style={{ "--c": CORE_TONES[t].main } as React.CSSProperties}><i aria-hidden="true" />{CORE_TONES[t].label}</span>
          ))}
          {!LEGEND_TONES.includes(tone) && <span className="on" style={{ "--c": CORE_TONES[tone].main } as React.CSSProperties}><i aria-hidden="true" />{CORE_TONES[tone].label}</span>}
        </div>
        {narrow && <SourceCallouts events={events} progress={sources} layout="list" />}
        <CommandBar onCommandSubmit={handleCommand} />

        {drawer === "voice" && (
          <VoiceControls
            isMuted={voiceState.isMuted}
            transcriptHistory={voiceState.transcriptHistory}
            audioLevel={voiceState.audioLevel}
            providerName={voiceState.providerName}
            onToggleMute={() => voiceController.toggleMute()}
            onTriggerBriefing={() => { void voiceController.triggerMorningBriefing(); void startRun("voice"); }}
            onTriggerApproval={() => voiceController.triggerApprovalRequest()}
            onTriggerError={() => voiceController.triggerErrorScenario()}
            onTriggerOffline={() => voiceController.triggerOffline()}
            onInterrupt={() => voiceController.interrupt()}
          />
        )}
        {drawer === "settings" && (
          <DisplaySettings quality={quality} motion={motion} systemReduced={prefersReducedMotion} gpuFailed={gpuFailed} onQuality={setQuality} onMotion={setMotion} />
        )}
      </main>

      <RightSidebar
        approval={approvals[0]}
        order={events.find((e) => e.event_id === "demo_001")}
        briefing={generatedBriefing}
        briefReady={briefReady}
        briefNote={run?.status === "running" ? "照合が終わると、出典ID付きでここに並びます。" : run?.status === "failed" ? "照合に失敗したため作成していません。" : "まだ作成していません。「朝の報告」で作成します。"}
        summary={summary}
        clientReady={now !== null}
        decisionRef={decisionRef}
        onApprove={(id) => handleDecision(id, "approved")}
        onReject={(id) => handleDecision(id, "rejected")}
        onOpenEvidence={() => setUiMode("APPROVAL_CENTER")}
        onOpenBriefing={() => setUiMode("BRIEFING")}
        onOpenNumbers={openDashboard}
      />

      <Dock pendingApprovals={pendingApprovalsCount} open={drawer} onAction={onDock} />

      {uiMode === "BRIEFING" && (
        <BriefingModal briefing={generatedBriefing} run={run} onClose={closeModal} onGoToApprovals={focusDecision} onSpeak={handleSpeakTTS} />
      )}
      {uiMode === "DASHBOARD" && <DashboardModal summary={summary} onClose={closeModal} />}
      {uiMode === "APPROVAL_CENTER" && approvals.length > 0 && (
        <ApprovalModal item={approvals[0]} onClose={closeModal} onApprove={(id) => handleDecision(id, "approved")} onReject={(id) => handleDecision(id, "rejected")} />
      )}
    </div>
  );
}
