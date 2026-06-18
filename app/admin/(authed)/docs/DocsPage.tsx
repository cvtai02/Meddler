import DownloadMarkdown from "./DownloadMarkdown";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DocsPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Docs</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Integration guides for calling Meddler from an external app. Base URL:{" "}
        <Badge variant="secondary">https://meddler.minfect.com</Badge>.
      </p>

      {/* Use case 1 — TTS API */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Use case 1</Badge>
              <Badge className="bg-success text-success-foreground">POST /api/tts</Badge>
            </div>
            <DownloadMarkdown />
          </div>
          <h2 className="mt-1 mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Text-to-Speech API
          </h2>
          <p className="text-sm text-muted-foreground">
            Synthesize speech by sending a provider, voice model, and text. Returns an MP3 audio stream.
          </p>

          <Separator className="my-4" />

          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Authentication</h2>
          <p className="text-sm text-muted-foreground">
            First exchange your <Badge variant="secondary">SYSTEM_SECRET</Badge> for a
            permanent access token, then send that token as a bearer token. The
            token remains valid until <Badge variant="secondary">SYSTEM_SECRET</Badge>{" "}
            changes or the token is cleared from the client. You can generate a
            token in <Badge variant="secondary">Admin / Access Token</Badge>.
          </p>
          <pre className="mt-3 overflow-auto rounded-lg border border-border bg-[#060812] p-3 text-xs">{`curl -X POST "https://meddler.minfect.com/api/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{ "systemSecret": "$SYSTEM_SECRET" }'

Authorization: Bearer $ACCESS_TOKEN`}</pre>

          <h2 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Endpoint</h2>
          <pre className="overflow-auto rounded-lg border border-border bg-[#060812] p-3 text-xs">{`POST https://meddler.minfect.com/api/tts`}</pre>

          <h2 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Example</h2>
          <pre className="overflow-auto rounded-lg border border-border bg-[#060812] p-3 text-xs">{`curl -X POST "https://meddler.minfect.com/api/tts" \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "elevenlabs",
    "voiceModel": "21m00Tcm4TlvDq8ikWAM",
    "text": "[excited] Hello from Meddler!"
  }' \\
  --output speech.mp3`}</pre>

          <h2 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Request body</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell><Badge variant="secondary">provider</Badge></TableCell>
                <TableCell>string</TableCell>
                <TableCell><Badge className="bg-success text-success-foreground text-[10px]">yes</Badge></TableCell>
                <TableCell><Badge variant="secondary">elevenlabs</Badge> or <Badge variant="secondary">soniox</Badge>.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge variant="secondary">voiceModel</Badge></TableCell>
                <TableCell>string</TableCell>
                <TableCell><Badge className="bg-success text-success-foreground text-[10px]">yes</Badge></TableCell>
                <TableCell>Voice model id returned by <Badge variant="secondary">GET /api/tts/voice-models</Badge>.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge variant="secondary">text</Badge></TableCell>
                <TableCell>string</TableCell>
                <TableCell><Badge className="bg-success text-success-foreground text-[10px]">yes</Badge></TableCell>
                <TableCell>
                  Up to 5000 characters. ElevenLabs supports inline audio tags
                  such as <Badge variant="secondary">[excited]</Badge>.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <h2 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Response</h2>
          <p className="text-sm text-muted-foreground">
            On success: <Badge variant="secondary">200 OK</Badge> with{" "}
            <Badge variant="secondary">Content-Type: audio/mpeg</Badge>, the raw MP3
            bytes. Errors return JSON.
          </p>
          <pre className="mt-3 overflow-auto rounded-lg border border-border bg-[#060812] p-3 text-xs">{`{ "code": "NOT_FOUND", "message": "provider connection not found" }`}</pre>
          <Table className="mt-3">
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Meaning</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell><Badge variant="secondary">200</Badge></TableCell>
                <TableCell>MP3 audio body.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge variant="secondary">400</Badge></TableCell>
                <TableCell>Invalid JSON, provider, voice model, or text.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge variant="secondary">401</Badge></TableCell>
                <TableCell>Missing or invalid bearer token.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge variant="secondary">404</Badge></TableCell>
                <TableCell>No saved connection exists for the requested provider.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge variant="secondary">500</Badge></TableCell>
                <TableCell>Upstream provider error during synthesis.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Use case 2 — Get Providers */}
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Use case 2</Badge>
            <Badge className="bg-success text-success-foreground">GET /api/tts/providers</Badge>
          </div>
          <h2 className="mt-1 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Get Providers</h2>
          <pre className="overflow-auto rounded-lg border border-border bg-[#060812] p-3 text-xs">{`curl "https://meddler.minfect.com/api/tts/providers" \\
  -H "Authorization: Bearer $ACCESS_TOKEN"`}</pre>
          <h2 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Response</h2>
          <pre className="overflow-auto rounded-lg border border-border bg-[#060812] p-3 text-xs">{`{
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
        </CardContent>
      </Card>

      {/* Use case 3 — Get Voice Models */}
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Use case 3</Badge>
            <Badge className="bg-success text-success-foreground">GET /api/tts/voice-models</Badge>
          </div>
          <h2 className="mt-1 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Get Voice Models</h2>
          <pre className="overflow-auto rounded-lg border border-border bg-[#060812] p-3 text-xs">{`curl "https://meddler.minfect.com/api/tts/voice-models?provider=elevenlabs" \\
  -H "Authorization: Bearer $ACCESS_TOKEN"`}</pre>
          <h2 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Response</h2>
          <pre className="overflow-auto rounded-lg border border-border bg-[#060812] p-3 text-xs">{`{
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
        </CardContent>
      </Card>

      {/* Use case 4 — Get Audio Tags */}
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Use case 4</Badge>
            <Badge className="bg-success text-success-foreground">GET /api/tts/audio-tags</Badge>
          </div>
          <h2 className="mt-1 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Get Audio Tags</h2>
          <pre className="overflow-auto rounded-lg border border-border bg-[#060812] p-3 text-xs">{`curl "https://meddler.minfect.com/api/tts/audio-tags" \\
  -H "Authorization: Bearer $ACCESS_TOKEN"`}</pre>
          <h2 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Response</h2>
          <pre className="overflow-auto rounded-lg border border-border bg-[#060812] p-3 text-xs">{`{
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
        </CardContent>
      </Card>
    </>
  );
}
