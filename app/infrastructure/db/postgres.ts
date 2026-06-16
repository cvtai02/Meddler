import { Pool } from "pg";

declare global {
  var __pgPool: Pool | undefined;
}

function makePool() {
  const url = process.env.DATABASE_CONNECTION_STRING ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_CONNECTION_STRING is not set");
  }
  const pool = new Pool({ connectionString: url, max: 10 });
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
