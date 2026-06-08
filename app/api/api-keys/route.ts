import { NextResponse } from "next/server";
import { isLoggedIn } from "@/lib/auth";
import {
  deleteProviderKey,
  listProviderKeys,
  setProviderKey,
} from "@/lib/crypto";

export const runtime = "nodejs";

const ALLOWED = new Set(["elevenlabs", "soniox"]);

export async function GET() {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const keys = await listProviderKeys();
  return NextResponse.json({ keys });
}

export async function POST(req: Request) {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const provider = String(body?.provider || "").trim();
  const label = String(body?.label || "").trim() || "default";
  const apiKey = String(body?.apiKey || "").trim();

  if (!ALLOWED.has(provider)) {
    return NextResponse.json({ error: "unknown provider" }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: "apiKey required" }, { status: 400 });
  }
  if (label.length > 64) {
    return NextResponse.json({ error: "label too long" }, { status: 400 });
  }

  await setProviderKey(provider, label, apiKey);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const idRaw = url.searchParams.get("id");
  const id = idRaw ? Number(idRaw) : NaN;
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  await deleteProviderKey(id);
  return NextResponse.json({ ok: true });
}
