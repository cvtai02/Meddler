import { NextResponse } from "next/server";
import { setSession, verifySystemSecret } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const secret = form?.get("secret")?.toString() ?? "";
  if (!verifySystemSecret(secret)) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("error", "1");
    return NextResponse.redirect(url, 303);
  }
  await setSession();
  const next = form?.get("next")?.toString() || "/admin";
  return NextResponse.redirect(new URL(next, req.url), 303);
}
