import {
  OPTIONS as ttsOptions,
  POST as synthesizeTts,
} from "@/app/modules/tts/api/route-handlers";

export const runtime = "nodejs";

export function OPTIONS() {
  return ttsOptions();
}

export function POST(req: Request) {
  return synthesizeTts(req);
}
