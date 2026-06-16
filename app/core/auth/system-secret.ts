import crypto from "node:crypto";

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 8;

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

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function issueAccessToken(now = Date.now()): string {
  const iat = Math.floor(now / 1000);
  const payload = base64UrlEncode(
    JSON.stringify({ iat, exp: iat + ACCESS_TOKEN_TTL_SECONDS }),
  );
  return `${payload}.${sign(payload)}`;
}

function verifyAccessToken(token: string, now = Date.now()): boolean {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return false;
  if (!safeEqual(signature, sign(payload))) return false;

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as { exp?: unknown };
    return typeof parsed.exp === "number" && parsed.exp > Math.floor(now / 1000);
  } catch {
    return false;
  }
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

export function isAuthorized(req: Request): boolean {
  const token = getBearerToken(req);
  return token ? verifyAccessToken(token) : false;
}
