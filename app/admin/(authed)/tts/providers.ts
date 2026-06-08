export type ProviderId = "elevenlabs" | "soniox";

export type ProviderMeta = {
  id: ProviderId;
  label: string;
  /** Underlying model shown on the detail page. */
  model: string;
  /** Short one-liner for the provider card / header. */
  blurb: string;
  /** Where to grab an API key. */
  apiKeyUrl: string;
  /** Monogram shown in the icon tile. */
  initials: string;
  /** CSS background for the icon tile. */
  accent: string;
};

export const PROVIDERS: ProviderMeta[] = [
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

export function providerById(id: string): ProviderMeta | undefined {
  return PROVIDERS.find((p) => p.id === id);
}
