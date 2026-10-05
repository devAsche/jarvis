import type { VoiceCapabilities, VoiceProvider, VoiceProviderId } from "../VoiceProvider";
import type { UIEvent, CoreVisualState } from "../../../contracts";

export class MockVoiceAdapter implements VoiceProvider {
  readonly id: VoiceProviderId = "mock";
  readonly name = "Mock Voice Engine (Zero-Cost / Offline)";
  readonly description = "API課金ゼロのローカルシミュレーションアダプター。状態遷移と字幕・E2Eテストを完全検証。";

  private eventListeners: Set<(event: UIEvent) => void> = new Set();
  private isConnected = false;
  private isListening = false;
  private currentTimer: NodeJS.Timeout | null = null;
  private scenarioSteps: Array<{
    delayMs: number;
    state: CoreVisualState;
    message: string;
    audioLevel?: number;
    taskId?: string;
  }> = [];
  private stepIndex = 0;
  private sequence = 0;
  private sessionId = "mock-session-0";

  private nextId(): string {
    return `mock-${++this.sequence}`;
  }

  capabilities(): VoiceCapabilities {
    return {
      realtimeDuplex: false,
      interruption: true,
      voiceCustomization: false,
      structuredTranscript: true,
    };
  }

  async connect(): Promise<void> {
    this.isConnected = true;
    this.emitEvent({
      eventId: this.nextId(),
      occurredAt: new Date().toISOString(),
      source: "mock",
      state: "idle",
      demo: true,
      message: "音声モックアダプター準備完了（実マイク・API未接続）",
    });
  }

  async disconnect(): Promise<void> {
    await this.interrupt();
    this.isConnected = false;
    this.isListening = false;
    this.emitEvent({
      eventId: this.nextId(),
      occurredAt: new Date().toISOString(),
      source: "mock",
      state: "offline",
      demo: true,
      message: "音声モックアダプター切断",
    });
  }

  async startListening(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
    this.isListening = true;
    this.emitEvent({
      eventId: this.nextId(),
      occurredAt: new Date().toISOString(),
      source: "mock",
      state: "listening",
      demo: true,
      audioLevel: 0.65,
      message: "音声入力検知中（シミュレーション）...",
    });
  }

  async stopListening(): Promise<void> {
    this.isListening = false;
    this.emitEvent({
      eventId: this.nextId(),
      occurredAt: new Date().toISOString(),
      source: "mock",
      state: "idle",
      demo: true,
      audioLevel: 0,
      message: "マイク待機状態",
    });
  }

  async sendTextMessage(text: string): Promise<void> {
    this.emitEvent({
      eventId: this.nextId(),
      occurredAt: new Date().toISOString(),
      source: "mock",
      state: "idle",
      demo: true,
      message: `DEMO テキスト入力を受け付けました: "${text}"（業務処理なし）`,
    });
  }

  async interrupt(): Promise<void> {
    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }
    this.scenarioSteps = [];
    this.stepIndex = 0;
    this.emitEvent({
      eventId: this.nextId(),
      occurredAt: new Date().toISOString(),
      source: "mock",
      state: "idle",
      demo: true,
      audioLevel: 0,
      message: "発話割り込み（Barge-in）検知。音声を安全に中断しました。",
    });
  }

  onEvent(handler: (event: UIEvent) => void): () => void {
    this.eventListeners.add(handler);
    return () => {
      this.eventListeners.delete(handler);
    };
  }

  /**
   * シナリオ1: 朝ブリーフィング要約対話
   */
  startMorningBriefingScenario(): void {
    this.interrupt();
    if (!this.isConnected) void this.connect();
    this.sessionId = this.nextId();
    this.scenarioSteps = [
      {
        delayMs: 300,
        state: "listening",
        message: "ユーザー:「ジャーヴィス、本日の朝ブリーフを要約して」",
        audioLevel: 0.7,
      },
      {
        delayMs: 1400,
        state: "delegating",
        message: "DEMO: サンプルのEC・予定・制作データを照合中（実サービス未接続）",
        taskId: "task_brief_001",
      },
      {
        delayMs: 1500,
        state: "speaking",
        message: "DEMO字幕: サンプル注文の送料確認が1件、サンプルMIX依頼が2件あります（音声再生なし）。",
        audioLevel: 0,
        taskId: "task_brief_001",
      },
      {
        delayMs: 2500,
        state: "speaking",
        message: "DEMO字幕: 詳細は朝ブリーフで確認できます（音声再生なし）。",
        audioLevel: 0,
      },
      {
        delayMs: 1200,
        state: "idle",
        message: "待機状態に復帰しました。",
        audioLevel: 0,
      },
    ];
    this.stepIndex = 0;
    this.executeNextStep();
  }

  /**
   * シナリオ2: 実行要求と高リスク承認案内（音声承認禁止の証明）
   */
  startApprovalScenario(): void {
    this.interrupt();
    if (!this.isConnected) void this.connect();
    this.sessionId = this.nextId();
    this.scenarioSteps = [
      {
        delayMs: 300,
        state: "listening",
        message: "ユーザー:「送料異常の件、今すぐ発注を実行して」",
        audioLevel: 0.8,
      },
      {
        delayMs: 1200,
        state: "thinking",
        message: "DEMO: サンプル承認ルールを照合中（実発注なし）",
        taskId: "policy_gate_check",
      },
      {
        delayMs: 1400,
        state: "executing",
        message: "DEMO: 既存の模擬承認カードを表示準備中（実ジョブなし）",
        taskId: "job_draft_create",
      },
      {
        delayMs: 1500,
        state: "awaiting_approval",
        message: "DEMO字幕: 声だけでは承認できません。画面の模擬承認カードで確認してください。",
        audioLevel: 0,
      },
    ];
    this.stepIndex = 0;
    this.executeNextStep();
  }

  /**
   * シナリオ3: エラー発生と安全側停止
   */
  startErrorScenario(): void {
    this.interrupt();
    if (!this.isConnected) void this.connect();
    this.sessionId = this.nextId();
    this.scenarioSteps = [
      {
        delayMs: 400,
        state: "listening",
        message: "ユーザー:「外部プロバイダーの同期を実行」",
        audioLevel: 0.6,
      },
      {
        delayMs: 1000,
        state: "error",
        message: "DEMO: 通信タイムアウトを模擬しました。実通信は行っていません。",
        audioLevel: 0,
      },
    ];
    this.stepIndex = 0;
    this.executeNextStep();
  }

  private executeNextStep(): void {
    if (this.stepIndex >= this.scenarioSteps.length) {
      this.scenarioSteps = [];
      this.stepIndex = 0;
      return;
    }

    const step = this.scenarioSteps[this.stepIndex];
    this.stepIndex++;

    this.currentTimer = setTimeout(() => {
      this.emitEvent({
        eventId: this.nextId(),
        occurredAt: new Date().toISOString(),
        source: "mock",
        sessionId: this.sessionId,
        state: step.state,
        demo: true,
        audioLevel: step.audioLevel ?? 0,
        taskId: step.taskId,
        message: step.message,
      });

      this.executeNextStep();
    }, step.delayMs);
  }

  private emitEvent(event: UIEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error("MockVoiceAdapter listener error:", err);
      }
    }
  }
}
