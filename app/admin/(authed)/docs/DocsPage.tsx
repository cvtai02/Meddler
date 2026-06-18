import DownloadMarkdown from "./DownloadMarkdown";

export default function DocsPage() {
  return (
    <>
      <h1>Docs</h1>
      <p className="lede">
        Integration guides for calling Meddler from an external app. Base URL:{" "}
        <span className="kbd">https://meddler.minfect.com</span>.
      </p>

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
          Synthesize speech by sending a provider, voice model, and text.
          Returns an MP3 audio stream.
        </p>

        <hr />

        <h2>Authentication</h2>
        <p className="muted">
          First exchange your <span className="kbd">SYSTEM_SECRET</span> for a
          permanent access token, then send that token as a bearer token. The
          token remains valid until <span className="kbd">SYSTEM_SECRET</span>{" "}
          changes or the token is cleared from the client. You can generate a
          token in <span className="kbd">Admin / Access Token</span>.
        </p>
        <pre>{`curl -X POST "https://meddler.minfect.com/api/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{ "systemSecret": "$SYSTEM_SECRET" }'

Authorization: Bearer $ACCESS_TOKEN`}</pre>

        <h2 style={{ marginTop: 20 }}>Endpoint</h2>
        <pre>{`POST https://meddler.minfect.com/api/tts`}</pre>

        <h2 style={{ marginTop: 20 }}>Example</h2>
        <pre>{`curl -X POST "https://meddler.minfect.com/api/tts" \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "elevenlabs",
    "voiceModel": "21m00Tcm4TlvDq8ikWAM",
    "text": "[excited] Hello from Meddler!"
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
              <td><span className="kbd">provider</span></td>
              <td>string</td>
              <td><span className="pill good">yes</span></td>
              <td><span className="kbd">elevenlabs</span> or <span className="kbd">soniox</span>.</td>
            </tr>
            <tr>
              <td><span className="kbd">voiceModel</span></td>
              <td>string</td>
              <td><span className="pill good">yes</span></td>
              <td>Voice model id returned by <span className="kbd">GET /api/tts/voice-models</span>.</td>
            </tr>
            <tr>
              <td><span className="kbd">text</span></td>
              <td>string</td>
              <td><span className="pill good">yes</span></td>
              <td>
                Up to 5000 characters. ElevenLabs supports inline audio tags
                such as <span className="kbd">[excited]</span>.
              </td>
            </tr>
          </tbody>
        </table>

        <h2 style={{ marginTop: 20 }}>Response</h2>
        <p className="muted">
          On success: <span className="kbd">200 OK</span> with{" "}
          <span className="kbd">Content-Type: audio/mpeg</span>, the raw MP3
          bytes. Errors return JSON.
        </p>
        <pre>{`{ "code": "NOT_FOUND", "message": "provider connection not found" }`}</pre>
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
              <td>Invalid JSON, provider, voice model, or text.</td>
            </tr>
            <tr>
              <td><span className="kbd">401</span></td>
              <td>Missing or invalid bearer token.</td>
            </tr>
            <tr>
              <td><span className="kbd">404</span></td>
              <td>No saved connection exists for the requested provider.</td>
            </tr>
            <tr>
              <td><span className="kbd">500</span></td>
              <td>Upstream provider error during synthesis.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="row wrap" style={{ gap: 10, marginBottom: 6 }}>
          <span className="pill">Use case 2</span>
          <span className="pill good">GET /api/tts/providers</span>
        </div>
        <h2 style={{ marginTop: 4 }}>Get Providers</h2>
        <pre>{`curl "https://meddler.minfect.com/api/tts/providers" \\
  -H "Authorization: Bearer $ACCESS_TOKEN"`}</pre>
        <h2 style={{ marginTop: 20 }}>Response</h2>
        <pre>{`{
  "providers": [
    {
      "id": "elevenlabs",
      "label": "ElevenLabs",
      "model": "Eleven v3",
      "connectionCount": 1,
      "connected": true
    }
  ]
}`}</pre>
      </div>

      <div className="card">
        <div className="row wrap" style={{ gap: 10, marginBottom: 6 }}>
          <span className="pill">Use case 3</span>
          <span className="pill good">GET /api/tts/voice-models</span>
        </div>
        <h2 style={{ marginTop: 4 }}>Get Voice Models</h2>
        <pre>{`curl "https://meddler.minfect.com/api/tts/voice-models?provider=elevenlabs" \\
  -H "Authorization: Bearer $ACCESS_TOKEN"`}</pre>
        <h2 style={{ marginTop: 20 }}>Response</h2>
        <pre>{`{
  "voiceModels": [
    {
      "id": "21m00Tcm4TlvDq8ikWAM",
      "name": "Rachel",
      "language": "English",
      "gender": "female"
    }
  ],
  "languages": []
}`}</pre>
      </div>

      <div className="card">
        <div className="row wrap" style={{ gap: 10, marginBottom: 6 }}>
          <span className="pill">Use case 4</span>
          <span className="pill good">GET /api/tts/audio-tags</span>
        </div>
        <h2 style={{ marginTop: 4 }}>Get Audio Tags</h2>
        <pre>{`curl "https://meddler.minfect.com/api/tts/audio-tags" \\
  -H "Authorization: Bearer $ACCESS_TOKEN"`}</pre>
        <h2 style={{ marginTop: 20 }}>Response</h2>
        <pre>{`{
  "provider": "elevenlabs",
  "syntax": "[tag]",
  "usage": "Insert tags inline in the text field, for example: [excited] Hello.",
  "groups": [
    {
      "label": "Emotions",
      "tags": ["excited", "happy", "sad", "angry"]
    }
  ]
}`}</pre>
      </div>
    </>
  );
}
