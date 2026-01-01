import { NextResponse } from "next/server";
import { authHeaders, getTokensFromCookies, setAuthCookies, clearAuthCookies, SUPABASE_AUTH_BASE } from "../_helpers";

export async function POST() {
  const { refresh } = getTokensFromCookies();

  if (!refresh) {
    return NextResponse.json({ error: "No refresh token." }, { status: 401 });
  }

  const res = await fetch(`${SUPABASE_AUTH_BASE}/token?grant_type=refresh_token`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token: refresh })
  });

  const data = await res.json();

  if (!res.ok) {
    clearAuthCookies();
    return NextResponse.json({ error: data?.error_description || "Refresh failed." }, { status: 401 });
  }

  setAuthCookies({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in
  });

  return NextResponse.json({ ok: true });
}