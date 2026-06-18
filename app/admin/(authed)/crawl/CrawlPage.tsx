"use client";

import { useState } from "react";
import { authFetch } from "@/app/core/auth/client-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      <h1 className="text-2xl font-semibold tracking-tight">Crawl Assets</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Paste a TikTok, Facebook, or YouTube URL — get a direct media link via the configured Cobalt backend.
      </p>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="url">Media URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                required
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-xs transition-colors hover:bg-secondary"
                    onClick={() => setUrl(ex)}
                  >
                    {new URL(ex).hostname.replace(/^www\./, "")}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2.5">
              <Button type="submit" disabled={busy || !url.trim()}>
                {busy && <span className="spinner" />}
                {busy ? "Fetching…" : "Fetch"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setUrl(""); setResult(null); setError(null); }}
                disabled={busy}
              >
                Reset
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-3.5">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="secondary">{result.source}</Badge>
              <Badge
                variant={result.status === "ok" ? "default" : result.status === "picker" ? "outline" : "destructive"}
                className={result.status === "ok" ? "bg-success text-success-foreground" : ""}
              >
                {result.status}
              </Badge>
            </div>

            {result.url && (
              <p>
                <a href={result.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  ⬇ Download media
                </a>
              </p>
            )}
            {result.picker && result.picker.length > 0 && (
              <>
                <h2 className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pick one</h2>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {result.picker.map((p, i) => (
                    <li key={i}>
                      <a href={p.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        {p.type} #{i + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-muted-foreground">Raw response</summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-border bg-[#060812] p-3 text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Backend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Defaults to the Cobalt-compatible JSON API at{" "}
            <Badge variant="secondary">api.cobalt.tools</Badge>. Override with{" "}
            <Badge variant="secondary">CRAWL_API_URL</Badge> in <Badge variant="secondary">.env</Badge> to point at a
            self-hosted Cobalt instance.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
