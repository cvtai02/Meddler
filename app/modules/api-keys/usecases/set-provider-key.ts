import { query } from "@/app/infrastructure/db/postgres";
import { encrypt } from "@/app/infrastructure/security/encryption";

export async function setProviderKey(
  provider: string,
  label: string,
  plaintext: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const blob = encrypt(plaintext);
  await query(
    `INSERT INTO api_keys (provider, label, ciphertext, iv, auth_tag, metadata)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     ON CONFLICT (provider, label) DO UPDATE
     SET ciphertext = EXCLUDED.ciphertext,
         iv = EXCLUDED.iv,
         auth_tag = EXCLUDED.auth_tag,
         metadata = EXCLUDED.metadata,
         updated_at = NOW()`,
    [
      provider,
      label,
      blob.ciphertext,
      blob.iv,
      blob.authTag,
      JSON.stringify(metadata),
    ],
  );
}
