"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { authFetch } from "@/lib/clientAuth";
import { providerById } from "../providers";

type Voice = {
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

type Stability = "creative" | "natural" | "robust";

// Eleven v3 audio tags, grouped by category. Insert into the script to direct
// delivery — most reliable on Creative/Natural stability.
const AUDIO_TAG_GROUPS: { label: string; tags: string[] }[] = [
  {
    label: "Emotions",
    tags: [
      "excited", "happy", "sad", "angry", "nervous", "frustrated",
      "curious", "crying", "tired", "hopeful", "annoyed", "sarcastic",
    ],
  },
  {
    label: "Delivery",
    tags: [
      "whispers", "shouts", "softly", "deadpan", "cheerfully", "playfully",
      "dramatic tone", "serious tone", "slowly", "rushed", "stammers", "hesitates",
    ],
  },
  {
    label: "Reactions",
    tags: [
      "laughs", "laughs harder", "chuckles", "giggles", "sighs", "exhales",
      "gasps", "gulps", "snorts", "clears throat", "coughs", "yawns", "groans",
    ],
  },
  {
    label: "Pauses & pacing",
    tags: ["pause", "short pause", "long pause", "interrupting", "drawn out"],
  },
];

export default function ProviderDetailPage() {
  const params = useParams<{ provider: string }>();
  const meta = providerById(params.provider);
  if (!meta) notFound();
  const provider = meta!.id;

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [accountId, setAccountId] = useState<number | null>(null);

  // Add-connection form.
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newKey, setNewKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [voices, setVoices] = useState<Voice[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [voice, setVoice] = useState<string>("");
  const [voiceFilter, setVoiceFilter] = useState("");

  const [text, setText] = useState(
    "[excited] Welcome to Meddler! [whispers] Pick a voice and play.",
  );
  const [stability, setStability] = useState<Stability>("natural");
  const [language, setLanguage] = useState<string>("en");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const lastUrl = useRef<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  async function loadAccounts(selectId?: number) {
    try {
      const res = await authFetch("/api/api-keys");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { keys: Account[] };
      const mine = (data.keys || []).filter((k) => k.provider === provider);
      setAccounts(mine);
      setAccountsError(null);
      setAccountId((cur) => {
        if (selectId && mine.some((a) => a.id === selectId)) return selectId;
        if (cur && mine.some((a) => a.id === cur)) return cur;
        return mine[0]?.id ?? null;
      });
    } catch (e: any) {
      setAccountsError(e?.message ?? "failed");
    } finally {
      setAccountsLoaded(true);
    }
  }

  // Load this provider's connections.
  useEffect(() => {
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  // Load voices (and languages, for Soniox) for the selected connection.
  useEffect(() => {
    if (accountId === null) {
      setVoices([]);
      setLanguages([]);
      return;
    }
    let cancelled = false;
    async function load() {
      setVoicesLoading(true);
      setVoicesError(null);
      try {
        const res = await authFetch(`/api/voices?accountId=${accountId}`);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as {
          voices: Voice[];
          languages?: Language[];
        };
        if (cancelled) return;
        setVoices(data.voices);
        setLanguages(data.languages || []);
        if (data.voices.length && !data.voices.find((v) => v.id === voice)) {
          setVoice(data.voices[0].id);
        }
        if (data.languages?.length && !data.languages.find((l) => l.code === language)) {
          const en = data.languages.find((l) => l.code === "en");
          setLanguage(en ? "en" : data.languages[0].code);
        }
      } catch (e: any) {
        if (!cancelled) setVoicesError(e?.message ?? "failed");
      } finally {
        if (!cancelled) setVoicesLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  useEffect(() => () => {
    if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
  }, []);

  const filteredVoices = useMemo(() => {
    const q = voiceFilter.trim().toLowerCase();
    if (!q) return voices;
    return voices.filter((v) =>
      [v.name, v.language, v.gender, v.id].some(
        (f) => f && f.toLowerCase().includes(q),
      ),
    );
  }, [voices, voiceFilter]);

  const currentVoice = voices.find((v) => v.id === voice);

  function insertTag(tag: string) {
    const ta = textRef.current;
    const insertion = `[${tag}] `;
    if (!ta) {
      setText((t) => `${t}${insertion}`);
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
        throw new Error(j.error || `HTTP ${res.status}`);
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
    if (accountId === null) return;
    setBusy(true);
    setError(null);
    if (lastUrl.current) {
      URL.revokeObjectURL(lastUrl.current);
      lastUrl.current = null;
    }
    setAudioUrl(null);
    try {
      const body: Record<string, unknown> = { accountId, text, voice };
      if (provider === "elevenlabs") body.stability = stability;
      if (provider === "soniox") body.language = language;

      const res = await authFetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
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

  const hasConnections = accounts.length > 0;

  return (
    <>
      <nav className="breadcrumb">
        <Link href="/admin/tts">Text-to-Speech</Link>
        <span className="sep">›</span>
        <span>{meta!.label}</span>
      </nav>

      <div className="provider-header">
        <span className="provider-icon" style={{ background: meta!.accent }}>
          {meta!.initials}
        </span>
        <div>
          <div className="provider-title-row">
            <h1>{meta!.label}</h1>
            <span className="badge">TTS</span>
            <a href={meta!.apiKeyUrl} target="_blank" rel="noreferrer">
              Get API Key ↗
            </a>
          </div>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            {meta!.blurb} Model <span className="kbd">{meta!.model}</span>.
          </p>
        </div>
      </div>

      {/* ---------- Connections ---------- */}
      <div className="card">
        <div className="row between" style={{ marginBottom: 14 }}>
          <h2 style={{ margin: 0 }}>Connections</h2>
          {!adding && (
            <button
              type="button"
              className="secondary sm"
              onClick={() => setAdding(true)}
            >
              + Add
            </button>
          )}
        </div>

        {accountsError && (
          <div className="error-banner" style={{ marginBottom: 12 }}>
            Couldn't load connections: {accountsError}
          </div>
        )}

        {!accountsLoaded ? (
          <p className="muted">Loading…</p>
        ) : !hasConnections && !adding ? (
          <p className="muted">
            No connections yet. Add your {meta!.label} API key to start synthesizing.
          </p>
        ) : (
          accounts.map((a) => {
            const active = a.id === accountId;
            return (
              <div className="conn-row" key={a.id}>
                <span className="key-ico" aria-hidden>⚷</span>
                <div className="conn-info">
                  <span className="conn-name">{a.label}</span>
                  <span className="conn-sub">
                    {active && <span className="pill good">● active</span>}
                    <span className="muted-2" style={{ fontSize: 12 }}>
                      Updated {new Date(a.updated_at).toLocaleDateString()}
                    </span>
                  </span>
                </div>
                {!active && (
                  <button
                    type="button"
                    className="secondary sm"
                    onClick={() => setAccountId(a.id)}
                  >
                    Use
                  </button>
                )}
                <button
                  type="button"
                  className="danger sm"
                  onClick={() => removeConnection(a.id, a.label)}
                >
                  Delete
                </button>
              </div>
            );
          })
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
                  placeholder="e.g. team, personal"
                  maxLength={64}
                />
              </div>
              <div className="field">
                <label htmlFor="newKey">{meta!.label} API key</label>
                <input
                  id="newKey"
                  type="password"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="paste here…"
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
                {saving ? "Saving…" : "Save connection"}
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
              Saving with an existing label updates that connection's key in place.
            </p>
          </form>
        )}
      </div>

      {/* ---------- Playground ---------- */}
      {hasConnections && (
        <div className="card">
          <div className="row between" style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Synthesize</h2>
            <span className="muted-2" style={{ fontSize: 12 }}>
              {voicesLoading ? "Loading voices…" : `${voices.length} voices`}
            </span>
          </div>

          <form onSubmit={submit}>
            <div className="grid cols-2">
              <div className="field">
                <label htmlFor="voice">Voice</label>
                <input
                  placeholder="Filter by name, language, gender…"
                  value={voiceFilter}
                  onChange={(e) => setVoiceFilter(e.target.value)}
                  style={{ marginBottom: 6 }}
                />
                <select
                  id="voice"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  size={1}
                  disabled={voicesLoading || voices.length === 0}
                >
                  {filteredVoices.length === 0 && (
                    <option value="">No matches</option>
                  )}
                  {filteredVoices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {formatVoiceLabel(v)}
                    </option>
                  ))}
                </select>
                {currentVoice && (
                  <div className="row wrap" style={{ marginTop: 8, gap: 6 }}>
                    {currentVoice.language && (
                      <span className="pill">{currentVoice.language}</span>
                    )}
                    {currentVoice.gender && (
                      <span className="pill">{currentVoice.gender}</span>
                    )}
                    {currentVoice.category && (
                      <span className="pill">{currentVoice.category}</span>
                    )}
                    {currentVoice.previewUrl && (
                      <a
                        className="pill"
                        href={currentVoice.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        preview ↗
                      </a>
                    )}
                  </div>
                )}
                {currentVoice?.description && (
                  <p className="muted-2" style={{ fontSize: 12, marginTop: 8 }}>
                    {currentVoice.description}
                  </p>
                )}
                {voicesError && (
                  <div className="error-banner" style={{ marginTop: 10 }}>
                    Couldn't load voices: {voicesError}
                  </div>
                )}
              </div>

              <div className="field">
                {provider === "elevenlabs" && (
                  <>
                    <label>Stability (v3)</label>
                    <div className="segmented" style={{ width: "fit-content" }}>
                      {(["creative", "natural", "robust"] as Stability[]).map((s) => (
                        <button
                          type="button"
                          key={s}
                          data-active={stability === s}
                          onClick={() => setStability(s)}
                        >
                          {s[0].toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                    <p className="muted-2" style={{ fontSize: 12, marginTop: 8 }}>
                      {stability === "creative" && "More expressive, sometimes hallucinates."}
                      {stability === "natural" && "Balanced. Best with audio tags."}
                      {stability === "robust" && "Most consistent, less responsive to tags."}
                    </p>

                    <label style={{ marginTop: 14 }}>Audio tags</label>
                    <p className="muted-2" style={{ fontSize: 12, margin: "0 0 8px" }}>
                      Click to insert into the script at the cursor.
                    </p>
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
                    <label htmlFor="language">Language</label>
                    <select
                      id="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      disabled={languages.length === 0}
                    >
                      {languages.length === 0 && (
                        <option value="en">English</option>
                      )}
                      {languages.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.name} ({l.code})
                        </option>
                      ))}
                    </select>
                    <p className="muted-2" style={{ fontSize: 12, marginTop: 8 }}>
                      Soniox uses model <span className="kbd">{meta!.model}</span>.
                      The voice must support the selected language.
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
                    : "Type the text to synthesize…"
                }
              />
              <div className="char-counter">{text.length} / 5000</div>
            </div>

            <div className="row" style={{ gap: 10 }}>
              <button
                type="submit"
                disabled={busy || !text.trim() || !voice || accountId === null}
              >
                {busy && <span className="spinner" />}
                {busy ? "Synthesizing…" : "Synthesize"}
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
              <div className="error-banner" style={{ marginTop: 14 }}>{error}</div>
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
                    ⬇ Download
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

function formatVoiceLabel(v: Voice) {
  const bits: string[] = [v.name];
  if (v.language) bits.push(`· ${v.language}`);
  if (v.gender) bits.push(`· ${v.gender}`);
  return bits.join(" ");
}
