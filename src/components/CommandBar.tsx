"use client";

import React, { useEffect, useRef, useState } from "react";

interface CommandBarProps {
  onCommandSubmit: (cmd: string) => void;
}

export function CommandBar({ onCommandSubmit }: CommandBarProps) {
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (e.key !== "/" || el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    onCommandSubmit(inputVal.trim());
    setInputVal("");
  };

  return (
    <form className="hp cmd" onSubmit={handleSubmit}>
      <span className="p" aria-hidden="true">›</span>
      <label htmlFor="jarvis-command-input" className="sr-only">JARVISへの指示（/ でフォーカス）</label>
      <input
        ref={inputRef}
        id="jarvis-command-input"
        name="command"
        type="text"
        autoComplete="off"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        placeholder="指示を入力 — 朝の報告 / 承認 / 数字"
      />
      <button type="submit" className="btn">送信</button>
    </form>
  );
}
