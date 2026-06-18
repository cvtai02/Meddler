import { query } from "@/app/infrastructure/db/postgres";
import { decrypt } from "@/app/infrastructure/security/encryption";
import type { ProviderKeySecretDto } from "../dtos/provider-key.dto";

type ProviderKeyRow = {
  id: number;
  provider: string;
  label: string;
  ciphertext: string;
  iv: string;
  auth_tag: string;
};

export type ProviderKeyWithIdDto = ProviderKeySecretDto & {
  id: number;
};

export async function getProviderKeyByProvider(
  provider: string,
): Promise<ProviderKeyWithIdDto | null> {
  const res = await query<ProviderKeyRow>(
    `SELECT id, provider, label, ciphertext, iv, auth_tag
     FROM api_keys
     WHERE provider = $1
     ORDER BY CASE WHEN label = 'default' THEN 0 ELSE 1 END, label
     LIMIT 1`,
    [provider],
  );
  if (res.rowCount === 0) return null;
  const row = res.rows[0];
  return {
    id: row.id,
    provider: row.provider,
    label: row.label,
    apiKey: decrypt({
      ciphertext: row.ciphertext,
      iv: row.iv,
      authTag: row.auth_tag,
    }),
  };
}
