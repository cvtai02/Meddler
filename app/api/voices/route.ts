import { NextResponse } from "next/server";
import { hasBearerSecret } from "@/lib/auth";
import { getProviderKeyById } from "@/lib/crypto";
import * as elevenlabs from "@/lib/tts/elevenlabs";
import * as soniox from "@/lib/tts/soniox";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!hasBearerSecret(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const accountIdRaw = url.searchParams.get("accountId");
  const accountId = accountIdRaw ? Number(accountIdRaw) : NaN;
  if (!Number.isInteger(accountId) || accountId <= 0) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  const account = await getProviderKeyById(accountId);
  if (!account) {
    return NextResponse.json({ error: "account not found" }, { status: 404 });
  }

  try {
    if (account.provider === "elevenlabs") {
      const voices = await elevenlabs.listVoices(account.apiKey);
      return NextResponse.json(
        { voices, languages: [] },
        { headers: { "Cache-Control": "private, max-age=300" } },
      );
    }
    if (account.provider === "soniox") {
      const [voices, languages] = await Promise.all([
        soniox.listVoices(account.apiKey),
        soniox.listLanguages(account.apiKey),
      ]);
      return NextResponse.json(
        { voices, languages },
        { headers: { "Cache-Control": "private, max-age=300" } },
      );
    }
    return NextResponse.json(
      { error: "unsupported provider" },
      { status: 400 },
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "voice listing failed" },
      { status: 502 },
    );
  }
}
