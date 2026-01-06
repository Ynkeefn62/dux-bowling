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

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));

  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 });
  }
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.error_description || data?.error || "Login failed", details: data },
      { status: res.status }
    );
  }

  const response = NextResponse.json({ ok: true });

  // Store tokens in httpOnly cookies
  response.cookies.set("sb_access_token", data.access_token, {
    ...cookieOpts(),
    maxAge: data.expires_in
  });
  response.cookies.set("sb_refresh_token", data.refresh_token, {
    ...cookieOpts(),
    // refresh token typically longer-lived; give it 30 days here
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}