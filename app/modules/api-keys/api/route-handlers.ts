import { isAuthorized } from "@/app/core/auth/system-secret";
import {
  apiError,
  apiJson,
  corsOptions,
  readJson,
} from "@/app/core/api/responses";
import { isTtsProviderId } from "@/app/core/providers/tts-providers";
import { deleteProviderKey } from "../usecases/delete-provider-key";
import { listProviderKeys } from "../usecases/list-provider-keys";
import { setProviderKey } from "../usecases/set-provider-key";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsOptions();
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return apiError("UNAUTHORIZED", "Missing or invalid bearer token", 401);
  }
  const keys = await listProviderKeys();
  return apiJson({ keys });
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
  const label = String(body.label ?? "").trim() || "default";
  const apiKey = String(body.apiKey ?? "").trim();

  if (!isTtsProviderId(provider)) {
    return apiError("BAD_REQUEST", "unknown provider", 400);
  }
  if (!apiKey) {
    return apiError("BAD_REQUEST", "apiKey required", 400);
  }
  if (label.length > 64) {
    return apiError("BAD_REQUEST", "label too long", 400);
  }

  await setProviderKey(provider, label, apiKey);
  return apiJson({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isAuthorized(req)) {
    return apiError("UNAUTHORIZED", "Missing or invalid bearer token", 401);
  }
  const url = new URL(req.url);
  const idRaw = url.searchParams.get("id");
  const id = idRaw ? Number(idRaw) : NaN;
  if (!Number.isInteger(id) || id <= 0) {
    return apiError("BAD_REQUEST", "id required", 400);
  }
  await deleteProviderKey(id);
  return apiJson({ ok: true });
}
