import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminServer, supabaseAnonServer } from "@/app/lib/supabase/server";
import { getAccessToken } from "@/app/api/auth/_cookies";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function GET() {
  const access = getAccessToken();
  if (!access) return bad("Not authenticated", 401);

  const anon = supabaseAnonServer();
  const { data: u } = await anon.auth.getUser(access);
  if (!u?.user?.id) return bad("Invalid session", 401);

  const admin = supabaseAdminServer();
  const { data: bp } = await admin
    .from("dux_bowler_profiles")
    .select("*")
    .eq("user_id", u.user.id)
    .maybeSingle();

  return NextResponse.json({ ok: true, bowlerProfile: bp ?? null });
}

export async function POST(req: NextRequest) {
  const access = getAccessToken();
  if (!access) return bad("Not authenticated", 401);

  const anon = supabaseAnonServer();
  const { data: u } = await anon.auth.getUser(access);
  if (!u?.user?.id) return bad("Invalid session", 401);

  const body = await req.json().catch(() => null);
  if (!body) return bad("Invalid JSON");

  const admin = supabaseAdminServer();
  const userId = u.user.id;

  // Update profiles table (names, username)
  const profileUpdates: Record<string, any> = {};
  if (body.first_name !== undefined) profileUpdates.first_name = body.first_name;
  if (body.last_name  !== undefined) profileUpdates.last_name  = body.last_name;
  if (body.username   !== undefined) {
    // Check uniqueness
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("username", body.username)
      .neq("id", userId)
      .maybeSingle();
    if (existing) return bad("That username is already taken.", 409);
    profileUpdates.username = body.username;
  }

  if (Object.keys(profileUpdates).length > 0) {
    await admin.from("profiles").update(profileUpdates).eq("id", userId);
  }

  // Upsert dux_bowler_profiles
  const bpUpdates: Record<string, any> = { user_id: userId };
  if (body.display_name !== undefined) bpUpdates.display_name = body.display_name;
  if (body.handedness   !== undefined) bpUpdates.handedness   = body.handedness;
  if (body.home_alley   !== undefined) bpUpdates.home_alley   = body.home_alley;
  if (body.ndbc_id      !== undefined) bpUpdates.ndbc_id      = body.ndbc_id;

  const { error } = await admin
    .from("dux_bowler_profiles")
    .upsert(bpUpdates, { onConflict: "user_id" });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
