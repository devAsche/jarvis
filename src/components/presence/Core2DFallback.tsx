"use client";

import React from "react";
import { CoreVisualState } from "../../contracts";
import { STATE_VISUAL_CONFIGS } from "./CoreVisualState";
import { ObservatoryField } from "./ObservatoryField";

interface Core2DFallbackProps {
  state: CoreVisualState;
  reducedMotion?: boolean;
}

export function Core2DFallback({ state, reducedMotion = false }: Core2DFallbackProps) {
  const config = STATE_VISUAL_CONFIGS[state] || STATE_VISUAL_CONFIGS.idle;
  return (
    <div
      className={`core-wrap core-fallback ${reducedMotion ? "reduced-motion" : ""}`}
      style={
        {
          "--core-primary": config.primaryColor,
          "--core-glow": config.glowColor,
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <ObservatoryField state={state} />
    </div>
  );
}
