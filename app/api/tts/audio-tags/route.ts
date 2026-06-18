import {
  GET as getAudioTags,
  OPTIONS as audioTagsOptions,
} from "@/app/modules/tts/api/audio-tags-handlers";

export const runtime = "nodejs";

export function OPTIONS() {
  return audioTagsOptions();
}

export function GET(req: Request) {
  return getAudioTags(req);
}
