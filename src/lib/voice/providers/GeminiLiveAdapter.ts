import type { VoiceCapabilities, VoiceProvider, VoiceProviderId } from "../VoiceProvider.ts";

export class GeminiLiveAdapter implements VoiceProvider {
  readonly id: VoiceProviderId = "gemini_live";
  readonly name = "Google Gemini 3.8 Live (gemini-3.8-live)";
  readonly description = "【将来比較候補】リアルタイム音声対話の競合比較用。現段階は未接続（API課金0円）。";

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
      "Gemini 3.8 Live は評価比較フェーズです。予算承認後に有効化されます（現在API課金0円）。"
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
