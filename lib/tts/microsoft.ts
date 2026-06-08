import { getProviderKey } from "@/lib/crypto";
import type { TtsProvider, TtsRequest, TtsResult, VoiceInfo } from "./types";

const DEFAULT_VOICE = "en-US-JennyNeural";

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function langOf(voice: string): string {
  const m = voice.match(/^([a-z]{2}-[A-Z]{2})/);
  return m ? m[1] : "en-US";
}

function region() {
  return process.env.AZURE_SPEECH_REGION || "eastus";
}

async function apiKey() {
  const k = await getProviderKey("microsoft");
  if (!k) throw new Error("Microsoft Speech API key not configured");
  return k;
}

export const microsoftTts: TtsProvider = {
  name: "microsoft",

  async synthesize(req: TtsRequest): Promise<TtsResult> {
    const key = await apiKey();
    const voice = req.voice || DEFAULT_VOICE;
    const lang = langOf(voice);
    const safeText = escapeXml(req.text);

    const inner = req.msStyle
      ? `<mstts:express-as style='${escapeXml(req.msStyle)}'>${safeText}</mstts:express-as>`
      : safeText;

    const ssml = `<speak version='1.0' xml:lang='${lang}' xmlns:mstts='http://www.w3.org/2001/mstts'><voice name='${voice}'>${inner}</voice></speak>`;

    const res = await fetch(
      `https://${region()}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": key,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
          "User-Agent": "meddler",
        },
        body: ssml,
      },
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Microsoft TTS ${res.status}: ${body.slice(0, 400)}`);
    }

    const audio = Buffer.from(await res.arrayBuffer());
    return { audio, contentType: "audio/mpeg", provider: "microsoft", voice };
  },

  async listVoices(): Promise<VoiceInfo[]> {
    const key = await apiKey();
    const res = await fetch(
      `https://${region()}.tts.speech.microsoft.com/cognitiveservices/voices/list`,
      { headers: { "Ocp-Apim-Subscription-Key": key } },
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Microsoft voices ${res.status}: ${body.slice(0, 300)}`);
    }
    const list = (await res.json()) as Array<{
      ShortName: string;
      DisplayName?: string;
      LocalName?: string;
      Locale?: string;
      LocaleName?: string;
      Gender?: string;
      VoiceType?: string;
      StyleList?: string[];
    }>;

    return list
      .map<VoiceInfo>((v) => ({
        id: v.ShortName,
        name: v.DisplayName
          ? `${v.DisplayName}${v.LocalName && v.LocalName !== v.DisplayName ? ` (${v.LocalName})` : ""}`
          : v.ShortName,
        language: v.LocaleName || v.Locale,
        gender:
          v.Gender?.toLowerCase() === "male"
            ? "male"
            : v.Gender?.toLowerCase() === "female"
              ? "female"
              : undefined,
        category: v.VoiceType,
        description: v.StyleList?.length ? `Styles: ${v.StyleList.join(", ")}` : undefined,
      }))
      .sort((a, b) => {
        const la = a.language || "";
        const lb = b.language || "";
        return la.localeCompare(lb) || a.name.localeCompare(b.name);
      });
  },
};
