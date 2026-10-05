import type { VoiceProvider, VoiceProviderId } from "./VoiceProvider.ts";
import { MockVoiceAdapter } from "./providers/MockVoiceAdapter.ts";
import { OpenAIGptLiveAdapter } from "./providers/OpenAIGptLiveAdapter.ts";
import { GeminiTtsChainAdapter } from "./providers/GeminiTtsChainAdapter.ts";
import { GeminiLiveAdapter } from "./providers/GeminiLiveAdapter.ts";
import { UIEventSchema, type UIEvent } from "../../contracts/index.ts";

export interface VoiceSessionState {
  providerId: VoiceProviderId;
  providerName: string;
  isMuted: boolean;
  isListening: boolean;
  currentSubtitle: string;
  transcriptHistory: Array<{ role: "user" | "jarvis" | "system"; text: string; time: string }>;
  audioLevel: number;
}

export class VoiceSessionController {
  private providers: Map<VoiceProviderId, VoiceProvider> = new Map();
  private activeProvider: VoiceProvider;
  private stateListeners: Set<(state: VoiceSessionState) => void> = new Set();
  private eventListeners: Set<(event: UIEvent) => void> = new Set();
  private cleanupActiveEvent: (() => void) | null = null;
  private seenEventIds = new Set<string>();
  private lastEventTime = 0;

  private state: VoiceSessionState;

  constructor() {
    const mock = new MockVoiceAdapter();
    const gptLive = new OpenAIGptLiveAdapter();
    const geminiTts = new GeminiTtsChainAdapter();
    const geminiLive = new GeminiLiveAdapter();

    this.providers.set(mock.id, mock);
    this.providers.set(gptLive.id, gptLive);
    this.providers.set(geminiTts.id, geminiTts);
    this.providers.set(geminiLive.id, geminiLive);

    this.activeProvider = mock;

    this.state = {
      providerId: mock.id,
      providerName: mock.name,
      isMuted: false,
      isListening: false,
      currentSubtitle: "音声システム待機中（モックモード / 課金0円）",
      transcriptHistory: [],
      audioLevel: 0,
    };

    this.bindProvider(this.activeProvider);
  }

  getProviders(): Array<{ id: VoiceProviderId; name: string; description: string; active: boolean }> {
    return Array.from(this.providers.values()).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      active: p.id === this.activeProvider.id,
    }));
  }

  getCurrentState(): VoiceSessionState {
    return { ...this.state, transcriptHistory: [...this.state.transcriptHistory] };
  }

  async selectProvider(id: VoiceProviderId): Promise<void> {
    const target = this.providers.get(id);
    if (!target) return;

    if (id !== "mock") {
      this.emitSystemMessage("実プロバイダーは未接続です。評価と月次予算の承認までモックのみ利用できます。");
      return;
    }

    if (this.cleanupActiveEvent) {
      this.cleanupActiveEvent();
    }

    this.activeProvider = target;
    this.bindProvider(target);

    this.state.providerId = target.id;
    this.state.providerName = target.name;
    this.state.currentSubtitle = `プロバイダー変更: ${target.name}`;
    this.notifyState();
  }

  async toggleMute(): Promise<boolean> {
    this.state.isMuted = !this.state.isMuted;
    if (this.state.isMuted) {
      await this.activeProvider.stopListening();
      this.state.isListening = false;
      this.state.audioLevel = 0;
      this.state.currentSubtitle = "マイクはミュートされています。";
    } else {
      this.state.currentSubtitle = "マイクが有効になりました。";
    }
    this.notifyState();
    return this.state.isMuted;
  }

  async triggerMorningBriefing(): Promise<void> {
    if (this.activeProvider instanceof MockVoiceAdapter) {
      this.activeProvider.startMorningBriefingScenario();
    }
  }

  async triggerApprovalRequest(): Promise<void> {
    if (this.activeProvider instanceof MockVoiceAdapter) {
      this.activeProvider.startApprovalScenario();
    }
  }

  async triggerErrorScenario(): Promise<void> {
    if (this.activeProvider instanceof MockVoiceAdapter) {
      this.activeProvider.startErrorScenario();
    }
  }

  async triggerOffline(): Promise<void> {
    if (this.activeProvider instanceof MockVoiceAdapter) await this.activeProvider.disconnect();
  }

  async interrupt(): Promise<void> {
    await this.activeProvider.interrupt();
    this.state.currentSubtitle = "割り込み（Barge-in）により発話を中断しました。";
    this.state.audioLevel = 0;
    this.notifyState();
  }

  onStateChange(listener: (state: VoiceSessionState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.getCurrentState());
    return () => this.stateListeners.delete(listener);
  }

  onUIEvent(listener: (event: UIEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  private bindProvider(provider: VoiceProvider): void {
    this.cleanupActiveEvent = provider.onEvent((rawEvent: UIEvent) => {
      const parsed = UIEventSchema.safeParse(rawEvent);
      if (!parsed.success) return;
      const event = parsed.data;
      const eventTime = Date.parse(event.occurredAt);
      if (this.seenEventIds.has(event.eventId) || eventTime < this.lastEventTime) return;
      this.seenEventIds.add(event.eventId);
      if (this.seenEventIds.size > 256) this.seenEventIds.delete(this.seenEventIds.values().next().value!);
      this.lastEventTime = eventTime;
      if (this.state.isMuted && event.state === "listening") {
        return; // Ignore listening when muted
      }

      this.state.audioLevel = event.audioLevel ?? 0;
      this.state.isListening = event.state === "listening";
      if (event.message) {
        this.state.currentSubtitle = event.message;
        const role = event.state === "listening" ? "user" : "jarvis";
        this.state.transcriptHistory.unshift({
          role,
          text: event.message,
          time: new Date().toLocaleTimeString("ja-JP"),
        });
        if (this.state.transcriptHistory.length > 20) {
          this.state.transcriptHistory.pop();
        }
      }

      this.notifyState();

      // Forward to UI event subscribers
      for (const listener of this.eventListeners) {
        listener(event);
      }
    });
  }

  private emitSystemMessage(message: string): void {
    this.state.currentSubtitle = message;
    this.notifyState();
  }

  private notifyState(): void {
    const snapshot = this.getCurrentState();
    for (const listener of this.stateListeners) {
      listener(snapshot);
    }
  }

  async dispose(): Promise<void> {
    this.cleanupActiveEvent?.();
    this.cleanupActiveEvent = null;
    this.stateListeners.clear();
    this.eventListeners.clear();
    await this.activeProvider.disconnect();
  }
}
