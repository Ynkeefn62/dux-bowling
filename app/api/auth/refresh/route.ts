import { NextResponse } from "next/server";
import { authHeaders, getRefreshTokenFromCookies, getSupabaseAuthUrl, setSessionCookies } from "@/app/lib/authServer";

export async function POST() {
  const refresh_token = getRefreshTokenFromCookies();
  if (!refresh_token) return NextResponse.json({ error: "No refresh token" }, { status: 401 });

  const res = await fetch(getSupabaseAuthUrl("/token?grant_type=refresh_token"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token })
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: data?.error_description || "Refresh failed", details: data }, { status: 401 });
  }

  setSessionCookies(data.access_token, data.refresh_token);
  return NextResponse.json({ ok: true });
}