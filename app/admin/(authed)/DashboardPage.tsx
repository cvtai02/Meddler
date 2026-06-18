import Link from "next/link";
import { getDashboardCounts } from "@/app/core/dashboard/counts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default async function Dashboard() {
  const stats = await getDashboardCounts();
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Provider router, encrypted secrets, and a tiny crawler — all in one panel.
      </p>

      {!stats.ok ? (
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>Database unreachable</AlertDescription>
            </Alert>
            <p className="mt-3 text-sm text-muted-foreground">
              Run <Badge variant="secondary">npm run db:init</Badge> after setting{" "}
              <Badge variant="secondary">DATABASE_URL</Badge>.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="flex flex-col gap-1 pt-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Provider connections
              </span>
              <span className="text-3xl font-semibold">{stats.keys}</span>
              <Link href="/admin/tts" className="text-sm text-muted-foreground hover:text-primary">
                Manage &rarr;
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-1 pt-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                TTS generations
              </span>
              <span className="text-3xl font-semibold">{stats.tts}</span>
              <Link href="/admin/tts" className="text-sm text-muted-foreground hover:text-primary">
                Open tester &rarr;
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-1 pt-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Crawls run
              </span>
              <span className="text-3xl font-semibold">{stats.crawl}</span>
              <Link href="/admin/crawl" className="text-sm text-muted-foreground hover:text-primary">
                Open tester &rarr;
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What&apos;s here
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <strong className="text-sm">Text-to-Speech</strong>
              <p className="mt-1 text-sm text-muted-foreground">
                ElevenLabs Eleven v3 with audio-tag direction
                (<Badge variant="secondary">[whispers]</Badge>, <Badge variant="secondary">[excited]</Badge>…).
                Switch between multiple accounts per provider.
              </p>
            </div>
            <div>
              <strong className="text-sm">Crawl Assets</strong>
              <p className="mt-1 text-sm text-muted-foreground">
                Paste a TikTok, Facebook, or YouTube URL to fetch a downloadable
                media link via a Cobalt-compatible backend.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
