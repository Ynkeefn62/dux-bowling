import { NextResponse } from "next/server";
import { supabaseAnonServer, supabaseAdminServer } from "@/app/lib/supabase/server";
import { getAccessToken } from "../_cookies";

export async function GET() {
  try {
    const access = getAccessToken();
    if (!access) return NextResponse.json({ ok: true, user: null, profile: null });

    const anon = supabaseAnonServer();
    const { data: u, error: uErr } = await anon.auth.getUser(access);

    if (uErr || !u.user) {
      return NextResponse.json({ ok: true, user: null, profile: null });
    }

    const admin = supabaseAdminServer();
    const { data: profile } = await admin.from("profiles").select("*").eq("id", u.user.id).maybeSingle();

    return NextResponse.json({
      ok: true,
      user: { id: u.user.id, email: u.user.email },
      profile: profile ?? null
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}