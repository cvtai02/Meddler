export type StabilityV3Dto = "creative" | "natural" | "robust";

export type SynthesizeTtsRequestDto = {
  accountId: number;
  text: string;
  voice?: string;
  language?: string;
  stability?: StabilityV3Dto;
};

export type SynthesizeTtsResultDto = {
  audio: Buffer;
  contentType: string;
  voice: string;
};

type VoiceDto = {
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
  voices: VoiceDto[];
  languages: LanguageDto[];
};
