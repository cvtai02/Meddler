export type CrawlSource = "tiktok" | "facebook" | "youtube" | "unknown";

export type CrawlResult = {
  source: CrawlSource;
  inputUrl: string;
  status: "ok" | "picker" | "error";
  url?: string;
  picker?: Array<{ type: string; url: string; thumb?: string }>;
  raw?: unknown;
  error?: string;
};

export function detectSource(input: string): CrawlSource {
  let host: string;
  try {
    host = new URL(input).hostname.toLowerCase();
  } catch {
    return "unknown";
  }
  if (host.includes("tiktok.com")) return "tiktok";
  if (host.includes("facebook.com") || host.includes("fb.watch")) return "facebook";
  if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
  return "unknown";
}

const SUPPORTED: CrawlSource[] = ["tiktok", "facebook", "youtube"];

function isSafeUrl(input: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host === "[::1]") return false;

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4) {
    const [, a, b] = ipv4.map(Number);
    if (a === 127 || a === 10 || a === 0) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 169 && b === 254) return false;
  }

  return true;
}

export async function crawl(inputUrl: string): Promise<CrawlResult> {
  if (!isSafeUrl(inputUrl)) {
    return { source: "unknown", inputUrl, status: "error", error: "Invalid or blocked URL." };
  }

  const source = detectSource(inputUrl);
  if (!SUPPORTED.includes(source)) {
    return {
      source,
      inputUrl,
      status: "error",
      error: "Unsupported source. Use a TikTok, Facebook, or YouTube link.",
    };
  }

  const api = (process.env.CRAWL_API_URL || "https://api.cobalt.tools/").replace(/\/+$/, "/");
  const authorization = process.env.CRAWL_API_AUTHORIZATION?.trim();
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "meddler",
  };
  if (authorization) headers.Authorization = authorization;

  const res = await fetch(api, {
    method: "POST",
    headers,
    body: JSON.stringify({ url: inputUrl }),
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    return { source, inputUrl, status: "error", error: `crawl backend ${res.status}` };
  }

  if (!res.ok) {
    return {
      source,
      inputUrl,
      status: "error",
      error: data?.error?.code || data?.text || `HTTP ${res.status}`,
      raw: data,
    };
  }

  const kind = String(data.status || "");
  if (kind === "redirect" || kind === "tunnel" || kind === "stream") {
    return { source, inputUrl, status: "ok", url: data.url, raw: data };
  }
  if (kind === "picker") {
    return {
      source,
      inputUrl,
      status: "picker",
      picker: Array.isArray(data.picker) ? data.picker : [],
      raw: data,
    };
  }
  return {
    source,
    inputUrl,
    status: "error",
    error: data?.text || data?.error?.code || `unexpected status: ${kind}`,
    raw: data,
  };
}
