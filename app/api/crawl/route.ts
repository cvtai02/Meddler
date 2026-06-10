import { NextResponse } from "next/server";
import { hasBearerSecret } from "@/lib/auth";
import { query } from "@/lib/db";
import { crawl } from "@/lib/crawl";

export const runtime = "nodejs";

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

  const url = String(body.url || "").trim();
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  const result = await crawl(url);

  await query(
    `INSERT INTO crawl_history (source, input_url, result_url, metadata)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [
      result.source,
      result.inputUrl,
      result.url ?? null,
      JSON.stringify({ status: result.status, error: result.error, picker: result.picker }),
    ],
  );

  return NextResponse.json(result, {
    status: result.status === "error" ? 502 : 200,
  });
}
