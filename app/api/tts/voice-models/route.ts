import {
  GET as getVoiceModels,
  OPTIONS as voiceModelsOptions,
} from "@/app/modules/tts/api/voices-handlers";

export const runtime = "nodejs";

export function OPTIONS() {
  return voiceModelsOptions();
}

export function GET(req: Request) {
  return getVoiceModels(req);
}
