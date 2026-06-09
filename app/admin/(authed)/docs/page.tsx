import DownloadMarkdown from "./DownloadMarkdown";

export const metadata = { title: "Docs · Meddler" };

export default function DocsPage() {
  return (
    <>
      <h1>Docs</h1>
      <p className="lede">
        Integration guides for calling Meddler from an external app. Base URL:{" "}
        <span className="kbd">https://meddler.minfect.com</span>.
      </p>

      {/* ---------------- Use case 1: TTS API ---------------- */}
      <div className="card">
        <div className="row between" style={{ marginBottom: 6 }}>
          <div className="row wrap" style={{ gap: 10 }}>
            <span className="pill">Use case 1</span>
            <span className="pill good">POST /api/tts</span>
          </div>
          <DownloadMarkdown />
        </div>
        <h2 style={{ marginTop: 4 }}>Text-to-Speech API</h2>
        <p className="muted" style={{ marginBottom: 0 }}>
          Synthesize speech from text using one of your saved provider
          connections (ElevenLabs or Soniox). Returns an MP3 audio stream.
        </p>

        <hr />

        <h2>Authentication</h2>
        <p className="muted">
          Send your <span className="kbd">SYSTEM_SECRET</span> as a bearer
          token. No login or session cookie is required.
        </p>
        <pre>{`Authorization: Bearer $SYSTEM_SECRET`}</pre>

        <h2 style={{ marginTop: 20 }}>Endpoint</h2>
        <pre>{`POST https://meddler.minfect.com/api/tts`}</pre>

        <h2 style={{ marginTop: 20 }}>Example</h2>
        <pre>{`curl -X POST "https://meddler.minfect.com/api/tts" \\
  -H "Authorization: Bearer $SYSTEM_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "accountId": 1,
    "text": "[excited] Hello from Meddler! [whispers] This is text to speech.",
    "voice": "21m00Tcm4TlvDq8ikWAM",
    "stability": "natural"
  }' \\
  --output speech.mp3`}</pre>

        <h2 style={{ marginTop: 20 }}>Request body</h2>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Type</th>
              <th>Required</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="kbd">accountId</span></td>
              <td>number</td>
              <td><span className="pill good">yes</span></td>
              <td>Connection id of the provider connection to use.</td>
            </tr>
            <tr>
              <td><span className="kbd">text</span></td>
              <td>string</td>
              <td><span className="pill good">yes</span></td>
              <td>
                Up to 5000 characters. ElevenLabs supports inline audio tags
                such as <span className="kbd">[excited]</span> or{" "}
                <span className="kbd">[whispers]</span>.
              </td>
            </tr>
            <tr>
              <td><span className="kbd">voice</span></td>
              <td>string</td>
              <td><span className="pill">no</span></td>
              <td>Voice id. Falls back to the provider default if omitted.</td>
            </tr>
            <tr>
              <td><span className="kbd">stability</span></td>
              <td>string</td>
              <td><span className="pill">no</span></td>
              <td>
                ElevenLabs only — <span className="kbd">creative</span>,{" "}
                <span className="kbd">natural</span>, or{" "}
                <span className="kbd">robust</span>.
              </td>
            </tr>
            <tr>
              <td><span className="kbd">language</span></td>
              <td>string</td>
              <td><span className="pill">no</span></td>
              <td>
                Soniox only — language code such as{" "}
                <span className="kbd">en</span>. The voice must support it.
              </td>
            </tr>
          </tbody>
        </table>

        <h2 style={{ marginTop: 20 }}>Response</h2>
        <p className="muted">
          On success: <span className="kbd">200 OK</span> with{" "}
          <span className="kbd">Content-Type: audio/mpeg</span> — the raw MP3
          bytes. Errors return JSON:
        </p>
        <pre>{`{ "error": "account not found" }`}</pre>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="kbd">200</span></td>
              <td>MP3 audio body.</td>
            </tr>
            <tr>
              <td><span className="kbd">400</span></td>
              <td>Invalid JSON, missing text, or text over 5000 chars.</td>
            </tr>
            <tr>
              <td><span className="kbd">401</span></td>
              <td>Missing or invalid bearer token.</td>
            </tr>
            <tr>
              <td><span className="kbd">404</span></td>
              <td>No connection matches <span className="kbd">accountId</span>.</td>
            </tr>
            <tr>
              <td><span className="kbd">500</span></td>
              <td>Upstream provider error during synthesis.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
