"use client";

import React, { useState } from "react";

interface VoiceControlsProps {
  isMuted: boolean;
  currentSubtitle: string;
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

export function VoiceControls({
  isMuted,
  currentSubtitle,
  transcriptHistory,
  audioLevel,
  providerName,
  onToggleMute,
  onTriggerBriefing,
  onTriggerApproval,
  onTriggerError,
  onTriggerOffline,
  onInterrupt,
}: VoiceControlsProps) {
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <div className="voice-controls" role="region" aria-label="音声制御パネル">
      {/* Subtitle display - always accessible DOM */}
      <div className="voice-subtitle" aria-live="polite" aria-atomic="true">
        <span className="subtitle-indicator">💬</span>
        <span className="subtitle-text">{currentSubtitle}</span>
      </div>

      {/* Audio level indicator */}
      <div className="voice-level-bar" aria-label={`デモ入力レベル: ${Math.round(audioLevel * 100)}%`}>
        <div
          className="voice-level-fill"
          style={{ width: `${audioLevel * 100}%` }}
        />
      </div>

      {/* Controls row */}
      <div className="voice-buttons">
        <button
          className={`cyber-btn voice-btn ${isMuted ? "muted" : "active"}`}
          onClick={onToggleMute}
          aria-label={isMuted ? "模擬入力を有効にする" : "模擬入力をミュートする"}
          title={isMuted ? "UNMUTE" : "MUTE"}
        >
          {isMuted ? "🔇 模擬入力を停止中" : "🎙 音声入力の模擬"}
        </button>

        <button
          className="cyber-btn voice-btn"
          onClick={onInterrupt}
          aria-label="発話を中断する（Barge-in）"
          title="INTERRUPT"
        >
          ⏹ 中断
        </button>

        <button
          className="cyber-btn voice-btn"
          onClick={() => setShowTranscript(!showTranscript)}
          aria-label="字幕履歴の表示/非表示"
          aria-expanded={showTranscript}
        >
          📝 {showTranscript ? "字幕履歴を閉じる" : "字幕履歴を見る"}
        </button>
      </div>

      {/* Demo scenario triggers */}
      <div className="voice-scenario-row">
        <span className="scenario-label">音声モックの例:</span>
        <button className="cyber-btn mini" onClick={onTriggerBriefing}>
          🌅 朝ブリーフ
        </button>
        <button className="cyber-btn mini gold" onClick={onTriggerApproval}>
          🔐 承認要求
        </button>
        <button className="cyber-btn mini" onClick={onTriggerError}>
          ⚠ エラー
        </button>
        <button className="cyber-btn mini" onClick={onTriggerOffline}>
          ◌ 切断
        </button>
      </div>

      {/* Provider info */}
      <div className="voice-provider-info">
        <span className="provider-tag">音声方式</span>
        <span className="provider-name">{providerName}</span>
        <span className="demo-badge">DEMO · 外部課金APIなし</span>
      </div>

      {/* Transcript panel (accessible, always available via button) */}
      {showTranscript && (
        <div className="voice-transcript" role="log" aria-label="会話字幕履歴">
          {transcriptHistory.length === 0 && (
            <p className="transcript-empty">字幕履歴はまだありません。デモシナリオを開始してください。</p>
          )}
          {transcriptHistory.map((entry, i) => (
            <div key={i} className={`transcript-entry transcript-${entry.role}`}>
              <span className="transcript-time">{entry.time}</span>
              <span className="transcript-role">
                {entry.role === "user" ? "👤" : entry.role === "jarvis" ? "🤖" : "⚙"}
              </span>
              <span className="transcript-text">{entry.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
