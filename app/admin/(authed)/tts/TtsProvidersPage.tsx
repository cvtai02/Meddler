"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authFetch } from "@/app/core/auth/client-auth";
import { TTS_PROVIDER_META } from "@/app/core/providers/tts-providers";

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
      <h1>Text-to-Speech</h1>
      <p className="lede">Manage your text-to-speech providers.</p>

      {error && (
        <div className="card">
          <div className="error-banner">Couldn't load connections: {error}</div>
        </div>
      )}

      <div className="provider-grid">
        {TTS_PROVIDER_META.map((p) => {
          const apiProvider = providers.find((item) => item.id === p.id);
          const n = apiProvider?.connectionCount ?? 0;
          const connected = apiProvider?.connected ?? false;
          return (
            <Link
              key={p.id}
              href={`/admin/tts/${p.id}`}
              className="provider-card"
            >
              <span className="provider-icon" style={{ background: p.accent }}>
                {p.initials}
              </span>
              <span className="provider-meta">
                <span className="provider-name">{p.label}</span>
                <span className={connected ? "provider-status good" : "provider-status"}>
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
