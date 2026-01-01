import { NextResponse } from "next/server";
import { authHeaders, setAuthCookies, SUPABASE_AUTH_BASE } from "../_helpers";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  // Create account (email/password)
  const res = await fetch(`${SUPABASE_AUTH_BASE}/signup`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: data?.msg || data?.error_description || "Sign up failed." }, { status: 400 });
  }

  // If email confirmations are OFF, Supabase returns a session immediately.
  // If confirmations are ON, session may be null until email confirmed.
  const session = data?.session;

  if (session?.access_token && session?.refresh_token) {
    setAuthCookies({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in
    });
  }

  return NextResponse.json({
    ok: true,
    needsEmailConfirmation: !session,
    user: data?.user ? { id: data.user.id, email: data.user.email } : null
  });
}