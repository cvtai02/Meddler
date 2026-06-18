"use client";

import { useEffect, useMemo, useState } from "react";
import { getAccessToken, setAccessToken } from "@/app/core/auth/client-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      <h1 className="text-2xl font-semibold tracking-tight">Access Token</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Generate a permanent bearer token for external API clients.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Generate Token
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={generate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="systemSecret">System secret</Label>
              <Input
                id="systemSecret"
                type="password"
                autoComplete="current-password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Enter SYSTEM_SECRET"
                required
              />
            </div>
            <Button type="submit" disabled={busy || !secret.trim()}>
              {busy && <span className="spinner" />}
              {busy ? "Generating..." : "Generate token"}
            </Button>
          </form>
          {error && (
            <Alert variant="destructive" className="mt-3.5">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bearer Token
            </CardTitle>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={copyToken}
              disabled={!token}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {token ? (
            <>
              <Textarea readOnly value={token} className="min-h-[92px] font-mono text-xs" />
              <div className="mt-2.5 flex flex-wrap gap-2">
                <Badge className="bg-success text-success-foreground">permanent</Badge>
                <Badge variant="secondary">Issued {formatDate(payload?.iat)}</Badge>
                {payload?.exp && (
                  <Badge variant="outline" className="border-warning/30 text-warning">
                    Legacy expiry {formatDate(payload.exp)}
                  </Badge>
                )}
              </div>
              <h2 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Authorization header
              </h2>
              <pre className="overflow-auto rounded-lg border border-border bg-[#060812] p-3 text-xs">
                {`Authorization: Bearer ${token}`}
              </pre>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Generate a token to use Meddler APIs from an external app.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
