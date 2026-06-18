"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authFetch } from "@/app/core/auth/client-auth";
import { TTS_PROVIDER_META } from "@/app/core/providers/tts-providers";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type Provider = {
  id: string;
  label: string;
  connectionCount: number;
  connected: boolean;
};

export default function TtsProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await authFetch("/api/tts/providers", {
          signal: controller.signal,
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.message || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as { providers: Provider[] };
        if (!controller.signal.aborted) setProviders(data.providers || []);
      } catch (e: any) {
        if (controller.signal.aborted) return;
        setError(e?.message ?? "failed");
      } finally {
        if (!controller.signal.aborted) setLoaded(true);
      }
    })();
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Text-to-Speech</h1>
      <p className="mb-6 text-sm text-muted-foreground">Manage your text-to-speech providers.</p>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>Couldn&apos;t load connections: {error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
        {TTS_PROVIDER_META.map((p) => {
          const apiProvider = providers.find((item) => item.id === p.id);
          const n = apiProvider?.connectionCount ?? 0;
          const connected = apiProvider?.connected ?? false;
          return (
            <Link
              key={p.id}
              href={`/admin/tts/${p.id}`}
              className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-border/80 hover:bg-secondary active:translate-y-px"
            >
              <span
                className="grid size-11 shrink-0 place-items-center rounded-xl text-[15px] font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                style={{ background: p.accent }}
              >
                {p.initials}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{p.label}</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs",
                    connected ? "text-success" : "text-muted-foreground"
                  )}
                >
                  {connected && (
                    <span className="size-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                  )}
                  {!loaded
                    ? "…"
                    : connected
                      ? `${n} connection${n === 1 ? "" : "s"}`
                      : "No connections"}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
