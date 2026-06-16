import { query } from "@/app/infrastructure/db/postgres";

export type DashboardCounts =
  | { ok: true; keys: number; tts: number; crawl: number }
  | { ok: false; error: string };

export async function getDashboardCounts(): Promise<DashboardCounts> {
  try {
    const [keys, tts, crawl] = await Promise.all([
      query<{ count: string }>("SELECT COUNT(*)::text AS count FROM api_keys"),
      query<{ count: string }>("SELECT COUNT(*)::text AS count FROM tts_history"),
      query<{ count: string }>("SELECT COUNT(*)::text AS count FROM crawl_history"),
    ]);
    return {
      keys: Number(keys.rows[0]?.count ?? 0),
      tts: Number(tts.rows[0]?.count ?? 0),
      crawl: Number(crawl.rows[0]?.count ?? 0),
      ok: true,
    };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "db error" };
  }
}
