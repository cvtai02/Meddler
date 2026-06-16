import { query } from "@/app/infrastructure/db/postgres";
import { decrypt } from "@/app/infrastructure/security/encryption";
import type { ProviderKeySecretDto } from "../dtos/provider-key.dto";

type ProviderKeyRow = {
  provider: string;
  label: string;
  ciphertext: string;
  iv: string;
  auth_tag: string;
};

export async function getProviderKeyById(
  id: number,
): Promise<ProviderKeySecretDto | null> {
  const res = await query<ProviderKeyRow>(
    "SELECT provider, label, ciphertext, iv, auth_tag FROM api_keys WHERE id = $1",
    [id],
  );
  if (res.rowCount === 0) return null;
  const row = res.rows[0];
  return {
    provider: row.provider,
    label: row.label,
    apiKey: decrypt({
      ciphertext: row.ciphertext,
      iv: row.iv,
      authTag: row.auth_tag,
    }),
  };
}
