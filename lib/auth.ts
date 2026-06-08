import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "meddler_session";
const MAX_AGE = 60 * 60 * 8; // 8h

function secret(): string {
  const s = process.env.SYSTEM_SECRET;
  if (!s) throw new Error("SYSTEM_SECRET is not set");
  return s;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function makeToken(): string {
  const payload = `${Date.now()}.${crypto.randomBytes(12).toString("base64url")}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [ts, nonce, mac] = parts;
  const expected = sign(`${ts}.${nonce}`);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;
  const age = Date.now() - Number(ts);
  return Number.isFinite(age) && age >= 0 && age < MAX_AGE * 1000;
}

export function verifySystemSecret(input: string): boolean {
  const s = secret();
  const a = Buffer.from(input);
  const b = Buffer.from(s);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function isLoggedIn(): Promise<boolean> {
  const c = await cookies();
  return verifyToken(c.get(COOKIE)?.value);
}

export async function setSession() {
  const c = await cookies();
  c.set(COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  const c = await cookies();
  c.delete(COOKIE);
}

export const SESSION_COOKIE = COOKIE;
