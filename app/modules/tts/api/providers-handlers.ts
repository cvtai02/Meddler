import { apiError, apiJson, corsOptions } from "@/app/core/api/responses";
import { isAuthorized } from "@/app/core/auth/system-secret";
import { TTS_PROVIDER_META } from "@/app/core/providers/tts-providers";
import { listProviderKeys } from "@/app/modules/api-keys/usecases/list-provider-keys";

export function OPTIONS() {
  return corsOptions();
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return apiError("UNAUTHORIZED", "Missing or invalid bearer token", 401);
  }

  const keys = await listProviderKeys();
  const counts = new Map<string, number>();
  for (const key of keys) {
    counts.set(key.provider, (counts.get(key.provider) ?? 0) + 1);
  }

  return apiJson(
    {
      providers: TTS_PROVIDER_META.map((provider) => {
        const connectionCount = counts.get(provider.id) ?? 0;
        return {
          id: provider.id,
          label: provider.label,
          model: provider.model,
          blurb: provider.blurb,
          connectionCount,
          connected: connectionCount > 0,
        };
      }),
    },
    {
      headers: { "Cache-Control": "private, max-age=60" },
    },
  );
}
