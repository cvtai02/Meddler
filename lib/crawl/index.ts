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

export async function crawl(inputUrl: string): Promise<CrawlResult> {
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

  const res = await fetch(api, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "meddler",
    },
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
