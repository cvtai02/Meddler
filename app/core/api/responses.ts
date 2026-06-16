import { NextResponse } from "next/server";

type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export function withCors(headers?: HeadersInit): Headers {
  const next = new Headers(headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    next.set(key, value);
  }
  return next;
}

export function apiJson<T>(body: T, init: ResponseInit = {}): NextResponse<T> {
  return NextResponse.json(body, {
    ...init,
    headers: withCors(init.headers),
  });
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: unknown,
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = { code, message };
  if (details !== undefined) body.details = details;
  return apiJson(body, { status });
}

export function corsOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: withCors(),
  });
}

export async function readJson(req: Request): Promise<unknown | null> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
