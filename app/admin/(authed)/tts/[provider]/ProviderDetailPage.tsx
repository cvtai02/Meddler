"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { authFetch } from "@/app/core/auth/client-auth";
import { AUDIO_TAG_GROUPS } from "@/app/core/providers/audio-tags";
import { providerById } from "@/app/core/providers/tts-providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type VoiceModel = {
  id: string;
  name: string;
  language?: string;
  gender?: "male" | "female" | "neutral";
  category?: string;
  description?: string;
  previewUrl?: string;
};

type Language = { code: string; name: string };

type Account = {
  id: number;
  provider: string;
  label: string;
  updated_at: string;
};

export default function ProviderDetailPage() {
  const params = useParams<{ provider: string }>();
  const meta = providerById(params.provider);
  if (!meta) notFound();
  const provider = meta.id;

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [accountsLoaded, setAccountsLoaded] = useState(false);

  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newKey, setNewKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [voiceModels, setVoiceModels] = useState<VoiceModel[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [voiceModel, setVoiceModel] = useState("");
  const [voiceFilter, setVoiceFilter] = useState("");

  const [text, setText] = useState(
    "[excited] Welcome to Meddler! [whispers] Pick a voice model and play.",
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showApiRequest, setShowApiRequest] = useState(false);
  const lastUrl = useRef<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  async function loadAccounts() {
    try {
      const res = await authFetch("/api/api-keys");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { keys: Account[] };
      setAccounts((data.keys || []).filter((key) => key.provider === provider));
      setAccountsError(null);
    } catch (e: any) {
      setAccountsError(e?.message ?? "failed");
    } finally {
      setAccountsLoaded(true);
    }
  }

  useEffect(() => {
    setAccountsLoaded(false);
    setVoiceModels([]);
    setLanguages([]);
    setVoiceModel("");
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  useEffect(() => {
    if (!accountsLoaded || accounts.length === 0) {
      setVoiceModels([]);
      setLanguages([]);
      return;
    }

    const controller = new AbortController();
    async function loadVoiceModels() {
      setModelsLoading(true);
      setModelsError(null);
      try {
        const res = await authFetch(
          `/api/tts/voice-models?provider=${encodeURIComponent(provider)}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.message || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as {
          voiceModels?: VoiceModel[];
          voices?: VoiceModel[];
          languages?: Language[];
        };
        if (controller.signal.aborted) return;
        const nextModels = data.voiceModels || data.voices || [];
        const nextLanguages = data.languages || [];
        setVoiceModels(nextModels);
        setLanguages(nextLanguages);
        setVoiceModel((current) => {
          if (current && nextModels.some((model) => model.id === current)) {
            return current;
          }
          return nextModels[0]?.id ?? "";
        });
      } catch (e: any) {
        if (!controller.signal.aborted) {
          setModelsError(e?.message ?? "failed");
        }
      } finally {
        if (!controller.signal.aborted) setModelsLoading(false);
      }
    }

    loadVoiceModels();
    return () => {
      controller.abort();
    };
  }, [accountsLoaded, accounts.length, provider]);

  useEffect(() => () => {
    if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
  }, []);

  const filteredModels = useMemo(() => {
    const q = voiceFilter.trim().toLowerCase();
    if (!q) return voiceModels;
    return voiceModels.filter((model) =>
      [model.name, model.language, model.gender, model.id].some(
        (field) => field && field.toLowerCase().includes(q),
      ),
    );
  }, [voiceModels, voiceFilter]);

  const currentModel = voiceModels.find((model) => model.id === voiceModel);
  const hasConnections = accounts.length > 0;

  function insertTag(tag: string) {
    const ta = textRef.current;
    const insertion = `[${tag}] `;
    if (!ta) {
      setText((current) => `${current}${insertion}`);
      return;
    }
    const start = ta.selectionStart ?? text.length;
    const end = ta.selectionEnd ?? text.length;
    const next = text.slice(0, start) + insertion + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      ta.focus();
      const cursor = start + insertion.length;
      ta.setSelectionRange(cursor, cursor);
    });
  }

  async function addConnection(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const res = await authFetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          label: newLabel.trim() || "default",
          apiKey: newKey,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || `HTTP ${res.status}`);
      }
      setNewKey("");
      setNewLabel("");
      setAdding(false);
      await loadAccounts();
    } catch (e: any) {
      setSaveError(e?.message ?? "failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeConnection(id: number, label: string) {
    if (!confirm(`Delete the "${label}" connection?`)) return;
    const res = await authFetch(`/api/api-keys?id=${id}`, { method: "DELETE" });
    if (res.ok) await loadAccounts();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    if (lastUrl.current) {
      URL.revokeObjectURL(lastUrl.current);
      lastUrl.current = null;
    }
    setAudioUrl(null);

    try {
      const body: Record<string, unknown> = {
        provider,
        voiceModel,
        text,
      };

      const res = await authFetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      lastUrl.current = url;
      setAudioUrl(url);
    } catch (e: any) {
      setError(e?.message ?? "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/tts" className="hover:text-primary">Text-to-Speech</Link>
        <span className="opacity-50">/</span>
        <span className="text-foreground">{meta.label}</span>
      </nav>

      {/* Provider header */}
      <div className="mb-2 flex items-center gap-4">
        <span
          className="grid size-13 shrink-0 place-items-center rounded-xl text-lg font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
          style={{ background: meta.accent }}
        >
          {meta.initials}
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{meta.label}</h1>
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-primary">
              TTS
            </Badge>
            <a href={meta.apiKeyUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
              Get API Key
            </a>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {meta.blurb} Default provider model{" "}
            <Badge variant="secondary">{meta.model}</Badge>.
          </p>
        </div>
      </div>

      {/* Connections */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Connections
            </CardTitle>
            {!adding && (
              <Button type="button" variant="secondary" size="sm" onClick={() => setAdding(true)}>
                Add
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {accountsError && (
            <Alert variant="destructive" className="mb-3">
              <AlertDescription>Couldn&apos;t load connections: {accountsError}</AlertDescription>
            </Alert>
          )}

          {!accountsLoaded ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !hasConnections && !adding ? (
            <p className="text-sm text-muted-foreground">
              No connections yet. Add your {meta.label} API key to start synthesizing.
            </p>
          ) : (
            <div className="space-y-2.5">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center gap-3.5 rounded-lg border border-border bg-background p-3"
                >
                  <span className="text-base opacity-60" aria-hidden>#</span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-semibold">{account.label}</span>
                    <span className="inline-flex items-center gap-2">
                      {account.label === "default" && (
                        <Badge className="bg-success text-success-foreground text-[10px]">default</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Updated {new Date(account.updated_at).toLocaleDateString()}
                      </span>
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeConnection(account.id, account.label)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}

          {adding && (
            <form onSubmit={addConnection} className="mt-1 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newLabel">Connection label</Label>
                  <Input
                    id="newLabel"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="default"
                    maxLength={64}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newKey">{meta.label} API key</Label>
                  <Input
                    id="newKey"
                    type="password"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="Paste API key"
                    required
                  />
                </div>
              </div>
              {saveError && (
                <Alert variant="destructive">
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              )}
              <div className="flex items-center gap-2.5">
                <Button type="submit" disabled={saving || !newKey.trim()}>
                  {saving && <span className="spinner" />}
                  {saving ? "Saving..." : "Save connection"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setAdding(false);
                    setSaveError(null);
                    setNewKey("");
                    setNewLabel("");
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The public TTS API chooses the default connection first, then the first label alphabetically.
              </p>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Synthesize */}
      {hasConnections && (
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Synthesize
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {modelsLoading
                  ? "Loading voice models..."
                  : `${voiceModels.length} voice models`}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="voiceModel">Voice model</Label>
                  <Input
                    placeholder="Filter by name, language, gender"
                    value={voiceFilter}
                    onChange={(e) => setVoiceFilter(e.target.value)}
                  />
                  <select
                    id="voiceModel"
                    value={voiceModel}
                    onChange={(e) => setVoiceModel(e.target.value)}
                    disabled={modelsLoading || voiceModels.length === 0}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {filteredModels.length === 0 && (
                      <option value="">No matches</option>
                    )}
                    {filteredModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {formatVoiceModelLabel(model)}
                      </option>
                    ))}
                  </select>
                  {currentModel && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {currentModel.language && <Badge variant="secondary">{currentModel.language}</Badge>}
                      {currentModel.gender && <Badge variant="secondary">{currentModel.gender}</Badge>}
                      {currentModel.category && <Badge variant="secondary">{currentModel.category}</Badge>}
                      {currentModel.previewUrl && (
                        <a href={currentModel.previewUrl} target="_blank" rel="noreferrer">
                          <Badge variant="outline">preview</Badge>
                        </a>
                      )}
                    </div>
                  )}
                  {currentModel?.description && (
                    <p className="text-xs text-muted-foreground">{currentModel.description}</p>
                  )}
                  {modelsError && (
                    <Alert variant="destructive">
                      <AlertDescription>Couldn&apos;t load voice models: {modelsError}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  {provider === "elevenlabs" && (
                    <>
                      <Label>Audio tags</Label>
                      {AUDIO_TAG_GROUPS.map((group) => (
                        <div key={group.label} className="mb-2.5">
                          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            {group.label}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {group.tags.map((tag) => (
                              <button
                                type="button"
                                key={tag}
                                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium transition-colors hover:bg-secondary"
                                onClick={() => insertTag(tag)}
                                title={`Insert [${tag}]`}
                              >
                                <span className="font-mono text-primary">[{tag}]</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {provider === "soniox" && (
                    <>
                      <Label>Provider model</Label>
                      <p className="text-sm text-muted-foreground">
                        <Badge variant="secondary">{meta.model}</Badge>
                      </p>
                      {languages.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {languages.slice(0, 12).map((item) => (
                            <Badge variant="secondary" key={item.code}>{item.code}</Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        The public request body only needs provider, voiceModel, and text.
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text">Text</Label>
                <Textarea
                  ref={textRef}
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={5000}
                  required
                  className="min-h-[120px] font-mono text-[13px]"
                  placeholder={
                    provider === "elevenlabs"
                      ? "Try: [whispers] Listen carefully. [excited] We're live!"
                      : "Type the text to synthesize"
                  }
                />
                <div className="text-right text-[11px] text-muted-foreground">{text.length} / 5000</div>
              </div>

              <div className="flex items-center gap-2.5">
                <Button type="submit" disabled={busy || !text.trim() || !voiceModel}>
                  {busy && <span className="spinner" />}
                  {busy ? "Synthesizing..." : "Synthesize"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setText("")}
                  disabled={busy || !text}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowApiRequest((v) => !v)}
                >
                  {showApiRequest ? "Hide" : "Show"} API Request
                </Button>
              </div>

              {showApiRequest && (
                <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-4 text-xs font-mono">
                  {JSON.stringify(
                    { provider, voiceModel, text },
                    null,
                    2,
                  )}
                </pre>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {audioUrl && (
                <div className="space-y-2 pt-2">
                  <audio controls src={audioUrl} className="w-full" />
                  <div>
                    <a
                      className="inline-flex items-center rounded-lg border border-border bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                      href={audioUrl}
                      download={`tts-${provider}.mp3`}
                    >
                      Download
                    </a>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function formatVoiceModelLabel(model: VoiceModel) {
  const bits: string[] = [model.name];
  if (model.language) bits.push(`- ${model.language}`);
  if (model.gender) bits.push(`- ${model.gender}`);
  return bits.join(" ");
}
