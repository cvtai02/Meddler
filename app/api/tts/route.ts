import { NextResponse } from "next/server";
import { hasBearerSecret } from "@/lib/auth";
import { query } from "@/lib/db";
import { getProviderKeyById } from "@/lib/crypto";
import * as elevenlabs from "@/lib/tts/elevenlabs";
import * as soniox from "@/lib/tts/soniox";

export const runtime = "nodejs";

const STABILITY: ReadonlySet<elevenlabs.StabilityV3> =
  new Set<elevenlabs.StabilityV3>(["creative", "natural", "robust"]);

export async function POST(req: Request) {
  if (!hasBearerSecret(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const accountId = Number(body?.accountId);
  const text = String(body?.text || "").trim();
  const voice = body?.voice ? String(body.voice).trim() : undefined;
  const language = body?.language ? String(body.language).trim() : undefined;
  const stabilityRaw = body?.stability ? String(body.stability) : undefined;

  if (!Number.isInteger(accountId) || accountId <= 0) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
  if (text.length > 5000) {
    return NextResponse.json({ error: "text too long (max 5000)" }, { status: 400 });
  }

  const account = await getProviderKeyById(accountId);
  if (!account) {
    return NextResponse.json({ error: "account not found" }, { status: 404 });
  }

  try {
    let result: { audio: Buffer; contentType: string; voice: string };
    if (account.provider === "elevenlabs") {
      const stability =
        stabilityRaw && STABILITY.has(stabilityRaw as elevenlabs.StabilityV3)
          ? (stabilityRaw as elevenlabs.StabilityV3)
          : undefined;
      result = await elevenlabs.synthesize(account.apiKey, {
        text,
        voice,
        stability,
      });
    } else if (account.provider === "soniox") {
      result = await soniox.synthesize(account.apiKey, {
        text,
        voice,
        language,
      });
    } else {
      return NextResponse.json(
        { error: "unsupported provider" },
        { status: 400 },
      );
    }

    await query(
      "INSERT INTO tts_history (provider, account_id, voice, text, bytes) VALUES ($1, $2, $3, $4, $5)",
      [account.provider, accountId, result.voice, text, result.audio.length],
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
