"use client";

import React, { useState } from "react";
import { HudPanel } from "./HudPanel";

/** Owner login for READ_ONLY mode. The password is checked server-side; nothing is stored in the browser. */
export function LoginScreen({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) }).catch(() => null);
    setBusy(false);
    setPassword("");
    if (res?.ok) onLoggedIn();
    else setError(res?.status === 429 ? "試行回数が多すぎます。15分ほど待ってから試してください。" : res ? "パスワードが違います。" : "サーバーに接続できません。");
  };
  return (
    <div className="login-wrap">
      <HudPanel title="JARVIS · オーナー認証" code="READ ONLY" className="login">
        <p className="muted">実データ（読み取り専用）を表示するにはログインしてください。</p>
        <form onSubmit={submit} className="login-form">
          <label htmlFor="owner-password">パスワード</label>
          <input id="owner-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
          <button className="btn" type="submit" disabled={busy}>{busy ? "確認中…" : "ログイン"}</button>
        </form>
        {error && <p className="login-error" role="alert">{error}</p>}
      </HudPanel>
    </div>
  );
}
