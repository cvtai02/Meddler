export type SynthesizeTtsRequestDto = {
  provider: "elevenlabs" | "soniox";
  voiceModel: string;
  text: string;
};

export type SynthesizeTtsResultDto = {
  audio: Buffer;
  contentType: string;
  voice: string;
};

export type VoiceModelDto = {
  id: string;
  name: string;
  language?: string;
  gender?: "male" | "female" | "neutral";
  category?: string;
  description?: string;
  previewUrl?: string;
};

type LanguageDto = { code: string; name: string };

export type ListVoicesResultDto = {
  voices: VoiceModelDto[];
  voiceModels: VoiceModelDto[];
  languages: LanguageDto[];
};
