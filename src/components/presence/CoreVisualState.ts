import type { CoreVisualState, TaskRun } from "../../contracts";

/**
 * Visual tone of the central core. Derived only from real demo state:
 * `CoreVisualState` (task/voice events) plus whether the current run was recorded.
 */
export type CoreTone = "standby" | "listening" | "working" | "speaking" | "review" | "recorded" | "error" | "offline";
export type SourceProgress = "pending" | "running" | "done" | "failed";

export interface CoreToneConfig {
  main: string;
  hi: string;
  label: string;
  /** Rotation multiplier; 0 means still. */
  speed: number;
}

export const CORE_TONES: Record<CoreTone, CoreToneConfig> = {
  standby: { main: "#56c8ff", hi: "#b8ecff", label: "待機", speed: 0.35 },
  listening: { main: "#5fe3ff", hi: "#d2f8ff", label: "音声入力（模擬）", speed: 0.8 },
  working: { main: "#a07bff", hi: "#5fe3ff", label: "照合中", speed: 1.6 },
  speaking: { main: "#7fe7ff", hi: "#e2fbff", label: "読み上げ", speed: 0.7 },
  review: { main: "#ffb347", hi: "#ffe1a8", label: "承認待ち", speed: 0.7 },
  recorded: { main: "#3cf0a4", hi: "#c4ffe6", label: "記録済み", speed: 0.3 },
  error: { main: "#ff4d63", hi: "#ffb0ba", label: "エラー", speed: 0.2 },
  offline: { main: "#6c7f99", hi: "#b6c3d4", label: "切断", speed: 0.05 },
};

/** Tones shown in the on-screen legend, in workflow order. */
export const LEGEND_TONES: CoreTone[] = ["standby", "working", "review", "recorded", "error"];

export function toCoreTone(state: CoreVisualState, recorded: boolean): CoreTone {
  switch (state) {
    case "listening": return "listening";
    case "delegating":
    case "thinking":
    case "executing": return "working";
    case "speaking": return "speaking";
    case "awaiting_approval": return "review";
    case "error": return "error";
    case "offline": return "offline";
    default: return recorded ? "recorded" : "standby";
  }
}

const SOURCE_IDS = [["demo_001"], ["demo_002", "demo_004"], ["demo_005"]];

/** Progress of the three fixture lanes (shopify / gmail / calendar), taken from the run's jobs. */
export function toSourceProgress(run: TaskRun | null): SourceProgress[] {
  return SOURCE_IDS.map((ids) => {
    if (!run) return "pending";
    const jobs = run.jobs.filter((job) => ids.includes(job.sourceId));
    if (jobs.some((job) => job.status === "failed")) return "failed";
    if (jobs.length === ids.length) return "done";
    if (run.status === "failed") return "failed";
    return run.status === "running" ? "running" : "pending";
  });
}
