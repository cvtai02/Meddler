# Meddler

Next.js admin for testing two pluggable features:

1. **Text-to-Speech** — provider router over **ElevenLabs** and **Microsoft Azure Speech**.
2. **Crawl Assets** — fetch downloadable media for **TikTok / Facebook / YouTube** links via an external Cobalt-compatible JSON API.

External-provider API keys are stored in Postgres, encrypted at rest with AES-256-GCM (`ENCRYPTION_KEY`). The admin UI is gated by `SYSTEM_SECRET`.

## TTS provider routing

`lib/tts/types.ts` defines a common `TtsProvider` interface. Each adapter (`elevenlabs.ts`, `microsoft.ts`) fetches its decrypted API key from the database and returns `{ audio: Buffer, contentType }`. `lib/tts/index.ts` is the registry/router that dispatches on a `provider` string. Add a new vendor by implementing `TtsProvider` and registering it.

The HTTP route `POST /api/tts` accepts `{ provider, text, voice? }` and streams the audio bytes back.

## Crawl backend

`lib/crawl/index.ts` posts the input URL to a [Cobalt](https://github.com/imputnet/cobalt)-compatible JSON endpoint (default `https://api.cobalt.tools/`). Override with `CRAWL_API_URL` to point at a self-hosted Cobalt instance. The detector limits accepted inputs to TikTok, Facebook, and YouTube hostnames.

## Setup

1. **Copy env**
   ```
   cp .env.example .env
   ```
   Then fill in:
   - `DATABASE_URL` — Postgres connection string.
   - `SYSTEM_SECRET` — the admin login password (also signs session cookies).
   - `ENCRYPTION_KEY` — 32 random bytes as hex. Generate with:
     ```
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

2. **Install + init schema**
   ```
   npm install
   npm run db:init
   ```

3. **Run**
   ```
   npm run dev
   ```
   Open <http://localhost:3000/admin>, sign in with the system secret, paste your ElevenLabs and/or Microsoft Azure Speech keys in **API Keys**, then exercise the **TTS** and **Crawl** pages.

## Layout

```
app/
  admin/
    login/                  public
    (authed)/
      page.tsx              dashboard
      tts/page.tsx          TTS tester
      crawl/page.tsx        Crawl tester
      api-keys/page.tsx     encrypted key manager
  api/
    auth/login,logout
    tts                     POST -> audio bytes
    crawl                   POST -> { url | picker }
    api-keys                GET/POST/DELETE
lib/
  auth.ts                   HMAC-signed cookie session
  crypto.ts                 AES-256-GCM + key storage
  db.ts                     pg Pool
  tts/                      provider router + adapters
  crawl/                    external service client
db/schema.sql               Postgres tables
scripts/init-db.mjs         applies schema.sql
```
