import crypto from "node:crypto";

function secret(): string {
  const s = process.env.SYSTEM_SECRET;
  if (!s) throw new Error("SYSTEM_SECRET is not set");
  return s;
}

export function verifySystemSecret(input: string): boolean {
  const s = secret();
  const a = Buffer.from(input);
  const b = Buffer.from(s);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** True when the request carries `Authorization: Bearer <SYSTEM_SECRET>`. */
export function hasBearerSecret(req: Request): boolean {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return false;
  return verifySystemSecret(match[1].trim());
}

/** All API routes authorize purely via bearer token now (no cookies). */
export function isAuthorized(req: Request): boolean {
  return hasBearerSecret(req);
}
