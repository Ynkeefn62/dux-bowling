import { NextResponse } from "next/server";
import { authHeaders, getSupabaseAuthUrl, setSessionCookies } from "@/app/lib/authServer";

export async function POST(req: Request) {
  const { email, password, accountType } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const res = await fetch(getSupabaseAuthUrl("/signup"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email,
      password,
      data: { account_type: accountType ?? "bowler" } // stored in auth.users.raw_user_meta_data
    })
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: data?.msg || data?.error_description || "Signup failed", details: data }, { status: 400 });
  }

  // If email confirmations are OFF, you may get a session right away.
  if (data?.access_token && data?.refresh_token) {
    setSessionCookies(data.access_token, data.refresh_token);
  }

  return NextResponse.json({ ok: true, data });
}