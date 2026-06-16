import { query } from "@/app/infrastructure/db/postgres";
import { getProviderKeyById } from "@/app/modules/api-keys/usecases/get-provider-key-by-id";
import * as elevenlabs from "@/app/infrastructure/tts/elevenlabs.adapter";
import * as soniox from "@/app/infrastructure/tts/soniox.adapter";
import type {
  StabilityV3Dto,
  SynthesizeTtsRequestDto,
  SynthesizeTtsResultDto,
} from "../dtos/tts.dto";

const STABILITY: ReadonlySet<StabilityV3Dto> = new Set([
  "creative",
  "natural",
  "robust",
]);

export async function synthesizeTts(
  req: SynthesizeTtsRequestDto,
): Promise<SynthesizeTtsResultDto | null> {
  const account = await getProviderKeyById(req.accountId);
  if (!account) return null;

  let result: SynthesizeTtsResultDto;
  if (account.provider === "elevenlabs") {
    const stability =
      req.stability && STABILITY.has(req.stability) ? req.stability : undefined;
    result = await elevenlabs.synthesize(account.apiKey, {
      text: req.text,
      voice: req.voice,
      stability,
    });
  } else if (account.provider === "soniox") {
    result = await soniox.synthesize(account.apiKey, {
      text: req.text,
      voice: req.voice,
      language: req.language,
    });
  } else {
    throw new Error("unsupported provider");
  }

  await query(
    "INSERT INTO tts_history (provider, account_id, voice, text, bytes) VALUES ($1, $2, $3, $4, $5)",
    [account.provider, req.accountId, result.voice, req.text, result.audio.length],
  );
  return result;
}
