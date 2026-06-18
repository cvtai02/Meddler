import { query } from "@/app/infrastructure/db/postgres";
import { getProviderKeyByProvider } from "@/app/modules/api-keys/usecases/get-provider-key-by-provider";
import * as elevenlabs from "@/app/infrastructure/tts/elevenlabs.adapter";
import * as soniox from "@/app/infrastructure/tts/soniox.adapter";
import type {
  SynthesizeTtsRequestDto,
  SynthesizeTtsResultDto,
} from "../dtos/tts.dto";

export async function synthesizeTts(
  req: SynthesizeTtsRequestDto,
): Promise<SynthesizeTtsResultDto | null> {
  const account = await getProviderKeyByProvider(req.provider);
  if (!account) return null;

  let result: SynthesizeTtsResultDto;
  if (account.provider === "elevenlabs") {
    result = await elevenlabs.synthesize(account.apiKey, {
      text: req.text,
      voice: req.voiceModel,
    });
  } else if (account.provider === "soniox") {
    result = await soniox.synthesize(account.apiKey, {
      text: req.text,
      voice: req.voiceModel,
    });
  } else {
    throw new Error("unsupported provider");
  }

  await query(
    "INSERT INTO tts_history (provider, account_id, voice, text, bytes) VALUES ($1, $2, $3, $4, $5)",
    [account.provider, account.id, result.voice, req.text, result.audio.length],
  );
  return result;
}
