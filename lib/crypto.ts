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

export async function getProviderKey(provider: string): Promise<string | null> {
  const { query } = await import("./db");
  const res = await query(
    "SELECT ciphertext, iv, auth_tag FROM api_keys WHERE provider = $1",
    [provider],
  );
  if (res.rowCount === 0) return null;
  const r = res.rows[0];
  return decrypt({ ciphertext: r.ciphertext, iv: r.iv, authTag: r.auth_tag });
}

export async function setProviderKey(
  provider: string,
  plaintext: string,
  metadata: Record<string, unknown> = {},
) {
  const { query } = await import("./db");
  const blob = encrypt(plaintext);
  await query(
    `INSERT INTO api_keys (provider, ciphertext, iv, auth_tag, metadata)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     ON CONFLICT (provider) DO UPDATE
     SET ciphertext = EXCLUDED.ciphertext,
         iv = EXCLUDED.iv,
         auth_tag = EXCLUDED.auth_tag,
         metadata = EXCLUDED.metadata,
         updated_at = NOW()`,
    [provider, blob.ciphertext, blob.iv, blob.authTag, JSON.stringify(metadata)],
  );
}
