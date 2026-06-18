import {
  apiError,
  apiJson,
  corsOptions,
} from "@/app/core/api/responses";
import { isAuthorized } from "@/app/core/auth/system-secret";
import { isTtsProviderId } from "@/app/core/providers/tts-providers";
import { listVoices } from "../usecases/list-voices";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsOptions();
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return apiError("UNAUTHORIZED", "Missing or invalid bearer token", 401);
  }
  const url = new URL(req.url);
  const provider = String(url.searchParams.get("provider") ?? "").trim();
  if (!isTtsProviderId(provider)) {
    return apiError("BAD_REQUEST", "provider must be elevenlabs or soniox", 400);
  }

  try {
    const result = await listVoices(provider);
    if (!result) {
      return apiError("NOT_FOUND", "provider connection not found", 404);
    }
    return apiJson(result, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (e: any) {
    const raw = e?.message ?? "";
    const isUserError = raw === "unsupported provider";
    if (!isUserError) console.error("Voice listing error:", e);
    const status = isUserError ? 400 : 502;
    const message = isUserError ? raw : "voice listing failed";
    return apiError(status === 400 ? "BAD_REQUEST" : "UPSTREAM_ERROR", message, status);
  }
}
