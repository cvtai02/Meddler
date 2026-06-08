import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM"; // Rachel
const MODEL_ID = "eleven_v3";

export type StabilityV3 = "creative" | "natural" | "robust";

const V3_STABILITY_TO_NUMERIC: Record<StabilityV3, number> = {
  creative: 0.3,
  natural: 0.5,
  robust: 0.8,
};

export type ElevenLabsRequest = {
  text: string;
  voice?: string;
  stability?: StabilityV3;
  similarityBoost?: number;
  style?: number;
};

export type ElevenLabsResult = {
  audio: Buffer;
  contentType: string;
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

function genderFromLabels(labels: Record<string, string> | undefined) {
  const g = labels?.gender?.toLowerCase();
  if (g === "male" || g === "female") return g as "male" | "female";
  return undefined;
}

function languageFromLabels(labels: Record<string, string> | undefined) {
  return labels?.language || labels?.accent;
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}

export async function synthesize(
  apiKey: string,
  req: ElevenLabsRequest,
): Promise<ElevenLabsResult> {
  const eleven = new ElevenLabsClient({ apiKey });
  const voice = req.voice || DEFAULT_VOICE;

  const voiceSettings: Record<string, unknown> = {};
  if (req.stability) {
    voiceSettings.stability = V3_STABILITY_TO_NUMERIC[req.stability];
  }
  if (typeof req.similarityBoost === "number") {
    voiceSettings.similarityBoost = req.similarityBoost;
  }
  if (typeof req.style === "number") voiceSettings.style = req.style;

  const audioStream = await eleven.textToSpeech.convert(voice, {
    text: req.text,
    modelId: MODEL_ID,
    outputFormat: "mp3_44100_128",
    voiceSettings:
      Object.keys(voiceSettings).length > 0 ? voiceSettings : undefined,
  });

  const audio = await streamToBuffer(audioStream);
  return { audio, contentType: "audio/mpeg", voice };
}

export async function listVoices(apiKey: string): Promise<VoiceInfo[]> {
  const eleven = new ElevenLabsClient({ apiKey });
  const { voices } = await eleven.voices.getAll();
  return (voices ?? [])
    .map<VoiceInfo>((v) => ({
      id: v.voiceId,
      name: v.name ?? v.voiceId,
      category: v.category ?? undefined,
      language: languageFromLabels(v.labels),
      gender: genderFromLabels(v.labels),
      description: v.description ?? undefined,
      previewUrl: v.previewUrl ?? undefined,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
