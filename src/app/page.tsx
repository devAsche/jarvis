"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Header } from "../components/Header";
import { LeftSidebar } from "../components/LeftSidebar";
import { Core2DFallback } from "../components/presence/Core2DFallback";
import { RightSidebar } from "../components/RightSidebar";
import { CommandBar } from "../components/CommandBar";
import { BriefingModal } from "../components/BriefingModal";
import { DashboardModal } from "../components/DashboardModal";
import { ApprovalModal } from "../components/ApprovalModal";
import { VoiceControls } from "../components/VoiceControls";

import {
  CoreState,
  CoreVisualState,
  CoreEffectMode,
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
  () =>
    import("../components/presence/Core3DViewport").then((mod) => ({
      default: mod.Core3DViewport,
    })),
  {
    ssr: false,
    loading: () => <Core2DFallback state="idle" reducedMotion />,
  }
);

export default function JarvisApp() {
  const [uiMode, setUiMode] = useState<UIMode>("PRESENCE");
  const [coreState, setCoreState] = useState<CoreState>("IDLE");
  const [stateLabel, setStateLabel] = useState("SYSTEM STANDBY");
  const [subLabel, setSubLabel] = useState("実サービスは未接続です。サンプルのみ表示しています。");
  const [caption, setCaption] = useState(
    "おはようございます。現在はデモモードです。業務情報の確認や承認操作を試すことができます。"
  );

  const [generatedBriefing, setGeneratedBriefing] = useState<MorningBriefing>(initialBriefing);
  const [events, setEvents] = useState<SourceEventEnvelope[]>(initialEvents);
  const [approvals, setApprovals] = useState<ApprovalItem[]>(initialApprovals);
  const [run, setRun] = useState<TaskRun | null>(null);
  const activeRunRef = useRef<string | null>(null);
  const pulseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [taskPulse, setTaskPulse] = useState(false);
  const [summary] = useState<BusinessSummary>(initialBusinessSummary);
  const [systemStatus] = useState<SystemStatus>(initialSystemStatus);

  // --- R3F / Visual state ---
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [motion, setMotion] = useState<"normal" | "reduced">("normal");
  const reducedMotion = prefersReducedMotion || motion === "reduced";
  const [quality, setQuality] = useState<GraphicsQuality>("auto");
  const [selectedEffect, setSelectedEffect] = useState<"auto" | CoreEffectMode>("auto");
  const [gpuFailed, setGpuFailed] = useState(false);
  const [forceGpuFailure, setForceGpuFailure] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const commandTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    setForceGpuFailure(process.env.NODE_ENV !== "production" && new URLSearchParams(location.search).get("gpu") === "fail");
  }, []);

  const refreshDemo = useCallback(async () => {
    const response = await fetch("/api/demo/state", { cache: "no-store" });
    if (!response.ok) throw new Error("Demo state unavailable");
    const state = await response.json();
    setEvents(state.events);
    setApprovals(state.approvals);
    setGeneratedBriefing(state.briefing);
    setRun(state.run);
    if (state.run?.taskRunId === activeRunRef.current && state.run.status === "waiting_approval") {
      activeRunRef.current = null;
      setTaskPulse(true);
      if (pulseTimeout.current) clearTimeout(pulseTimeout.current);
      pulseTimeout.current = setTimeout(() => setTaskPulse(false), 500);
    }
    if (state.run?.taskRunId) {
      setCoreState(state.run.operationalState.toUpperCase() as CoreState);
      setStateLabel(`MOCK TASK ${state.run.status.toUpperCase()}`);
      setSubLabel(`run ${state.run.taskRunId.slice(0, 8)} · ${state.run.reason}`);
      if (state.run.status === "waiting_approval") setCaption("MOCKブリーフは根拠ID付きで準備済み。模擬承認を画面で確認してください。");
    }
  }, []);

  useEffect(() => { void refreshDemo().catch(() => setSubLabel("DEMO API unavailable")); }, [refreshDemo]);
  useEffect(() => {
    if (run?.status !== "running") return;
    const interval = setInterval(() => { void refreshDemo().catch(() => setSubLabel("DEMO API unavailable")); }, 250);
    return () => clearInterval(interval);
  }, [run?.status, refreshDemo]);

  const startRun = async (input: "text" | "voice") => {
    try {
      const response = await fetch("/api/demo/runs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) });
      if (!response.ok) throw new Error("Demo task could not start");
      const result = await response.json();
      setRun(result.run);
      activeRunRef.current = result.run.status === "running" ? result.run.taskRunId : null;
      setCoreState(result.run.operationalState.toUpperCase() as CoreState);
      setStateLabel(`MOCK TASK ${result.run.status.toUpperCase()}`);
      setSubLabel(`run ${result.run.taskRunId.slice(0, 8)} · ${result.run.reason}`);
      if (result.run.status !== "running") await refreshDemo();
      setCaption(result.run.status === "succeeded" ? "MOCKブリーフの根拠を再表示します。模擬承認は記録済みです。" : "MOCKタスクのfixture照合中。注文・MIX・予定の出典IDを確認します。");
      setUiMode("BRIEFING");
    } catch {
      setCoreState("ERROR");
      setSubLabel("DEMO API unavailable / 実業務は実行していません");
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
    if (pulseTimeout.current) clearTimeout(pulseTimeout.current);
    if (utteranceRef.current) {
      utteranceRef.current.onstart = null;
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      window.speechSynthesis?.cancel();
    }
    document.body.classList.remove("alert-mode");
    void voiceController.dispose();
  }, [voiceController]);

  const [voiceState, setVoiceState] = useState<VoiceSessionState>(
    voiceController.getCurrentState()
  );

  useEffect(() => {
    const unsubState = voiceController.onStateChange((state) => {
      setVoiceState(state);
      setAudioLevel(state.audioLevel);
    });

    const unsubEvent = voiceController.onUIEvent((event) => {
      // Map voice UIEvent state to CoreState for 3D visual sync
      if (!run && ["listening", "offline", "error", "idle"].includes(event.state)) setCoreState(event.state.toUpperCase() as CoreState);
      if (event.message && !run) {
        setSubLabel(`DEMO · ${event.message.slice(0, 60)}`);
      }

      // Update state label from visual state
      const labelMap: Record<string, string> = {
        idle: "SYSTEM STANDBY",
        listening: "DEMO INPUT SIMULATION",
        delegating: "DEMO TASK SIMULATION",
        thinking: "DEMO POLICY SIMULATION",
        speaking: "DEMO CAPTION / NO AUDIO",
        executing: "DEMO JOB SIMULATION",
        awaiting_approval: "AWAITING HUMAN APPROVAL",
        error: "SYSTEM ERROR",
        offline: "OFFLINE / DISCONNECTED",
      };
      if (!run && labelMap[event.state]) {
        setStateLabel(labelMap[event.state]);
      }

      // Add to event feed
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
      setEvents((prev) => acceptDemoEvent(prev, newEvent).slice(0, 8));
    });

    return () => {
      unsubState();
      unsubEvent();
    };
  }, [voiceController, run]);

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
    setEvents((prev) => acceptDemoEvent(prev, newEvent).slice(0, 8));
  };

  const openBriefing = () => {
    void startRun("text");
  };

  const openDashboard = () => {
    if (!run) { setCoreState("IDLE"); setStateLabel("DASHBOARD READY"); }
    setSubLabel("DEMO / NO LIVE AGENT EXECUTION");
    setCaption("事業ごとの数値を確認できます。すべて架空のサンプルです。");
    addEventLog("system.dashboard.opened", "Cross-business overview opened.");
    setUiMode("DASHBOARD");
  };

  const openApprovals = () => {
    const isPending = pendingApprovalsCount > 0;
    if (!run) setCoreState(isPending ? "AWAITING_APPROVAL" : "IDLE");
    if (!run) setStateLabel(isPending ? "AWAITING REVIEW" : "REVIEW COMPLETED");
    setSubLabel("DEMO / NO LIVE AGENT EXECUTION");
    setCaption(
      isPending
        ? "模擬注文について承認または否認を試せます。"
        : "模擬処理は履歴へ記録されました。追加の未処理承認はありません。"
    );
    addEventLog("system.approvals.opened", "Approval center opened.");
    setUiMode("APPROVAL_CENTER");
  };

  const handleDecision = async (intentId: string, decision: "approved" | "rejected") => {
    const response = await fetch(`/api/demo/approvals/${encodeURIComponent(intentId)}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision }) }).catch(() => null);
    if (!response?.ok) {
      setSubLabel("DEMO · 承認を拒否しました（期限切れ・重複・対象不一致）");
      return;
    }
    await refreshDemo();
    setCaption("模擬判断を記録しました。実ストアへの発注や課金は行われません。");
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
    utterance.onstart = () => {
      setCoreState("SPEAKING");
       setStateLabel("DEMO BROWSER TTS PLAYING");
    };
    utterance.onend = () => {
      setCoreState(run ? run.operationalState.toUpperCase() as CoreState : "IDLE");
      setStateLabel(run ? `MOCK TASK ${run.status.toUpperCase()}` : "SYSTEM STANDBY");
    };
    utterance.onerror = () => {
      setCoreState(run ? run.operationalState.toUpperCase() as CoreState : "IDLE");
      setStateLabel(run ? `MOCK TASK ${run.status.toUpperCase()}` : "SYSTEM STANDBY");
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
      if (commandTimeout.current) clearTimeout(commandTimeout.current);
      commandTimeout.current = setTimeout(() => {
        setCoreState("IDLE");
        setStateLabel("SYSTEM STANDBY");
      }, 3500);
    }
  };

  // Derive CoreVisualState for 3D viewport
  const coreVisualState: CoreVisualState = toCoreVisualState(coreState);
  const displayStateLabel: string = ({
    "SYSTEM STANDBY": "待機中",
    "AWAITING REVIEW": "配送費の確認が必要です",
    "REVIEW COMPLETED": "模擬判断を記録しました",
    "DASHBOARD READY": "概況を表示中",
    "DEMO INPUT SIMULATION": "音声入力の模擬中",
    "DEMO TASK SIMULATION": "デモタスクを準備中",
    "DEMO POLICY SIMULATION": "デモの照合中",
    "DEMO CAPTION / NO AUDIO": "デモ字幕を表示中",
    "DEMO JOB SIMULATION": "サンプルを照合中",
    "AWAITING HUMAN APPROVAL": "人の確認待ち",
    "SYSTEM ERROR": "確認できません",
    "OFFLINE / DISCONNECTED": "切断中",
    "DEMO COMMAND NOT FOUND": "指示を確認してください",
    "DEMO BROWSER TTS PLAYING": "ブラウザー音声を再生中",
  } as Record<string, string>)[stateLabel] ?? (stateLabel.startsWith("MOCK TASK") ? ({running: "サンプルを照合中", waiting_approval: "配送費の確認が必要です", succeeded: "模擬判断を記録しました", failed: "照合できません"} as Record<TaskRun["status"], string>)[run?.status ?? "running"] : stateLabel);
  const visualMode: CoreEffectMode = selectedEffect === "auto" ? taskPulse || coreVisualState === "executing" ? "surge" : coreVisualState === "delegating" || coreVisualState === "listening" ? "network" : "calm" : selectedEffect;
  const effectiveQuality: GraphicsQuality = quality === "auto" && typeof window !== "undefined" && window.innerWidth < 600 ? "low" : quality === "auto" ? "balanced" : quality;
  const useR3F = effectiveQuality !== "off" && !reducedMotion && !gpuFailed;
  const handleWebGLError = useCallback(() => setGpuFailed(true), []);

  return (
    <div className={`shell${reducedMotion ? " motion-reduced" : ""}`}>
      <Header />

      <main className="main-grid">
        <LeftSidebar connections={systemStatus.connections} events={events} />

        <section className="center-column" aria-label="JARVIS中央コア">
          <div className="top-code-bar">
            <span>今日の状況</span>
            <span>DEMO · 外部操作なし</span>
          </div>

          {/* R3F 3D Core or CSS 2D Fallback */}
          {useR3F ? (
            <Core3DViewport
              operationalState={coreVisualState}
              mode={visualMode}
              quality={effectiveQuality}
              audioLevel={audioLevel}
              reducedMotion={reducedMotion}
              onWebGLError={handleWebGLError}
              forceFailure={forceGpuFailure}
            />
          ) : (
            <Core2DFallback state={coreVisualState} reducedMotion={reducedMotion || effectiveQuality === "off" || gpuFailed} />
          )}

          {/* DOM Status — always visible, never inside Canvas */}
          <div className="core-status-box" aria-live="polite">
            <span className="demo-badge">MOCK · {run?.taskRunId ? `デモタスク ${run.taskRunId.slice(0, 8)}` : "稼働中タスクなし"}</span>
            <strong>{displayStateLabel}</strong>
            <p>{run?.reason ?? subLabel}</p>
          </div>

          {(coreVisualState === "listening" || coreVisualState === "speaking") && <div className="waveform-bar" aria-hidden="true">
            <i /><i /><i /><i /><i /><i /><i /><i />
            <i /><i /><i /><i /><i /><i /><i /><i />
            <i /><i /><i /><i /><i /><i /><i /><i />
          </div>}

          <div className="center-explainer">{caption}</div>

          <div className="button-row" style={{ marginBottom: "10px" }}>
            <button
              className="cyber-btn primary"
              onClick={openBriefing}
              aria-label="朝の業務報告を開く"
            >
              朝の報告
            </button>
            <button
              className="cyber-btn"
              onClick={openDashboard}
              aria-label="実務ダッシュボードを開く"
            >
              事業別の数字
            </button>
            <button
              className={`cyber-btn ${coreState === "AWAITING_APPROVAL" || pendingApprovalsCount > 0 ? "gold" : ""}`}
              onClick={openApprovals}
              aria-label={`承認センターを開く (未処理: ${pendingApprovalsCount}件)`}
            >
              承認待ち{" "}
              <span style={{ fontWeight: "bold" }}>
                {pendingApprovalsCount < 10 ? `0${pendingApprovalsCount}` : pendingApprovalsCount}
              </span>
            </button>
          </div>

          {/* Visual preview and power controls; business state remains in DOM */}
          <div className="graphics-toggle" style={{ textAlign: "center", marginBottom: "8px" }}>
            <label>描画: <select aria-label="Graphics" value={quality} onChange={(event) => setQuality(event.target.value as GraphicsQuality)}><option value="auto">自動</option><option value="balanced">標準</option><option value="low">低負荷</option><option value="off">オフ</option></select></label>
            <label>効果確認: <select aria-label="Effect preview" value={selectedEffect} onChange={(event) => setSelectedEffect(event.target.value as "auto" | CoreEffectMode)}><option value="auto">自動</option><option value="calm">静穏</option><option value="network">連携</option><option value="surge">集中</option></select></label>
            <label>動き: <select aria-label="Motion" value={motion} onChange={(event) => setMotion(event.target.value as "normal" | "reduced")}><option value="normal">通常</option><option value="reduced">抑える</option></select></label>
            {gpuFailed && <span className="demo-badge">2D表示に切替</span>}
            {reducedMotion && (
              <span style={{ fontSize: "0.65rem", color: "var(--amber)", marginLeft: "8px" }}>
                動きを抑えています
              </span>
            )}
          </div>
        </section>

        <RightSidebar
          summary={summary}
          agents={systemStatus.agents}
          modelRequestsCount={systemStatus.model_requests_count}
          pendingApprovalsCount={pendingApprovalsCount}
          onReviewPriorityAction={openApprovals}
        />
      </main>

      {/* Voice Controls — always DOM, never inside Canvas */}
      <VoiceControls
        isMuted={voiceState.isMuted}
        currentSubtitle={voiceState.currentSubtitle}
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

      <CommandBar onCommandSubmit={handleCommand} />

      {uiMode === "BRIEFING" && (
        <BriefingModal
          briefing={generatedBriefing}
          run={run}
          onClose={() => {
            setUiMode("PRESENCE");
            if (!run) { setCoreState("IDLE"); setStateLabel("SYSTEM STANDBY"); }
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
            if (!run) { setCoreState("IDLE"); setStateLabel("SYSTEM STANDBY"); }
          }}
        />
      )}

      {uiMode === "APPROVAL_CENTER" && approvals.length > 0 && (
        <ApprovalModal
          item={approvals[0]}
          onClose={() => {
            setUiMode("PRESENCE");
            if (!run) { setCoreState("IDLE"); setStateLabel("SYSTEM STANDBY"); }
          }}
          onApprove={(id) => handleDecision(id, "approved")}
          onReject={(id) => handleDecision(id, "rejected")}
        />
      )}
    </div>
  );
}
