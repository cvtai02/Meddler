"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authFetch, setSecret, clearSecret } from "@/lib/clientAuth";

export default function LoginPage() {
  const router = useRouter();
  const [secret, setSecretInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    // Store the secret, then verify it against a protected endpoint.
    setSecret(secret);
    try {
      const res = await authFetch("/api/api-keys");
      if (res.ok) {
        router.replace("/admin");
        return;
      }
      // Wrong secret — drop it and show the error.
      clearSecret();
      setError(true);
    } catch {
      clearSecret();
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="brand" style={{ padding: 0, marginBottom: 18 }}>
          <span className="dot" />
          <span>Meddler</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 22 }}>Sign in</h1>
        <p className="muted" style={{ marginTop: 4, marginBottom: 20 }}>
          Enter the system secret to continue.
        </p>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="secret">System secret</label>
            <input
              id="secret"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              value={secret}
              onChange={(e) => setSecretInput(e.target.value)}
            />
          </div>
          {error && (
            <div className="error-banner" style={{ marginBottom: 12 }}>
              Invalid secret.
            </div>
          )}
          <button type="submit" disabled={busy} style={{ width: "100%" }}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
