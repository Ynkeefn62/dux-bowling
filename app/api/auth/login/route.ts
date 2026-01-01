import { NextResponse } from "next/server";
import { authHeaders, setAuthCookies, SUPABASE_AUTH_BASE } from "../_helpers";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  // Password grant
  const res = await fetch(`${SUPABASE_AUTH_BASE}/token?grant_type=password`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.error_description || data?.msg || "Login failed." },
      { status: 400 }
    );
  }

  setAuthCookies({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in
  });

  return NextResponse.json({ ok: true });
}