"use client";

import { useEffect, useState } from "react";

type StoredKey = {
  id: number;
  provider: string;
  label: string;
  updated_at: string;
};

const PROVIDERS = [
  { id: "elevenlabs", label: "ElevenLabs" },
  { id: "soniox", label: "Soniox" },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<StoredKey[]>([]);
  const [provider, setProvider] = useState("elevenlabs");
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/api-keys");
    if (res.ok) {
      const data = await res.json();
      setKeys(data.keys || []);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          label: label.trim() || "default",
          apiKey,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      setApiKey("");
      setLabel("");
      setMsg(`Saved ${labelFor(provider)} key.`);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number, providerLabel: string) {
    if (!confirm(`Delete the ${providerLabel} key?`)) return;
    const res = await fetch(`/api/api-keys?id=${id}`, { method: "DELETE" });
    if (res.ok) await refresh();
  }

  return (
    <>
      <h1>API Keys</h1>
      <p className="lede">
        Keys are encrypted with AES-256-GCM using{" "}
        <span className="kbd">ENCRYPTION_KEY</span> before being written to Postgres.
        You can store multiple accounts per provider — give each one a label to
        tell them apart.
      </p>

      <div className="card">
        <h2>Add or replace an account</h2>
        <form onSubmit={save}>
          <div className="grid cols-3">
            <div className="field">
              <label htmlFor="provider">Provider</label>
              <select
                id="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="label">Account label</label>
              <input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. team, personal, billing"
                maxLength={64}
              />
            </div>
            <div className="field">
              <label htmlFor="apiKey">API key</label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="paste here…"
                required
              />
            </div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button type="submit" disabled={busy || !apiKey.trim()}>
              {busy && <span className="spinner" />}
              {busy ? "Saving…" : "Save key"}
            </button>
            {msg && <div className="success-banner">{msg}</div>}
            {err && <div className="error-banner">{err}</div>}
          </div>
          <p className="muted-2" style={{ fontSize: 12, marginTop: 8 }}>
            Saving with an existing label updates that account's key in place.
          </p>
        </form>
      </div>

      <div className="card">
        <h2>Stored accounts</h2>
        {keys.length === 0 ? (
          <p className="muted">No keys stored yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Label</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id}>
                  <td>
                    <span className="pill good">●</span>{" "}
                    <strong>{labelFor(k.provider)}</strong>
                  </td>
                  <td>{k.label}</td>
                  <td className="muted">
                    {new Date(k.updated_at).toLocaleString()}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="danger sm"
                      onClick={() =>
                        remove(k.id, `${labelFor(k.provider)} (${k.label})`)
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function labelFor(id: string) {
  return PROVIDERS.find((p) => p.id === id)?.label ?? id;
}
