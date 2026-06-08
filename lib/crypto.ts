import crypto from "node:crypto";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) throw new Error("ENCRYPTION_KEY is not set");
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
  }
  return key;
}

export type EncryptedBlob = {
  ciphertext: string;
  iv: string;
  authTag: string;
};

export function encrypt(plaintext: string): EncryptedBlob {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ct.toString("base64"),
    iv: iv.toString("base64"),
    authTag: tag.toString("base64"),
  };
}

export function decrypt(blob: EncryptedBlob): string {
  const key = getKey();
  const decipher = crypto.createDecipheriv(
    ALGO,
    key,
    Buffer.from(blob.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(blob.authTag, "base64"));
  const pt = Buffer.concat([
    decipher.update(Buffer.from(blob.ciphertext, "base64")),
    decipher.final(),
  ]);
  return pt.toString("utf8");
}

export type ProviderKeySummary = {
  id: number;
  provider: string;
  label: string;
  updated_at: string;
};

export async function listProviderKeys(
  provider?: string,
): Promise<ProviderKeySummary[]> {
  const { query } = await import("./db");
  const res = provider
    ? await query(
        "SELECT id, provider, label, updated_at FROM api_keys WHERE provider = $1 ORDER BY label",
        [provider],
      )
    : await query(
        "SELECT id, provider, label, updated_at FROM api_keys ORDER BY provider, label",
      );
  return res.rows;
}

export async function getProviderKeyById(id: number): Promise<{
  provider: string;
  label: string;
  apiKey: string;
} | null> {
  const { query } = await import("./db");
  const res = await query(
    "SELECT provider, label, ciphertext, iv, auth_tag FROM api_keys WHERE id = $1",
    [id],
  );
  if (res.rowCount === 0) return null;
  const r = res.rows[0];
  return {
    provider: r.provider,
    label: r.label,
    apiKey: decrypt({ ciphertext: r.ciphertext, iv: r.iv, authTag: r.auth_tag }),
  };
}

export async function setProviderKey(
  provider: string,
  label: string,
  plaintext: string,
  metadata: Record<string, unknown> = {},
) {
  const { query } = await import("./db");
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

export async function deleteProviderKey(id: number) {
  const { query } = await import("./db");
  await query("DELETE FROM api_keys WHERE id = $1", [id]);
}
