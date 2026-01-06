import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function assertEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
}

export function getSupabaseAuthUrl(path: string) {
  assertEnv();
  return `${SUPABASE_URL}/auth/v1${path}`;
}

export function authHeaders(extra?: Record<string, string>) {
  assertEnv();
  return {
    apikey: SUPABASE_ANON,
    "Content-Type": "application/json",
    ...extra
  };
}

export function setSessionCookies(access_token: string, refresh_token: string) {
  const jar = cookies();
  jar.set("sb_access", access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/"
  });
  jar.set("sb_refresh", refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/"
  });
}

export function clearSessionCookies() {
  const jar = cookies();
  jar.set("sb_access", "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 });
  jar.set("sb_refresh", "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 });
}

export function getAccessTokenFromCookies() {
  return cookies().get("sb_access")?.value ?? null;
}
export function getRefreshTokenFromCookies() {
  return cookies().get("sb_refresh")?.value ?? null;
}