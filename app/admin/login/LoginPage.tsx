"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearAccessToken, setAccessToken } from "@/app/core/auth/client-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const [secret, setSecretInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemSecret: secret }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.accessToken) throw new Error("Invalid secret");

      setAccessToken(data.accessToken);
      router.replace("/admin");
    } catch {
      clearAccessToken();
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="mb-5 flex items-center gap-2.5 font-bold tracking-wide">
            <span className="size-2.5 rounded-full bg-gradient-to-br from-primary to-[#5b6cff] shadow-[0_0_12px_rgba(124,140,255,0.6)]" />
            <span>Meddler</span>
          </div>

          <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">
            Enter the system secret to continue.
          </p>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secret">System secret</Label>
              <Input
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
              <Alert variant="destructive">
                <AlertDescription>Invalid secret.</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
