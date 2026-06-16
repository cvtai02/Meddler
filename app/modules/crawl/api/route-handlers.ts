import {
  apiError,
  apiJson,
  corsOptions,
  readJson,
} from "@/app/core/api/responses";
import { isAuthorized } from "@/app/core/auth/system-secret";
import { crawlUrl } from "../usecases/crawl-url";

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
  const url = String(body.url ?? "").trim();
  if (!url) return apiError("BAD_REQUEST", "url required", 400);

  const result = await crawlUrl(url);
  return apiJson(result, {
    status: result.status === "error" ? 502 : 200,
  });
}
