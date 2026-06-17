import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(here, "..", "db", "schema.sql");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

function isLocalDatabaseHost(hostname) {
  return ["localhost", "127.0.0.1", "::1"].includes(hostname);
}

function sslConfig(connectionString) {
  const parsed = new URL(connectionString);
  const sslMode = parsed.searchParams.get("sslmode");
  if (sslMode === "disable") return false;
  if (sslMode === "require" || !isLocalDatabaseHost(parsed.hostname)) {
    return { rejectUnauthorized: false };
  }
  return false;
}

const sql = readFileSync(schemaPath, "utf8");
const client = new pg.Client({ connectionString: url, ssl: sslConfig(url) });
await client.connect();
try {
  await client.query(sql);
  console.log("Schema applied.");
} finally {
  await client.end();
}
