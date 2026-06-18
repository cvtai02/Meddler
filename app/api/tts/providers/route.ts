import {
  GET as getProviders,
  OPTIONS as providersOptions,
} from "@/app/modules/tts/api/providers-handlers";

export const runtime = "nodejs";

export function OPTIONS() {
  return providersOptions();
}

export function GET(req: Request) {
  return getProviders(req);
}
