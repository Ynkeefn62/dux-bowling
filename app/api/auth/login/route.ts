import { NextResponse } from "next/server";
import { authHeaders, getSupabaseAuthUrl, setSessionCookies } from "@/app/lib/authServer";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const res = await fetch(getSupabaseAuthUrl("/token?grant_type=password"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: data?.error_description || "Login failed", details: data }, { status: 400 });
  }

  setSessionCookies(data.access_token, data.refresh_token);
  return NextResponse.json({ ok: true });
}