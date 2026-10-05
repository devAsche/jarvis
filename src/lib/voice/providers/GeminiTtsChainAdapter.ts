import type { VoiceCapabilities, VoiceProvider, VoiceProviderId } from "../VoiceProvider";

export class GeminiTtsChainAdapter implements VoiceProvider {
  readonly id: VoiceProviderId = "gemini_tts_chain";
  readonly name = "Google Gemini 3.8 Flash TTS (gemini-3.8-flash-tts)";
  readonly description = "【将来評価候補】朝ブリーフ・通知の高品質台本読み上げ専用。単独でのリアルタイム会話は非対応。現段階は未接続（API課金0円）。";

  capabilities(): VoiceCapabilities {
    return {
      realtimeDuplex: false,
      interruption: false,
      voiceCustomization: true,
      structuredTranscript: false,
    };
  }

  async connect(): Promise<void> {
    throw new Error(
      "Gemini 3.8 Flash TTS は評価フェーズです。朝ブリーフ読み上げ用途として、予算承認後に有効化されます（現在API課金0円）。"
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
