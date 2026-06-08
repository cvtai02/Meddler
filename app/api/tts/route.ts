import { NextResponse } from "next/server";
import { isLoggedIn } from "@/lib/auth";
import { query } from "@/lib/db";
import { synthesize } from "@/lib/tts";
import type { StabilityV3 } from "@/lib/tts/types";

export const runtime = "nodejs";

const STABILITY: ReadonlySet<StabilityV3> = new Set<StabilityV3>([
  "creative",
  "natural",
  "robust",
]);

export async function POST(req: Request) {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const provider = String(body.provider || "").trim();
  const text = String(body.text || "").trim();
  const voice = body.voice ? String(body.voice).trim() : undefined;
  const stabilityRaw = body.stability ? String(body.stability) : undefined;
  const msStyle = body.msStyle ? String(body.msStyle).trim() : undefined;

  if (!provider) return NextResponse.json({ error: "provider required" }, { status: 400 });
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
  if (text.length > 5000) {
    return NextResponse.json({ error: "text too long (max 5000)" }, { status: 400 });
  }

  const stability =
    stabilityRaw && STABILITY.has(stabilityRaw as StabilityV3)
      ? (stabilityRaw as StabilityV3)
      : undefined;

  try {
    const result = await synthesize(provider, { text, voice, stability, msStyle });
    await query(
      "INSERT INTO tts_history (provider, voice, text, bytes) VALUES ($1, $2, $3, $4)",
      [result.provider, result.voice, text, result.audio.length],
    );
    return new NextResponse(result.audio, {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Content-Length": String(result.audio.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "tts failed" }, { status: 500 });
  }
}
