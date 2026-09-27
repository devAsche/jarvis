"use client";

import React, { useState } from "react";

interface CommandBarProps {
  onCommandSubmit: (cmd: string) => void;
}

export function CommandBar({ onCommandSubmit }: CommandBarProps) {
  const [inputVal, setInputVal] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    onCommandSubmit(inputVal.trim());
    setInputVal("");
  };

  return (
    <footer className="bottom-footer" role="contentinfo">
      <div className="footer-label">
        <span className="glowing-dot" />
        COMMAND CHANNEL
      </div>

      <form className="command-container" onSubmit={handleSubmit}>
        <label htmlFor="jarvis-command-input" className="sr-only">
          JARVISへの指示
        </label>
        <input
          id="jarvis-command-input"
          name="command"
          type="text"
          autoComplete="off"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="例：朝の報告 / 注文 / ダッシュボード / 承認 / ステータス"
        />
        <button type="submit" className="cyber-btn primary">
          SEND ↗
        </button>
      </form>

      <span className="system-foot-note">ALL EXTERNAL EFFECTS LOCKED</span>
    </footer>
  );
}
