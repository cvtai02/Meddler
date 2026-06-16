import { issueAccessToken, verifySystemSecret } from "@/app/core/auth/system-secret";

export function loginWithSystemSecret(input: string): string | null {
  return verifySystemSecret(input) ? issueAccessToken() : null;
}
