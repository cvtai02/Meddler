export const TTS_DOC_FILENAME = "meddler-tts-api.md";

export const TTS_DOC_MD = `# Text-to-Speech API

Synthesize speech from text using one of your saved provider connections
(ElevenLabs or Soniox). Returns an MP3 audio stream.

Base URL: \`https://meddler.minfect.com\`.

## Authentication

First exchange your system secret for an access token, then send that token as
a bearer token.

    curl -X POST "https://meddler.minfect.com/api/auth/login" \\
      -H "Content-Type: application/json" \\
      -d '{ "systemSecret": "$SYSTEM_SECRET" }'

    Authorization: Bearer $ACCESS_TOKEN

## Endpoint

    POST https://meddler.minfect.com/api/tts

## Example

    curl -X POST "https://meddler.minfect.com/api/tts" \\
      -H "Authorization: Bearer $ACCESS_TOKEN" \\
      -H "Content-Type: application/json" \\
      -d '{
        "accountId": 1,
        "text": "[excited] Hello from Meddler! [whispers] This is text to speech.",
        "voice": "21m00Tcm4TlvDq8ikWAM",
        "stability": "natural"
      }' \\
      --output speech.mp3

## Request body

| Field      | Type   | Required | Notes |
| ---------- | ------ | -------- | ----- |
| accountId  | number | yes      | Connection id of the provider connection to use. |
| text       | string | yes      | Up to 5000 characters. ElevenLabs supports inline audio tags such as [excited] or [whispers]. |
| voice      | string | no       | Voice id. Falls back to the provider default if omitted. |
| stability  | string | no       | ElevenLabs only — creative, natural, or robust. |
| language   | string | no       | Soniox only — language code such as en. The voice must support it. |

## Response

On success: \`200 OK\` with \`Content-Type: audio/mpeg\` — the raw MP3 bytes
(write them to a file or pipe to a player). Errors return JSON, e.g.
\`{ "error": "account not found" }\`.

| Status | Meaning |
| ------ | ------- |
| 200    | MP3 audio body. |
| 400    | Invalid JSON, missing text, or text over 5000 chars. |
| 401    | Missing or invalid bearer token. |
| 404    | No connection matches accountId. |
| 500    | Upstream provider error during synthesis. |

# Get Audio Tags

Fetch the ElevenLabs audio-tag catalog used by the Meddler UI so an external app
can render the same tag picker.

## Endpoint

    GET https://meddler.minfect.com/api/tts/audio-tags

## Example

    curl "https://meddler.minfect.com/api/tts/audio-tags" \\
      -H "Authorization: Bearer $ACCESS_TOKEN"

## Response

    {
      "provider": "elevenlabs",
      "syntax": "[tag]",
      "usage": "Insert tags inline in the text field, for example: [excited] Hello.",
      "groups": [
        {
          "label": "Emotions",
          "tags": ["excited", "happy", "sad", "angry"]
        }
      ]
    }

## Notes

| Topic    | Details |
| -------- | ------- |
| Provider | Audio tags are intended for ElevenLabs Eleven v3. |
| Syntax   | Insert tags inline in the text field, for example [whispers]. |
| Cache    | Response includes Cache-Control: private, max-age=3600. |
`;
