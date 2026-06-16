import { query } from "@/app/infrastructure/db/postgres";
import { crawl } from "@/app/infrastructure/crawl/cobalt-client";
import type { CrawlResultDto } from "../dtos/crawl-result.dto";

export async function crawlUrl(url: string): Promise<CrawlResultDto> {
  const result = await crawl(url);

  await query(
    `INSERT INTO crawl_history (source, input_url, result_url, metadata)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [
      result.source,
      result.inputUrl,
      result.url ?? null,
      JSON.stringify({
        status: result.status,
        error: result.error,
        picker: result.picker,
      }),
    ],
  );

  return result;
}
