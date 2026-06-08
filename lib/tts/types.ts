export type StabilityV3 = "creative" | "natural" | "robust";

export type TtsRequest = {
  text: string;
  voice?: string;
  /** ElevenLabs v3 stability mode. Ignored by other providers. */
  stability?: StabilityV3;
  /** ElevenLabs similarity_boost / style sliders (0..1). */
  similarityBoost?: number;
  style?: number;
  /** Microsoft speaking style (e.g. "cheerful"). */
  msStyle?: string;
};

export type TtsResult = {
  audio: Buffer;
  contentType: string;
  provider: string;
  voice: string;
};

export type VoiceInfo = {
  id: string;
  name: string;
  language?: string;
  gender?: "male" | "female" | "neutral";
  category?: string;
  description?: string;
  previewUrl?: string;
};

export interface TtsProvider {
  name: string;
  synthesize(req: TtsRequest): Promise<TtsResult>;
  listVoices(): Promise<VoiceInfo[]>;
}
