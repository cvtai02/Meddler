import { elevenLabs } from "./elevenlabs";
import { microsoftTts } from "./microsoft";
import type { TtsProvider, TtsRequest, TtsResult, VoiceInfo } from "./types";

const REGISTRY: Record<string, TtsProvider> = {
  elevenlabs: elevenLabs,
  microsoft: microsoftTts,
};

export const TTS_PROVIDERS = Object.keys(REGISTRY);

export function getTtsProvider(name: string): TtsProvider {
  const p = REGISTRY[name];
  if (!p) throw new Error(`Unknown TTS provider: ${name}`);
  return p;
}

export async function synthesize(
  provider: string,
  req: TtsRequest,
): Promise<TtsResult> {
  return getTtsProvider(provider).synthesize(req);
}

export async function listVoices(provider: string): Promise<VoiceInfo[]> {
  return getTtsProvider(provider).listVoices();
}

export type { TtsProvider, TtsRequest, TtsResult, VoiceInfo };
