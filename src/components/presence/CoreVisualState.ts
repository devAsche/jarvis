import { CoreVisualState } from "../../contracts";

export interface CoreVisualConfig {
  primaryColor: string;
  glowColor: string;
  rotationSpeed: number;
  pulseSpeed: number;
  particleSpeed: number;
  particleCount: number;
  label: string;
  subLabel: string;
}

export const STATE_VISUAL_CONFIGS: Record<CoreVisualState, CoreVisualConfig> = {
  idle: {
    primaryColor: "#52D8FF",
    glowColor: "#5174FF",
    rotationSpeed: 0.3,
    pulseSpeed: 1.0,
    particleSpeed: 0.2,
    particleCount: 120,
    label: "SYSTEM STANDBY",
    subLabel: "待機中 · 最小GPU負荷 · 安全側停止",
  },
  listening: {
    primaryColor: "#52D8FF",
    glowColor: "#81FFE1",
    rotationSpeed: 0.6,
    pulseSpeed: 2.5,
    particleSpeed: 0.8,
    particleCount: 150,
    label: "VOICE LISTENING",
    subLabel: "音声入力検知中（シミュレーション） · 音声OFF可能",
  },
  delegating: {
    primaryColor: "#7E82FF",
    glowColor: "#5174FF",
    rotationSpeed: 1.2,
    pulseSpeed: 3.0,
    particleSpeed: 1.0,
    particleCount: 160,
    label: "CLIENT DELEGATING",
    subLabel: "JARVIS CORE連携中 · 外部オーケストレーション",
  },
  thinking: {
    primaryColor: "#7E82FF",
    glowColor: "#52D8FF",
    rotationSpeed: 1.0,
    pulseSpeed: 2.0,
    particleSpeed: 0.7,
    particleCount: 140,
    label: "AGENT PROCESSING",
    subLabel: "決定論的ポリシー評価中 · 偽の推論表示なし",
  },
  speaking: {
    primaryColor: "#81FFE1",
    glowColor: "#52D8FF",
    rotationSpeed: 0.8,
    pulseSpeed: 2.2,
    particleSpeed: 0.6,
    particleCount: 130,
    label: "AUDIO OUT / TTS",
    subLabel: "音声合成出力中 · 全文は字幕DOMにて閲覧可能",
  },
  executing: {
    primaryColor: "#52D8FF",
    glowColor: "#5174FF",
    rotationSpeed: 1.5,
    pulseSpeed: 2.8,
    particleSpeed: 1.2,
    particleCount: 180,
    label: "TASK EXECUTING",
    subLabel: "ジョブ実行中（モック） · 完了の推測表示なし",
  },
  awaiting_approval: {
    primaryColor: "#FFBE76",
    glowColor: "#FF8C00",
    rotationSpeed: 0.4,
    pulseSpeed: 1.5,
    particleSpeed: 0.3,
    particleCount: 110,
    label: "AWAITING HUMAN APPROVAL",
    subLabel: "人間の個別確認待ち · 音声単独での承認不可",
  },
  error: {
    primaryColor: "#FF5555",
    glowColor: "#AA2222",
    rotationSpeed: 0.2,
    pulseSpeed: 0.8,
    particleSpeed: 0.1,
    particleCount: 80,
    label: "SYSTEM ERROR",
    subLabel: "安全側に停止中 · 診断ログをUIに表示",
  },
  offline: {
    primaryColor: "#5A6D8C",
    glowColor: "#2A364F",
    rotationSpeed: 0.05,
    pulseSpeed: 0.2,
    particleSpeed: 0.05,
    particleCount: 40,
    label: "OFFLINE / DISCONNECTED",
    subLabel: "全通信遮断 · ローカルキャッシュのみ参照可能",
  },
};
