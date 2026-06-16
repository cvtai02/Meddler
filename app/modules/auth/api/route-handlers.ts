import {
  apiError,
  apiJson,
  corsOptions,
  readJson,
} from "@/app/core/api/responses";
import type { LoginRequestDto, LoginResponseDto } from "../dtos/login.dto";
import { loginWithSystemSecret } from "../usecases/login-with-system-secret";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsOptions();
}

export async function POST(req: Request) {
  const body = (await readJson(req)) as LoginRequestDto | null;
  const systemSecret = String(body?.systemSecret || "");
  if (!systemSecret) {
    return apiError("BAD_REQUEST", "systemSecret required", 400);
  }

  const accessToken = loginWithSystemSecret(systemSecret);
  if (!accessToken) {
    return apiError("UNAUTHORIZED", "Invalid system secret", 401);
  }

  return apiJson<LoginResponseDto>({ accessToken });
}
