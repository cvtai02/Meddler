export async function register() {
  const required = ["SYSTEM_SECRET", "ENCRYPTION_KEY"] as const;
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  const hex = process.env.ENCRYPTION_KEY!;
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error("ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)");
  }

  if (!process.env.DATABASE_CONNECTION_STRING && !process.env.DATABASE_URL) {
    console.warn("Warning: neither DATABASE_CONNECTION_STRING nor DATABASE_URL is set");
  }

  if (!process.env.ALLOWED_ORIGINS) {
    console.warn("Warning: ALLOWED_ORIGINS is not set — CORS will reject all cross-origin requests");
  }
}
