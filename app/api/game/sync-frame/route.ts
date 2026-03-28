import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminServer, supabaseAnonServer } from "@/app/lib/supabase/server";
import { getAccessToken } from "@/app/api/auth/_cookies";

type Mark = "C" | "S" | null;

type Body = {
  game_id?: string | null;
  played_date: string;
  location_name: string;
  event_type_name: "Scrimmage" | "League" | "Tournament";
  game_number: number;
  frame_number: number;
  lane?: number | null;
  r1: number | null;
  r2: number | null;
  r3: number | null;
  r1_mark: Mark;
  r2_mark: Mark;
  r3_mark: Mark;
};

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: NextRequest) {
  // 1) Auth
  const access = getAccessToken();
  if (!access) return bad("Not authenticated", 401);

  const anon = supabaseAnonServer();
  const { data: userData, error: userErr } = await anon.auth.getUser(access);
  if (userErr || !userData?.user?.id) return bad("Invalid session", 401);
  const userId = userData.user.id;

  const admin = supabaseAdminServer();

  // 2) Parse body
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return bad("Invalid JSON");
  }

  const {
    game_id: incomingGameId,
    played_date,
    location_name,
    event_type_name,
    game_number,
    frame_number,
    lane,
    r1, r2, r3,
    r1_mark, r2_mark, r3_mark,
  } = body;

  if (!frame_number || frame_number < 1 || frame_number > 10) {
    return bad("frame_number must be 1..10");
  }

  // 3) Ensure dux_bowler_profiles row exists
  const { data: existingProfile } = await admin
    .from("dux_bowler_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existingProfile) {
    const { data: profile } = await admin
      .from("profiles")
      .select("first_name, last_name, username")
      .eq("id", userId)
      .maybeSingle();

    const displayName = (profile as any)?.username
      ?? [(profile as any)?.first_name, (profile as any)?.last_name].filter(Boolean).join(" ")
      ?? null;

    await admin.from("dux_bowler_profiles").insert({ user_id: userId, display_name: displayName });
  }

  // 4) Resolve lookup IDs
  const [alleyRes, eventRes, gameTypeRes] = await Promise.all([
    admin.from("dux_alleys").select("id").eq("name", location_name).maybeSingle(),
    admin.from("dux_event_types").select("id").eq("name", event_type_name).maybeSingle(),
    admin.from("dux_game_types").select("id").eq("name", "Traditional Duckpin").maybeSingle(),
  ]);

  // 5) Ensure game row
  let effectiveGameId = (incomingGameId ?? "").trim();

  if (!effectiveGameId) {
    const playedAt = played_date?.length === 10
      ? `${played_date}T12:00:00.000Z`
      : (played_date ?? new Date().toISOString());

    const { data: newGame, error: gameErr } = await admin
      .from("dux_games")
      .insert({
        user_id:       userId,
        alley_id:      alleyRes.data?.id ?? null,
        event_type_id: eventRes.data?.id ?? null,
        game_type_id:  gameTypeRes.data?.id ?? null,
        game_number:   typeof game_number === "number" ? game_number : 1,
        played_at:     playedAt,
        status:        "in_progress",
      })
      .select("id")
      .single();

    if (gameErr || !newGame) {
      return NextResponse.json({ ok: false, error: `Failed to create game: ${gameErr?.message}` }, { status: 500 });
    }
    effectiveGameId = (newGame as any).id as string;
  }

  // 6) Handle reset (all nulls = clear frame)
  const isReset = lane == null && r1 == null && r2 == null && r3 == null
    && r1_mark == null && r2_mark == null && r3_mark == null;

  if (isReset) {
    await admin.from("dux_frames").delete()
      .eq("game_id", effectiveGameId)
      .eq("frame_number", frame_number);

    const res = NextResponse.json({ ok: true, game_id: effectiveGameId });
    res.cookies.set("dux_game_id", effectiveGameId, { httpOnly: false, sameSite: "lax", path: "/", maxAge: 86400 * 30 });
    return res;
  }

  // 7) Compute flags
  const isStrike = r1 === 10;
  const isSpare  = !isStrike && r1 !== null && r2 !== null && (r1 + r2 === 10);

  // 8) Upsert frame
  const { error: frameErr } = await admin
    .from("dux_frames")
    .upsert(
      {
        game_id:      effectiveGameId,
        frame_number,
        lane_number:  lane ?? null,
        r1: r1 ?? null,
        r2: r2 ?? null,
        r3: r3 ?? null,
        r1_mark: r1_mark ?? null,
        r2_mark: r2_mark ?? null,
        r3_mark: r3_mark ?? null,
        is_strike: isStrike,
        is_spare:  isSpare,
      },
      { onConflict: "game_id,frame_number" }
    );

  if (frameErr) {
    return NextResponse.json({ ok: false, error: `Frame upsert failed: ${frameErr.message}` }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, game_id: effectiveGameId });
  res.cookies.set("dux_game_id", effectiveGameId, { httpOnly: false, sameSite: "lax", path: "/", maxAge: 86400 * 30 });
  return res;
}
