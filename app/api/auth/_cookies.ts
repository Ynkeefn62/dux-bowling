import { cookies } from "next/headers";

const ACCESS  = "dux_access_token";
const REFRESH = "dux_refresh_token";
const isProd  = process.env.NODE_ENV === "production";

// Access token: 7 days (down from 1 hour — we silent-refresh proactively client-side)
// Refresh token: 30 days
// "Remember me" extends both tokens; without it, session is browser-session only.

export function setAuthCookies(
  access_token: string,
  refresh_token: string,
  remember = true
) {
  const jar = cookies();

  jar.set(ACCESS, access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: remember ? 60 * 60 * 24 * 7 : undefined, // 7 days or session
  });

  jar.set(REFRESH, refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: remember ? 60 * 60 * 24 * 30 : undefined, // 30 days or session
  });
}

export function getAuthCookies() {
  const jar = cookies();
  return {
    accessToken:  jar.get(ACCESS)?.value  ?? null,
    refreshToken: jar.get(REFRESH)?.value ?? null,
  };
}

export function clearAuthCookies() {
  const jar = cookies();
  jar.set(ACCESS,  "", { httpOnly: true, sameSite: "lax", secure: isProd, path: "/", maxAge: 0 });
  jar.set(REFRESH, "", { httpOnly: true, sameSite: "lax", secure: isProd, path: "/", maxAge: 0 });
}

export function getAccessToken()  { return cookies().get(ACCESS)?.value  ?? null; }
export function getRefreshToken() { return cookies().get(REFRESH)?.value ?? null; }
