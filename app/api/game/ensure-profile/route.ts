import { NextResponse } from "next/server";
import { supabaseAdminServer, supabaseAnonServer } from "@/app/lib/supabase/server";
import { getAccessToken } from "@/app/api/auth/_cookies";

export async function POST() {
  const access = getAccessToken();
  if (!access) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const anon = supabaseAnonServer();
  const { data: userData, error: userErr } = await anon.auth.getUser(access);
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const userId = userData.user.id;
  const admin  = supabaseAdminServer();

  // Check if bowler profile already exists
  const { data: existing } = await admin
    .from("dux_bowler_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    // Pull name from profiles table
    const { data: profile } = await admin
      .from("profiles")
      .select("first_name, last_name, username")
      .eq("id", userId)
      .maybeSingle();

    const displayName = (profile as any)?.username
      ?? [(profile as any)?.first_name, (profile as any)?.last_name].filter(Boolean).join(" ")
      ?? null;

    const { error: insertErr } = await admin
      .from("dux_bowler_profiles")
      .insert({ user_id: userId, display_name: displayName });

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
