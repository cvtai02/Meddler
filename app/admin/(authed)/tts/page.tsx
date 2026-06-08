"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Voice = {
  id: string;
  name: string;
  language?: string;
  gender?: "male" | "female" | "neutral";
  category?: string;
  description?: string;
  previewUrl?: string;
};

type Provider = "elevenlabs" | "microsoft";
type Stability = "creative" | "natural" | "robust";

const AUDIO_TAGS = [
  "whispers", "excited", "sighs", "laughs", "shouts",
  "sad", "happy", "angry", "curious", "sarcastic",
  "pause", "cough", "gasp", "thinking",
];

const MS_STYLES = [
  "", "cheerful", "sad", "angry", "excited",
  "friendly", "hopeful", "shouting", "terrified",
  "unfriendly", "whispering", "newscast", "customerservice",
];

export default function TtsPage() {
  const [provider, setProvider] = useState<Provider>("elevenlabs");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [voice, setVoice] = useState<string>("");
  const [voiceFilter, setVoiceFilter] = useState("");

  const [text, setText] = useState(
    "[excited] Welcome to Meddler! [whispers] This one's powered by Eleven v3.",
  );
  const [stability, setStability] = useState<Stability>("natural");
  const [msStyle, setMsStyle] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const lastUrl = useRef<string | null>(null);

  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setVoicesLoading(true);
      setVoicesError(null);
      try {
        const res = await fetch(`/api/voices?provider=${provider}`);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as { voices: Voice[] };
        if (cancelled) return;
        setVoices(data.voices);
        if (data.voices.length && !data.voices.find((v) => v.id === voice)) {
          setVoice(data.voices[0].id);
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
  }, [provider]);

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
      const body: Record<string, unknown> = { provider, text, voice };
      if (provider === "elevenlabs") body.stability = stability;
      if (provider === "microsoft" && msStyle) body.msStyle = msStyle;

      const res = await fetch("/api/tts", {
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

  return (
    <>
      <h1>Text-to-Speech</h1>
      <p className="lede">
        Synthesize with <strong>ElevenLabs Eleven v3</strong> or{" "}
        <strong>Microsoft Azure Neural</strong>. Pick a voice, optionally direct it
        with audio tags, then play.
      </p>

      <div className="card">
        <div className="row between" style={{ marginBottom: 16 }}>
          <div className="segmented" role="tablist">
            <button
              type="button"
              data-active={provider === "elevenlabs"}
              onClick={() => setProvider("elevenlabs")}
            >
              ElevenLabs v3
            </button>
            <button
              type="button"
              data-active={provider === "microsoft"}
              onClick={() => setProvider("microsoft")}
            >
              Microsoft Azure
            </button>
          </div>
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
                    <a className="pill" href={currentVoice.previewUrl} target="_blank" rel="noreferrer">
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
              {provider === "elevenlabs" ? (
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
                  <div className="chips">
                    {AUDIO_TAGS.map((tag) => (
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
                </>
              ) : (
                <>
                  <label htmlFor="msStyle">Speaking style</label>
                  <select
                    id="msStyle"
                    value={msStyle}
                    onChange={(e) => setMsStyle(e.target.value)}
                  >
                    {MS_STYLES.map((s) => (
                      <option key={s || "default"} value={s}>
                        {s ? s : "(default)"}
                      </option>
                    ))}
                  </select>
                  <p className="muted-2" style={{ fontSize: 12, marginTop: 8 }}>
                    Wraps the SSML in <span className="kbd">mstts:express-as</span>.
                    Not every voice supports every style — the voice description
                    shows supported styles when available.
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
            <button type="submit" disabled={busy || !text.trim() || !voice}>
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

          {error && <div className="error-banner" style={{ marginTop: 14 }}>{error}</div>}

          {audioUrl && (
            <>
              <audio controls src={audioUrl} />
              <div className="row" style={{ marginTop: 8 }}>
                <a className="btn secondary sm" href={audioUrl} download={`tts-${provider}.mp3`}>
                  ⬇ Download
                </a>
              </div>
            </>
          )}
        </form>
      </div>
    </>
  );
}

function formatVoiceLabel(v: Voice) {
  const bits: string[] = [v.name];
  if (v.language) bits.push(`· ${v.language}`);
  if (v.gender) bits.push(`· ${v.gender}`);
  return bits.join(" ");
}
