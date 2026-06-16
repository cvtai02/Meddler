type CrawlSourceDto = "tiktok" | "facebook" | "youtube" | "unknown";

export type CrawlResultDto = {
  source: CrawlSourceDto;
  inputUrl: string;
  status: "ok" | "picker" | "error";
  url?: string;
  picker?: Array<{ type: string; url: string; thumb?: string }>;
  raw?: unknown;
  error?: string;
};
