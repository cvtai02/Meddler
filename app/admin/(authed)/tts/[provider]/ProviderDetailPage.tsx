"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { authFetch } from "@/app/core/auth/client-auth";
import { AUDIO_TAG_GROUPS } from "@/app/core/providers/audio-tags";
import { providerById } from "@/app/core/providers/tts-providers";

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
      <nav className="breadcrumb">
        <Link href="/admin/tts">Text-to-Speech</Link>
        <span className="sep">/</span>
        <span>{meta.label}</span>
      </nav>

      <div className="provider-header">
        <span className="provider-icon" style={{ background: meta.accent }}>
          {meta.initials}
        </span>
        <div>
          <div className="provider-title-row">
            <h1>{meta.label}</h1>
            <span className="badge">TTS</span>
            <a href={meta.apiKeyUrl} target="_blank" rel="noreferrer">
              Get API Key
            </a>
          </div>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            {meta.blurb} Default provider model{" "}
            <span className="kbd">{meta.model}</span>.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="row between" style={{ marginBottom: 14 }}>
          <h2 style={{ margin: 0 }}>Connections</h2>
          {!adding && (
            <button
              type="button"
              className="secondary sm"
              onClick={() => setAdding(true)}
            >
              Add
            </button>
          )}
        </div>

        {accountsError && (
          <div className="error-banner" style={{ marginBottom: 12 }}>
            Couldn't load connections: {accountsError}
          </div>
        )}

        {!accountsLoaded ? (
          <p className="muted">Loading...</p>
        ) : !hasConnections && !adding ? (
          <p className="muted">
            No connections yet. Add your {meta.label} API key to start
            synthesizing.
          </p>
        ) : (
          accounts.map((account) => (
            <div className="conn-row" key={account.id}>
              <span className="key-ico" aria-hidden>
                #
              </span>
              <div className="conn-info">
                <span className="conn-name">{account.label}</span>
                <span className="conn-sub">
                  {account.label === "default" && (
                    <span className="pill good">default</span>
                  )}
                  <span className="muted-2" style={{ fontSize: 12 }}>
                    Updated {new Date(account.updated_at).toLocaleDateString()}
                  </span>
                </span>
              </div>
              <button
                type="button"
                className="danger sm"
                onClick={() => removeConnection(account.id, account.label)}
              >
                Delete
              </button>
            </div>
          ))
        )}

        {adding && (
          <form onSubmit={addConnection} style={{ marginTop: 4 }}>
            <div className="grid cols-2">
              <div className="field">
                <label htmlFor="newLabel">Connection label</label>
                <input
                  id="newLabel"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="default"
                  maxLength={64}
                />
              </div>
              <div className="field">
                <label htmlFor="newKey">{meta.label} API key</label>
                <input
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
              <div className="error-banner" style={{ marginBottom: 10 }}>
                {saveError}
              </div>
            )}
            <div className="row" style={{ gap: 10 }}>
              <button type="submit" disabled={saving || !newKey.trim()}>
                {saving && <span className="spinner" />}
                {saving ? "Saving..." : "Save connection"}
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setAdding(false);
                  setSaveError(null);
                  setNewKey("");
                  setNewLabel("");
                }}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
            <p className="muted-2" style={{ fontSize: 12, marginTop: 8 }}>
              The public TTS API chooses the default connection first, then the
              first label alphabetically.
            </p>
          </form>
        )}
      </div>

      {hasConnections && (
        <div className="card">
          <div className="row between" style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Synthesize</h2>
            <span className="muted-2" style={{ fontSize: 12 }}>
              {modelsLoading
                ? "Loading voice models..."
                : `${voiceModels.length} voice models`}
            </span>
          </div>

          <form onSubmit={submit}>
            <div className="grid cols-2">
              <div className="field">
                <label htmlFor="voiceModel">Voice model</label>
                <input
                  placeholder="Filter by name, language, gender"
                  value={voiceFilter}
                  onChange={(e) => setVoiceFilter(e.target.value)}
                  style={{ marginBottom: 6 }}
                />
                <select
                  id="voiceModel"
                  value={voiceModel}
                  onChange={(e) => setVoiceModel(e.target.value)}
                  disabled={modelsLoading || voiceModels.length === 0}
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
                  <div className="row wrap" style={{ marginTop: 8, gap: 6 }}>
                    {currentModel.language && (
                      <span className="pill">{currentModel.language}</span>
                    )}
                    {currentModel.gender && (
                      <span className="pill">{currentModel.gender}</span>
                    )}
                    {currentModel.category && (
                      <span className="pill">{currentModel.category}</span>
                    )}
                    {currentModel.previewUrl && (
                      <a
                        className="pill"
                        href={currentModel.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        preview
                      </a>
                    )}
                  </div>
                )}
                {currentModel?.description && (
                  <p className="muted-2" style={{ fontSize: 12, marginTop: 8 }}>
                    {currentModel.description}
                  </p>
                )}
                {modelsError && (
                  <div className="error-banner" style={{ marginTop: 10 }}>
                    Couldn't load voice models: {modelsError}
                  </div>
                )}
              </div>

              <div className="field">
                {provider === "elevenlabs" && (
                  <>
                    <label>Audio tags</label>
                    {AUDIO_TAG_GROUPS.map((group) => (
                      <div key={group.label} style={{ marginBottom: 10 }}>
                        <div
                          className="muted-2"
                          style={{
                            fontSize: 11,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            marginBottom: 5,
                          }}
                        >
                          {group.label}
                        </div>
                        <div className="chips">
                          {group.tags.map((tag) => (
                            <button
                              type="button"
                              key={tag}
                              className="chip"
                              onClick={() => insertTag(tag)}
                              title={`Insert [${tag}]`}
                            >
                              <span className="tag">[{tag}]</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {provider === "soniox" && (
                  <>
                    <label>Provider model</label>
                    <p className="muted" style={{ marginTop: 0 }}>
                      <span className="kbd">{meta.model}</span>
                    </p>
                    {languages.length > 0 && (
                      <div className="row wrap" style={{ gap: 6 }}>
                        {languages.slice(0, 12).map((item) => (
                          <span className="pill" key={item.code}>
                            {item.code}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="muted-2" style={{ fontSize: 12, marginTop: 8 }}>
                      The public request body only needs provider, voiceModel,
                      and text.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="field">
              <label htmlFor="text">Text</label>
              <textarea
                ref={textRef}
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={5000}
                required
                placeholder={
                  provider === "elevenlabs"
                    ? "Try: [whispers] Listen carefully. [excited] We're live!"
                    : "Type the text to synthesize"
                }
              />
              <div className="char-counter">{text.length} / 5000</div>
            </div>

            <div className="row" style={{ gap: 10 }}>
              <button
                type="submit"
                disabled={busy || !text.trim() || !voiceModel}
              >
                {busy && <span className="spinner" />}
                {busy ? "Synthesizing..." : "Synthesize"}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setText("")}
                disabled={busy || !text}
              >
                Clear
              </button>
            </div>

            {error && (
              <div className="error-banner" style={{ marginTop: 14 }}>
                {error}
              </div>
            )}

            {audioUrl && (
              <>
                <audio controls src={audioUrl} />
                <div className="row" style={{ marginTop: 8 }}>
                  <a
                    className="btn secondary sm"
                    href={audioUrl}
                    download={`tts-${provider}.mp3`}
                  >
                    Download
                  </a>
                </div>
              </>
            )}
          </form>
        </div>
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
