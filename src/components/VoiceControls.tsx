"use client";

import React from "react";
import { HudPanel } from "./HudPanel";

interface VoiceControlsProps {
  isMuted: boolean;
  transcriptHistory: Array<{ role: "user" | "jarvis" | "system"; text: string; time: string }>;
  audioLevel: number;
  providerName: string;
  onToggleMute: () => void;
  onTriggerBriefing: () => void;
  onTriggerApproval: () => void;
  onTriggerError: () => void;
  onTriggerOffline: () => void;
  onInterrupt: () => void;
}

const ROLE: Record<"user" | "jarvis" | "system", string> = { user: "あなた", jarvis: "JARVIS", system: "システム" };

/** Voice mock controls. Subtitles are shown in the stage; this panel holds controls and history. */
export function VoiceControls({ isMuted, transcriptHistory, audioLevel, providerName, onToggleMute, onTriggerBriefing, onTriggerApproval, onTriggerError, onTriggerOffline, onInterrupt }: VoiceControlsProps) {
  return (
    <HudPanel title="音声モック" code={`${providerName} · 課金APIなし`} className="drawer" aria-label="音声モックの操作">
      <div className="level" role="meter" aria-label="デモ入力レベル" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(audioLevel * 100)}><i style={{ width: `${audioLevel * 100}%` }} /></div>
      <div className="row">
        <button className="btn ghost" onClick={onToggleMute} aria-pressed={!isMuted}>{isMuted ? "模擬入力を再開" : "模擬入力をミュート"}</button>
        <button className="btn ghost" onClick={onInterrupt}>発話を中断</button>
      </div>
      <div className="row">
        <span className="muted">シナリオ:</span>
        <button className="chip" onClick={onTriggerBriefing}>朝の報告</button>
        <button className="chip" onClick={onTriggerApproval}>承認の依頼</button>
        <button className="chip" onClick={onTriggerError}>エラー</button>
        <button className="chip" onClick={onTriggerOffline}>切断</button>
      </div>
      <p className="fine">音声の返事では承認しません。承認は画面のボタンだけです。</p>
      <ol className="transcript" aria-label="字幕履歴">
        {transcriptHistory.length === 0 && <li className="muted">字幕履歴はまだありません。</li>}
        {transcriptHistory.slice(-6).map((entry, i) => (
          <li key={i}><time>{entry.time}</time><b>{ROLE[entry.role]}</b><span>{entry.text}</span></li>
        ))}
      </ol>
    </HudPanel>
  );
}
