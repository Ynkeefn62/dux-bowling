import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function cookieOpts() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/"
  };
}

export async function POST() {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 });
  }

  const jar = await cookies();
  const refresh = jar.get("sb_refresh_token")?.value;

  if (!refresh) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`
    },
    body: JSON.stringify({ refresh_token: refresh })
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.error_description || data?.error || "Refresh failed", details: data },
      { status: res.status }
    );
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set("sb_access_token", data.access_token, {
    ...cookieOpts(),
    maxAge: data.expires_in
  });
  response.cookies.set("sb_refresh_token", data.refresh_token, {
    ...cookieOpts(),
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}