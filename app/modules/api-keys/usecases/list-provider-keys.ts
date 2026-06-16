import { query } from "@/app/infrastructure/db/postgres";
import type { ProviderKeySummaryDto } from "../dtos/provider-key.dto";

export async function listProviderKeys(
  provider?: string,
): Promise<ProviderKeySummaryDto[]> {
  const res = provider
    ? await query<ProviderKeySummaryDto>(
        "SELECT id, provider, label, updated_at FROM api_keys WHERE provider = $1 ORDER BY label",
        [provider],
      )
    : await query<ProviderKeySummaryDto>(
        "SELECT id, provider, label, updated_at FROM api_keys ORDER BY provider, label",
      );
  return res.rows;
}
