import { cookies } from "next/headers";

const ACCESS = "dux_access_token";
const REFRESH = "dux_refresh_token";

export function setAuthCookies(access_token: string, refresh_token: string) {
  const jar = cookies();

  // Access token: short-lived
  jar.set(ACCESS, access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 // 1 hour
  });

  // Refresh token: longer-lived
  jar.set(REFRESH, refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30 // 30 days
  });
}

export function getAuthCookies() {
  const jar = cookies();
  return {
    accessToken: jar.get(ACCESS)?.value ?? null,
    refreshToken: jar.get(REFRESH)?.value ?? null
  };
}

export function clearAuthCookies() {
  const jar = cookies();
  jar.set(ACCESS, "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 });
  jar.set(REFRESH, "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 });
}

export function getAccessToken() {
  return cookies().get(ACCESS)?.value ?? null;
}

export function getRefreshToken() {
  return cookies().get(REFRESH)?.value ?? null;
}