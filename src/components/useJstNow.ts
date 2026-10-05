"use client";

import { useEffect, useState } from "react";

export interface JstNow { year: number; month: number; day: number; weekday: string; time: string }

const parts = (date: Date): JstNow => {
  const get = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", ...opts }).format(date);
  return {
    year: Number(get({ year: "numeric" }).replace(/\D/g, "")),
    month: Number(get({ month: "numeric" }).replace(/\D/g, "")),
    day: Number(get({ day: "numeric" }).replace(/\D/g, "")),
    weekday: get({ weekday: "short" }),
    time: new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(date),
  };
};

/** Tokyo wall clock, client only (null during SSR to avoid hydration mismatch). */
export function useJstNow(): JstNow | null {
  const [now, setNow] = useState<JstNow | null>(null);
  useEffect(() => {
    const tick = () => setNow(parts(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}
