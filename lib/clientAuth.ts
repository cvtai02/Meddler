"use client";

// Browser-side auth. The system secret is stored in localStorage and sent as a
// bearer token on every API call. No cookies are used.

const KEY = "meddler_secret";

export function getSecret(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

export function setSecret(secret: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, secret);
}

export function clearSecret(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function hasSecret(): boolean {
  return !!getSecret();
}

/**
 * Like fetch(), but automatically attaches `Authorization: Bearer <secret>`
 * from localStorage. Use for every call to the protected API.
 */
export async function authFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const secret = getSecret();
  const headers = new Headers(init.headers);
  if (secret) headers.set("Authorization", `Bearer ${secret}`);
  return fetch(input, { ...init, headers });
}
