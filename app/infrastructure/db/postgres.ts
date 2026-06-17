import { Pool } from "pg";

declare global {
  var __pgPool: Pool | undefined;
}

function isLocalDatabaseHost(hostname: string): boolean {
  return ["localhost", "127.0.0.1", "::1"].includes(hostname);
}

function sslConfig(connectionString: string) {
  const parsed = new URL(connectionString);
  const sslMode = parsed.searchParams.get("sslmode");
  if (sslMode === "disable") return false;
  if (sslMode === "require" || !isLocalDatabaseHost(parsed.hostname)) {
    return { rejectUnauthorized: false };
  }
  return false;
}

function makePool() {
  const url = process.env.DATABASE_CONNECTION_STRING ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_CONNECTION_STRING or DATABASE_URL is not set");
  }
  const pool = new Pool({ connectionString: url, max: 10, ssl: sslConfig(url) });
  pool.on("connect", (client) => {
    client
      .query("SET search_path TO meddler, public")
      .catch((err) => console.warn("Failed to set search_path:", err.message));
  });
  return pool;
}

const pool: Pool = global.__pgPool ?? makePool();
if (process.env.NODE_ENV !== "production") global.__pgPool = pool;

if (typeof process !== "undefined") {
  const shutdown = () => {
    pool.end().catch(() => {});
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}

export async function query<T extends Record<string, any> = Record<string, any>>(
  text: string,
  params?: any[],
) {
  const res = await pool.query<T>(text, params);
  return res;
}
