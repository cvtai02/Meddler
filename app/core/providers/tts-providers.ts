export const TTS_PROVIDERS = ["elevenlabs", "soniox"] as const;

export type TtsProviderId = (typeof TTS_PROVIDERS)[number];

export function isTtsProviderId(value: string): value is TtsProviderId {
  return (TTS_PROVIDERS as readonly string[]).includes(value);
}

export type TtsProviderMeta = {
  id: TtsProviderId;
  label: string;
  model: string;
  blurb: string;
  apiKeyUrl: string;
  initials: string;
  accent: string;
};

export const TTS_PROVIDER_META: TtsProviderMeta[] = [
  {
    id: "elevenlabs",
    label: "ElevenLabs",
    model: "Eleven v3",
    blurb: "Expressive speech with audio-tag direction.",
    apiKeyUrl: "https://elevenlabs.io/app/settings/api-keys",
    initials: "11",
    accent: "linear-gradient(135deg, #3a4060, #232a45)",
  },
  {
    id: "soniox",
    label: "Soniox",
    model: "tts-rt-v1",
    blurb: "Real-time multilingual text-to-speech.",
    apiKeyUrl: "https://console.soniox.com/",
    initials: "So",
    accent: "linear-gradient(135deg, #7c8cff, #5b6cff)",
  },
];

export function providerById(id: string): TtsProviderMeta | undefined {
  return TTS_PROVIDER_META.find((p) => p.id === id);
}
