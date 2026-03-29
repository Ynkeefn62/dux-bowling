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
    .select("avatar_config")
    .eq("user_id", u.user.id)
    .maybeSingle();

  return NextResponse.json({ ok: true, avatar: (bp as any)?.avatar_config ?? null });
}

export async function POST(req: NextRequest) {
  const access = getAccessToken();
  if (!access) return bad("Not authenticated", 401);

  const anon = supabaseAnonServer();
  const { data: u } = await anon.auth.getUser(access);
  if (!u?.user?.id) return bad("Invalid session", 401);

  const body = await req.json().catch(() => null);
  if (!body?.avatar) return bad("avatar is required");

  const admin = supabaseAdminServer();
  const { error } = await admin
    .from("dux_bowler_profiles")
    .upsert(
      { user_id: u.user.id, avatar_config: body.avatar },
      { onConflict: "user_id" }
    );

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
