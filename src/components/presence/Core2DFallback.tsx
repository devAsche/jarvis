"use client";

import React from "react";
import { CORE_TONES, type CoreTone, type SourceProgress } from "./CoreVisualState";

interface Core2DFallbackProps {
  tone: CoreTone;
  sources: SourceProgress[];
}

const C = 100;
const arcPath = (r: number, a0: number, a1: number) => {
  const p = (a: number) => `${(C + Math.cos(a) * r).toFixed(2)} ${(C - Math.sin(a) * r).toFixed(2)}`;
  return `M ${p(a0)} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 0 ${p(a1)}`;
};
const SPAN = (Math.PI * 2) / 3 - 0.16;

/** Static SVG core for graphics off, WebGL failure and reduced motion. Same tones as the 3D core. */
export function Core2DFallback({ tone, sources }: Core2DFallbackProps) {
  const cfg = CORE_TONES[tone];
  return (
    <div className="core-canvas core-fallback" style={{ "--tone": cfg.main, "--tone-hi": cfg.hi } as React.CSSProperties} aria-hidden="true">
      <svg viewBox="0 0 200 200">
        <circle cx={C} cy={C} r="92" fill="none" stroke="var(--line)" strokeWidth="1" />
        <circle cx={C} cy={C} r="88" fill="none" stroke="var(--glow)" strokeWidth="5" strokeDasharray="1 3.6" opacity=".55" />
        <circle cx={C} cy={C} r="78" fill="none" stroke="var(--tone)" strokeWidth="3.5" strokeDasharray="44 14 10 14" />
        {sources.map((s, i) => {
          const a1 = Math.PI / 2 - i * ((Math.PI * 2) / 3) - 0.08;
          const a0 = a1 - SPAN;
          return (
            <g key={i}>
              <path d={arcPath(66, a0, a1)} fill="none" stroke="var(--line-soft)" strokeWidth="6" />
              {s !== "pending" && <path d={arcPath(66, s === "running" ? a1 - SPAN * 0.62 : a0, a1)} fill="none" stroke={s === "failed" ? CORE_TONES.error.main : "var(--tone)"} strokeWidth="6" />}
            </g>
          );
        })}
        <circle cx={C} cy={C} r="52" fill="none" stroke="var(--line)" strokeWidth="1" />
        <circle cx={C} cy={C} r="40" fill="none" stroke="var(--tone)" strokeWidth="11" strokeDasharray="15.5 5.4" opacity=".7" />
        <circle cx={C} cy={C} r="20" fill="var(--tone)" opacity=".45" />
        <circle cx={C} cy={C} r="10" fill="var(--tone-hi)" />
      </svg>
    </div>
  );
}
