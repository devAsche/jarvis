"use client";

import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import type { GraphicsQuality } from "../../contracts";
import type { CoreTone, SourceProgress } from "./CoreVisualState";
import { CoreScene } from "./CoreScene";
import { Core2DFallback } from "./Core2DFallback";

interface Core3DViewportProps {
  tone: CoreTone;
  sources: SourceProgress[];
  quality: GraphicsQuality;
  audioLevel?: number;
  reducedMotion?: boolean;
  onWebGLError?: (error: Error) => void;
  forceFailure?: boolean;
}

class CanvasErrorBoundary extends React.Component<{ onError: () => void; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function Core3DViewport({
  tone,
  sources,
  quality,
  audioLevel = 0,
  reducedMotion = false,
  onWebGLError,
  forceFailure = false,
}: Core3DViewportProps) {
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);
  const [renderError, setRenderError] = useState<boolean>(false);
  const [visible, setVisible] = useState(true);
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    update();
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    const canvas = canvasElement;
    if (!canvas) return;
    const lost = (event: Event) => { event.preventDefault(); setRenderError(true); onWebGLError?.(new Error("WebGL context lost")); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [canvasElement, onWebGLError]);

  // Client-side WebGL capability check
  useEffect(() => {
    if (forceFailure) { setHasWebGL(false); onWebGLError?.(new Error("Forced WebGL failure for local QA")); return; }
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      setHasWebGL(Boolean(gl));
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      if (!gl) onWebGLError?.(new Error("WebGL unavailable"));
    } catch (e) {
      setHasWebGL(false);
      if (onWebGLError && e instanceof Error) {
        onWebGLError(e);
      }
    }
  }, [forceFailure, onWebGLError]);

  // If WebGL is unavailable or user requested reduced motion or render error occurred -> Fallback
  if (hasWebGL === false || renderError || reducedMotion) {
    return <Core2DFallback tone={tone} sources={sources} />;
  }

  // Initial SSR / hydration placeholder
  if (hasWebGL === null) {
    return <Core2DFallback tone={tone} sources={sources} />;
  }

  return (
    <div
      className={`core-canvas${visible ? "" : " core-paused"}`}
      aria-hidden="true"
    >
      <CanvasErrorBoundary onError={() => { setRenderError(true); onWebGLError?.(new Error("Canvas render failed")); }}>
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 45 }}
        dpr={quality === "low" ? 1 : [1, 1.5]}
        frameloop={visible ? "always" : "demand"}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "low-power",
        }}
        onCreated={({ gl }) => { setCanvasElement(gl.domElement); }}
      >
        <CoreScene tone={tone} sources={sources} quality={quality} audioLevel={audioLevel} reducedMotion={reducedMotion} />
      </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
