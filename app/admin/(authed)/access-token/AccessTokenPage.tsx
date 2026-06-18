"use client";

import { useEffect, useMemo, useState } from "react";
import { getAccessToken, setAccessToken } from "@/app/core/auth/client-auth";

type TokenPayload = {
  iat?: number;
  exp?: number;
};

function decodeToken(token: string): TokenPayload | null {
  try {
    const [payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    return JSON.parse(window.atob(padded)) as TokenPayload;
  } catch {
    return null;
  }
}

function formatDate(seconds?: number) {
  if (typeof seconds !== "number") return "Unknown";
  return new Date(seconds * 1000).toLocaleString();
}

export default function AccessTokenPage() {
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setToken(getAccessToken() ?? "");
  }, []);

  const payload = useMemo(() => {
    if (!token) return null;
    return decodeToken(token);
  }, [token]);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setCopied(false);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemSecret: secret }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.accessToken) {
        throw new Error(data.message || data.error || `HTTP ${res.status}`);
      }

      setAccessToken(data.accessToken);
      setToken(data.accessToken);
      setSecret("");
    } catch (e: any) {
      setError(e?.message ?? "failed");
    } finally {
      setBusy(false);
    }
  }

  async function copyToken() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <>
      <h1>Access Token</h1>
      <p className="lede">Generate a permanent bearer token for external API clients.</p>

      <div className="card">
        <h2>Generate Token</h2>
        <form onSubmit={generate}>
          <div className="field">
            <label htmlFor="systemSecret">System secret</label>
            <input
              id="systemSecret"
              type="password"
              autoComplete="current-password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter SYSTEM_SECRET"
              required
            />
          </div>
          <button type="submit" disabled={busy || !secret.trim()}>
            {busy && <span className="spinner" />}
            {busy ? "Generating..." : "Generate token"}
          </button>
        </form>
        {error && (
          <div className="error-banner" style={{ marginTop: 14 }}>
            {error}
          </div>
        )}
      </div>

      <div className="card">
        <div className="row between" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Bearer Token</h2>
          <button
            type="button"
            className="secondary sm"
            onClick={copyToken}
            disabled={!token}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {token ? (
          <>
            <textarea readOnly value={token} style={{ minHeight: 92 }} />
            <div className="row wrap" style={{ gap: 8, marginTop: 10 }}>
              <span className="pill good">permanent</span>
              <span className="pill">Issued {formatDate(payload?.iat)}</span>
              {payload?.exp && (
                <span className="pill warn">Legacy expiry {formatDate(payload.exp)}</span>
              )}
            </div>
            <h2 style={{ marginTop: 20 }}>Authorization header</h2>
            <pre>{`Authorization: Bearer ${token}`}</pre>
          </>
        ) : (
          <p className="muted">Generate a token to use Meddler APIs from an external app.</p>
        )}
      </div>
    </>
  );
}
