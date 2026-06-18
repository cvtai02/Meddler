import { getProviderKeyByProvider } from "@/app/modules/api-keys/usecases/get-provider-key-by-provider";
import * as elevenlabs from "@/app/infrastructure/tts/elevenlabs.adapter";
import * as soniox from "@/app/infrastructure/tts/soniox.adapter";
import type { ListVoicesResultDto } from "../dtos/tts.dto";

export async function listVoices(
  provider: string,
): Promise<ListVoicesResultDto | null> {
  const account = await getProviderKeyByProvider(provider);
  if (!account) return null;

  if (account.provider === "elevenlabs") {
    const voices = await elevenlabs.listVoices(account.apiKey);
    return { voices, voiceModels: voices, languages: [] };
  }

  if (account.provider === "soniox") {
    const [voices, languages] = await Promise.all([
      soniox.listVoices(account.apiKey),
      soniox.listLanguages(account.apiKey),
    ]);
    return { voices, voiceModels: voices, languages };
  }

  throw new Error("unsupported provider");
}
