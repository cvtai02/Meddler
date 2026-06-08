import { SonioxNodeClient } from "@soniox/node";

const DEFAULT_MODEL = "tts-rt-v1";
const DEFAULT_LANGUAGE = "en";
const DEFAULT_VOICE = "Adrian";

export type SonioxRequest = {
  text: string;
  voice?: string;
  language?: string;
  model?: string;
};

export type SonioxResult = {
  audio: Buffer;
  contentType: string;
  voice: string;
};

export type SonioxVoice = {
  id: string;
  name: string;
  language?: string;
  gender?: "male" | "female" | "neutral";
  description?: string;
};

function client(apiKey: string) {
  return new SonioxNodeClient({ api_key: apiKey });
}

export async function synthesize(
  apiKey: string,
  req: SonioxRequest,
): Promise<SonioxResult> {
  const voice = req.voice || DEFAULT_VOICE;
  const audio = await client(apiKey).tts.generate({
    text: req.text,
    voice,
    language: req.language || DEFAULT_LANGUAGE,
    model: req.model || DEFAULT_MODEL,
    audio_format: "mp3",
  });
  return {
    audio: Buffer.from(audio),
    contentType: "audio/mpeg",
    voice,
  };
}

export async function listVoices(apiKey: string): Promise<SonioxVoice[]> {
  const models = await client(apiKey).tts.listModels();
  const seen = new Map<string, SonioxVoice>();
  for (const model of models) {
    const languages = model.languages.map((l) => l.name).join(", ");
    for (const v of model.voices) {
      if (seen.has(v.id)) continue;
      seen.set(v.id, {
        id: v.id,
        name: v.id,
        gender: v.gender,
        description: v.description,
        language: languages,
      });
    }
  }
  return Array.from(seen.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export async function listLanguages(
  apiKey: string,
): Promise<{ code: string; name: string }[]> {
  const models = await client(apiKey).tts.listModels();
  const seen = new Map<string, string>();
  for (const model of models) {
    for (const lang of model.languages) {
      if (!seen.has(lang.code)) seen.set(lang.code, lang.name);
    }
  }
  return Array.from(seen.entries())
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
