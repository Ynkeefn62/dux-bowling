import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !anonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function authHeaders() {
  return {
    "Content-Type": "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`
  };
}

export function setAuthCookies(params: { access_token: string; refresh_token: string; expires_in: number }) {
  const cookieStore = cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set("sb-access-token", params.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: params.expires_in // seconds
  });

  // Refresh token is long-lived; keep it ~30 days (adjust if you want)
  cookieStore.set("sb-refresh-token", params.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearAuthCookies() {
  const cookieStore = cookies();
  cookieStore.set("sb-access-token", "", { path: "/", expires: new Date(0) });
  cookieStore.set("sb-refresh-token", "", { path: "/", expires: new Date(0) });
}

export function getTokensFromCookies() {
  const cookieStore = cookies();
  const access = cookieStore.get("sb-access-token")?.value ?? null;
  const refresh = cookieStore.get("sb-refresh-token")?.value ?? null;
  return { access, refresh };
}

export const SUPABASE_AUTH_BASE = `${supabaseUrl}/auth/v1`;