import { Pool } from "pg";

declare global {
  var __pgPool: Pool | undefined;
}

function makePool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const pool = new Pool({ connectionString: url, max: 10 });
  pool.on("connect", (client) => {
    client.query('SET search_path TO meddler, public').catch(() => {});
  });
  return pool;
}

export const pool: Pool = global.__pgPool ?? makePool();
if (process.env.NODE_ENV !== "production") global.__pgPool = pool;

export async function query<T = any>(text: string, params?: any[]) {
  const res = await pool.query<T>(text, params);
  return res;
}
