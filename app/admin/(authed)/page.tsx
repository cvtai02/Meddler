import Link from "next/link";
import { query } from "@/lib/db";

async function counts() {
  try {
    const [k, t, c] = await Promise.all([
      query<{ count: string }>("SELECT COUNT(*)::text AS count FROM api_keys"),
      query<{ count: string }>("SELECT COUNT(*)::text AS count FROM tts_history"),
      query<{ count: string }>("SELECT COUNT(*)::text AS count FROM crawl_history"),
    ]);
    return {
      keys: Number(k.rows[0]?.count ?? 0),
      tts: Number(t.rows[0]?.count ?? 0),
      crawl: Number(c.rows[0]?.count ?? 0),
      ok: true as const,
    };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? "db error" };
  }
}

export default async function Dashboard() {
  const stats = await counts();
  return (
    <>
      <h1>Dashboard</h1>
      <p className="lede">Provider router, encrypted secrets, and a tiny crawler — all in one panel.</p>

      {!stats.ok ? (
        <div className="card">
          <div className="error-banner">Database unreachable: {stats.error}</div>
          <p className="muted" style={{ marginTop: 12 }}>
            Run <span className="kbd">npm run db:init</span> after setting{" "}
            <span className="kbd">DATABASE_URL</span>.
          </p>
        </div>
      ) : (
        <div className="grid cols-3">
          <div className="card stat">
            <span className="label">Provider connections</span>
            <span className="value">{stats.keys}</span>
            <Link href="/admin/tts" className="muted">Manage →</Link>
          </div>
          <div className="card stat">
            <span className="label">TTS generations</span>
            <span className="value">{stats.tts}</span>
            <Link href="/admin/tts" className="muted">Open tester →</Link>
          </div>
          <div className="card stat">
            <span className="label">Crawls run</span>
            <span className="value">{stats.crawl}</span>
            <Link href="/admin/crawl" className="muted">Open tester →</Link>
          </div>
        </div>
      )}

      <div className="card">
        <h2>What's here</h2>
        <div className="grid cols-2">
          <div>
            <strong>Text-to-Speech</strong>
            <p className="muted" style={{ marginTop: 4 }}>
              ElevenLabs Eleven v3 with audio-tag direction
              (<span className="kbd">[whispers]</span>, <span className="kbd">[excited]</span>…).
              Switch between multiple accounts per provider.
            </p>
          </div>
          <div>
            <strong>Crawl Assets</strong>
            <p className="muted" style={{ marginTop: 4 }}>
              Paste a TikTok, Facebook, or YouTube URL to fetch a downloadable
              media link via a Cobalt-compatible backend.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
