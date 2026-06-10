"use client";

import { useState } from "react";
import { authFetch } from "@/lib/clientAuth";

type CrawlResponse = {
  source: string;
  inputUrl: string;
  status: "ok" | "picker" | "error";
  url?: string;
  picker?: Array<{ type: string; url: string; thumb?: string }>;
  raw?: unknown;
  error?: string;
};

const EXAMPLES = [
  "https://www.tiktok.com/@scout2015/video/6718335390845095173",
  "https://youtu.be/dQw4w9WgXcQ",
  "https://fb.watch/abc123/",
];

export default function CrawlPage() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CrawlResponse | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await authFetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as CrawlResponse;
      setResult(data);
      if (!res.ok && data.error) setError(data.error);
    } catch (e: any) {
      setError(e?.message ?? "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Crawl Assets</h1>
      <p className="lede">
        Paste a TikTok, Facebook, or YouTube URL — get a direct media link via the configured Cobalt backend.
      </p>

      <div className="card">
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="url">Media URL</label>
            <input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              required
            />
            <div className="row wrap" style={{ marginTop: 6 }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  className="chip"
                  onClick={() => setUrl(ex)}
                >
                  {new URL(ex).hostname.replace(/^www\./, "")}
                </button>
              ))}
            </div>
          </div>

          <div className="row" style={{ gap: 10 }}>
            <button type="submit" disabled={busy || !url.trim()}>
              {busy && <span className="spinner" />}
              {busy ? "Fetching…" : "Fetch"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => { setUrl(""); setResult(null); setError(null); }}
              disabled={busy}
            >
              Reset
            </button>
          </div>

          {error && <div className="error-banner" style={{ marginTop: 14 }}>{error}</div>}
        </form>
      </div>

      {result && (
        <div className="card">
          <div className="row between" style={{ marginBottom: 12 }}>
            <div className="row" style={{ gap: 6 }}>
              <span className="pill">{result.source}</span>
              <span className={`pill ${result.status === "ok" ? "good" : result.status === "picker" ? "warn" : "danger"}`}>
                {result.status}
              </span>
            </div>
          </div>

          {result.url && (
            <p>
              <a href={result.url} target="_blank" rel="noreferrer">
                ⬇ Download media
              </a>
            </p>
          )}
          {result.picker && result.picker.length > 0 && (
            <>
              <h2>Pick one</h2>
              <ul>
                {result.picker.map((p, i) => (
                  <li key={i}>
                    <a href={p.url} target="_blank" rel="noreferrer">
                      {p.type} #{i + 1}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          <details style={{ marginTop: 12 }}>
            <summary className="muted">Raw response</summary>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </details>
        </div>
      )}

      <div className="card">
        <h2>Backend</h2>
        <p className="muted">
          Defaults to the Cobalt-compatible JSON API at{" "}
          <span className="kbd">api.cobalt.tools</span>. Override with{" "}
          <span className="kbd">CRAWL_API_URL</span> in <span className="kbd">.env</span> to point at a
          self-hosted Cobalt instance.
        </p>
      </div>
    </>
  );
}
