import { withCors, apiError, corsOptions, readJson } from "@/app/core/api/responses";
import { isAuthorized } from "@/app/core/auth/system-secret";
import { isTtsProviderId } from "@/app/core/providers/tts-providers";
import { synthesizeTts } from "../usecases/synthesize-tts";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsOptions();
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return apiError("UNAUTHORIZED", "Missing or invalid bearer token", 401);
  }

  const raw = await readJson(req);
  if (!raw || typeof raw !== "object") {
    return apiError("BAD_REQUEST", "invalid json", 400);
  }

  const body = raw as Record<string, unknown>;
  const provider = String(body.provider ?? "").trim();
  const voiceModel = String(body.voiceModel ?? "").trim();
  const text = String(body.text ?? "").trim();

  if (!isTtsProviderId(provider)) {
    return apiError("BAD_REQUEST", "provider must be elevenlabs or soniox", 400);
  }
  if (!voiceModel) {
    return apiError("BAD_REQUEST", "voiceModel required", 400);
  }
  if (!text) return apiError("BAD_REQUEST", "text required", 400);
  if (text.length > 5000) {
    return apiError("BAD_REQUEST", "text too long (max 5000)", 400);
  }

  try {
    const result = await synthesizeTts({
      provider,
      voiceModel,
      text,
    });
    if (!result) {
      return apiError("NOT_FOUND", "provider connection not found", 404);
    }

    return new Response(new Uint8Array(result.audio), {
      status: 200,
      headers: withCors({
        "Content-Type": result.contentType,
        "Content-Length": String(result.audio.length),
        "Cache-Control": "no-store",
      }),
    });
  } catch (e: any) {
    const raw = e?.message ?? "";
    const isUserError = raw === "unsupported provider";
    if (!isUserError) console.error("TTS synthesis error:", e);
    const status = isUserError ? 400 : 500;
    const message = isUserError ? raw : "synthesis failed";
    return apiError(status === 400 ? "BAD_REQUEST" : "UPSTREAM_ERROR", message, status);
  }
}
