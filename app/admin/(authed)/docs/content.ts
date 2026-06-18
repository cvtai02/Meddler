export const TTS_DOC_FILENAME = "meddler-tts-api.md";

export const TTS_DOC_MD = `# Text-to-Speech API

Synthesize speech from text with a provider and voice model selected from the
Meddler API. Returns an MP3 audio stream.

Base URL: \`https://meddler.minfect.com\`.

## Authentication

First exchange your system secret for a permanent access token, then send that
token as a bearer token. The token remains valid until \`SYSTEM_SECRET\` changes
or the token is cleared from the client. You can generate a token in
\`Admin / Access Token\`.

    curl -X POST "https://meddler.minfect.com/api/auth/login" \\
      -H "Content-Type: application/json" \\
      -d '{ "systemSecret": "$SYSTEM_SECRET" }'

    Authorization: Bearer $ACCESS_TOKEN

## Synthesize Speech

    POST https://meddler.minfect.com/api/tts

Example:

    curl -X POST "https://meddler.minfect.com/api/tts" \\
      -H "Authorization: Bearer $ACCESS_TOKEN" \\
      -H "Content-Type: application/json" \\
      -d '{
        "provider": "elevenlabs",
        "voiceModel": "21m00Tcm4TlvDq8ikWAM",
        "text": "[excited] Hello from Meddler!"
      }' \\
      --output speech.mp3

Request body:

| Field      | Type   | Required | Notes |
| ---------- | ------ | -------- | ----- |
| provider   | string | yes      | elevenlabs or soniox. |
| voiceModel | string | yes      | Voice model id returned by GET /api/tts/voice-models. |
| text       | string | yes      | Up to 5000 characters. ElevenLabs supports inline audio tags such as [excited]. |

Response:

| Status | Meaning |
| ------ | ------- |
| 200    | MP3 audio body. |
| 400    | Invalid JSON, provider, voiceModel, or text. |
| 401    | Missing or invalid bearer token. |
| 404    | No saved connection exists for the requested provider. |
| 500    | Upstream provider error during synthesis. |

## Get Providers

    GET https://meddler.minfect.com/api/tts/providers

Example:

    curl "https://meddler.minfect.com/api/tts/providers" \\
      -H "Authorization: Bearer $ACCESS_TOKEN"

Response:

    {
      "providers": [
        {
          "id": "elevenlabs",
          "label": "ElevenLabs",
          "model": "Eleven v3",
          "blurb": "Expressive speech with audio-tag direction.",
          "connectionCount": 1,
          "connected": true
        }
      ]
    }

## Get Voice Models

    GET https://meddler.minfect.com/api/tts/voice-models?provider=elevenlabs

Example:

    curl "https://meddler.minfect.com/api/tts/voice-models?provider=elevenlabs" \\
      -H "Authorization: Bearer $ACCESS_TOKEN"

Response:

    {
      "voiceModels": [
        {
          "id": "21m00Tcm4TlvDq8ikWAM",
          "name": "Rachel",
          "language": "English",
          "gender": "female"
        }
      ],
      "languages": []
    }

## Get Audio Tags

    GET https://meddler.minfect.com/api/tts/audio-tags

Example:

    curl "https://meddler.minfect.com/api/tts/audio-tags" \\
      -H "Authorization: Bearer $ACCESS_TOKEN"

Response:

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
`;
