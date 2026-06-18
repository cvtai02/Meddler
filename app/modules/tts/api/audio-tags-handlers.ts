import { apiError, apiJson, corsOptions } from "@/app/core/api/responses";
import { isAuthorized } from "@/app/core/auth/system-secret";
import { AUDIO_TAG_GROUPS } from "@/app/core/providers/audio-tags";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsOptions();
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return apiError("UNAUTHORIZED", "Missing or invalid bearer token", 401);
  }

  return apiJson(
    {
      provider: "elevenlabs",
      syntax: "[tag]",
      usage: "Insert tags inline in the text field, for example: [excited] Hello.",
      groups: AUDIO_TAG_GROUPS,
    },
    {
      headers: { "Cache-Control": "private, max-age=3600" },
    },
  );
}
