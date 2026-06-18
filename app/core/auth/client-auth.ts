"use client";

const KEY = "meddler_access_token";

function isInvalidOrExpired(token: string): boolean {
  if (typeof window === "undefined") return true;

  try {
    const [payload] = token.split(".");
    if (!payload) return true;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const parsed = JSON.parse(window.atob(padded)) as {
      exp?: unknown;
      iat?: unknown;
    };
    if (typeof parsed.exp === "number") {
      return parsed.exp <= Math.floor(Date.now() / 1000);
    }
    return typeof parsed.iat !== "number";
  } catch {
    return true;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(KEY);
  if (!token) return null;
  if (isInvalidOrExpired(token)) {
    clearAccessToken();
    return null;
  }
  return token;
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function hasAccessToken(): boolean {
  return !!getAccessToken();
}

export async function authFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = getAccessToken();
  if (!token && typeof window !== "undefined") {
    if (window.location.pathname !== "/admin/login") {
      window.location.replace("/admin/login");
    }
    return new Response(null, {
      status: 401,
      statusText: "Unauthorized",
    });
  }

  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(input, { ...init, headers });
  if (response.status === 401 && typeof window !== "undefined") {
    clearAccessToken();
    if (window.location.pathname !== "/admin/login") {
      window.location.replace("/admin/login");
    }
  }

  return response;
}
