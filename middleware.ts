import { NextRequest, NextResponse } from "next/server";

const PUBLIC = ["/admin/login", "/api/auth/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/tts") ||
    pathname.startsWith("/api/crawl") ||
    pathname.startsWith("/api/voices") ||
    pathname.startsWith("/api/api-keys");

  if (!needsAuth) return NextResponse.next();
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // The TTS API also accepts a bearer token for external apps. Let those
  // requests through; the route handler verifies the secret itself.
  if (pathname.startsWith("/api/tts")) {
    const auth = req.headers.get("authorization") ?? "";
    if (/^Bearer\s+.+/i.test(auth.trim())) {
      return NextResponse.next();
    }
  }

  const token = req.cookies.get("meddler_session")?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/tts/:path*",
    "/api/crawl/:path*",
    "/api/voices/:path*",
    "/api/api-keys/:path*",
  ],
};
