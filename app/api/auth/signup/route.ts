import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: Request) {
  const { email, password, role } = await req.json().catch(() => ({}));

  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 });
  }
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  // Optional: include user "role" metadata (bowler/alley/employee) for later routing.
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`
    },
    body: JSON.stringify({
      email,
      password,
      data: { role: role ?? "bowler" }
    })
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.msg || data?.error_description || data?.error || "Signup failed", details: data },
      { status: res.status }
    );
  }

  // If email confirmations are ON, you may not get a session back immediately.
  // That’s OK—front-end can tell them to verify email.
  return NextResponse.json({ ok: true, data });
}