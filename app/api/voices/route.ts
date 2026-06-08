import { NextResponse } from "next/server";
import { isLoggedIn } from "@/lib/auth";
import { listVoices } from "@/lib/tts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const provider = url.searchParams.get("provider") || "";
  if (!provider) {
    return NextResponse.json({ error: "provider required" }, { status: 400 });
  }
  try {
    const voices = await listVoices(provider);
    return NextResponse.json(
      { voices },
      { headers: { "Cache-Control": "private, max-age=300" } },
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "voice listing failed" }, { status: 502 });
  }
}
