"use client";

import React from "react";
import type { GraphicsQuality } from "../contracts";
import { HudPanel } from "./HudPanel";

interface DisplaySettingsProps {
  quality: GraphicsQuality;
  motion: "normal" | "reduced";
  systemReduced: boolean;
  gpuFailed: boolean;
  onQuality: (q: GraphicsQuality) => void;
  onMotion: (m: "normal" | "reduced") => void;
}

export function DisplaySettings({ quality, motion, systemReduced, gpuFailed, onQuality, onMotion }: DisplaySettingsProps) {
  return (
    <HudPanel title="表示設定" code="中央コアのみに影響" className="drawer" aria-label="表示設定">
      <div className="row">
        <label htmlFor="gfx-quality">描画</label>
        <select id="gfx-quality" value={quality} onChange={(e) => onQuality(e.target.value as GraphicsQuality)}>
          <option value="auto">自動</option><option value="balanced">標準</option><option value="low">低負荷</option><option value="off">オフ（2D）</option>
        </select>
        <label htmlFor="gfx-motion">動き</label>
        <select id="gfx-motion" value={motion} onChange={(e) => onMotion(e.target.value as "normal" | "reduced")}>
          <option value="normal">通常</option><option value="reduced">抑える</option>
        </select>
      </div>
      {(gpuFailed || systemReduced) && <p className="fine">{gpuFailed ? "3D描画に失敗したため2D表示に切り替えました。" : "OSの設定に合わせて動きを抑えています。"}</p>}
    </HudPanel>
  );
}
