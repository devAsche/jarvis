import type { VoiceCapabilities, VoiceProvider, VoiceProviderId } from "../VoiceProvider";

export class OpenAIGptLiveAdapter implements VoiceProvider {
  readonly id: VoiceProviderId = "openai_gpt_live";
  readonly name = "OpenAI GPT-Live (gpt-live-1 / Client Delegation)";
  readonly description = "【将来評価候補】全二重双方向会話・発話割り込み・JARVIS CORE委譲対応。現段階は未接続（API課金0円）。";

  capabilities(): VoiceCapabilities {
    return {
      realtimeDuplex: true,
      interruption: true,
      voiceCustomization: false,
      structuredTranscript: true,
    };
  }

  async connect(): Promise<void> {
    throw new Error(
      "OpenAI GPT-Live は現在評価フェーズです。ユーザーによる月次予算承認およびAPIキー設定後に有効化されます（現在API課金0円）。"
    );
  }

  async disconnect(): Promise<void> {}
  async startListening(): Promise<void> {}
  async stopListening(): Promise<void> {}
  async sendTextMessage(): Promise<void> {}
  async interrupt(): Promise<void> {}
  onEvent(): () => void {
    return () => {};
  }
}
