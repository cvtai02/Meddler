import { NextResponse } from "next/server";
import { isLoggedIn } from "@/lib/auth";
import { query } from "@/lib/db";
import { setProviderKey } from "@/lib/crypto";

export const runtime = "nodejs";

const ALLOWED = new Set(["elevenlabs", "microsoft"]);

export async function GET() {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const res = await query(
    "SELECT provider, updated_at FROM api_keys ORDER BY provider",
  );
  return NextResponse.json({ keys: res.rows });
}

export async function POST(req: Request) {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const provider = String(body?.provider || "").trim();
  const apiKey = String(body?.apiKey || "").trim();
  if (!ALLOWED.has(provider)) {
    return NextResponse.json({ error: "unknown provider" }, { status: 400 });
  }
  if (!apiKey) return NextResponse.json({ error: "apiKey required" }, { status: 400 });

  await setProviderKey(provider, apiKey);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const provider = url.searchParams.get("provider") || "";
  if (!ALLOWED.has(provider)) {
    return NextResponse.json({ error: "unknown provider" }, { status: 400 });
  }
  await query("DELETE FROM api_keys WHERE provider = $1", [provider]);
  return NextResponse.json({ ok: true });
}
