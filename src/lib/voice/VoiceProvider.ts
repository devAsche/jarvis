import type { UIEvent } from "../../contracts";

export interface VoiceCapabilities {
  realtimeDuplex: boolean;
  interruption: boolean;
  voiceCustomization: boolean;
  structuredTranscript: boolean;
}

export type VoiceProviderId =
  | "mock"
  | "openai_gpt_live"
  | "gemini_live"
  | "gemini_tts_chain";

export interface VoiceProvider {
  readonly id: VoiceProviderId;
  readonly name: string;
  readonly description: string;
  capabilities(): VoiceCapabilities;
  connect(options: { demo: boolean }): Promise<void>;
  disconnect(): Promise<void>;
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  sendTextMessage(text: string): Promise<void>;
  interrupt(): Promise<void>;
  onEvent(handler: (event: UIEvent) => void): () => void;
}
