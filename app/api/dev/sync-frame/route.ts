import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const ACCESS = "dux_access_token";

function supabaseFromDuxCookie() {
  const accessToken = cookies().get(ACCESS)?.value ?? null;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  // Important: inject the JWT so RLS/auth.uid() works
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: accessToken
        ? { headers: { Authorization: `Bearer ${accessToken}` } }
        : undefined,
      auth: { persistSession: false }
    }
  );

  return { supabase, accessToken };
}

type Mark = "C" | "S" | null;

type Body = {
  dev_game_id?: string | null;

  played_date: string; // YYYY-MM-DD
  location_name: string;
  event_type_name: "Scrimmage" | "League" | "Tournament";
  game_number: number;

  frame_number: number; // 1..10
  lane: number | null;

  r1: number | null;
  r2: number | null;
  r3: number | null;

  r1_mark: Mark;
  r2_mark: Mark;
  r3_mark: Mark;
};

function fullRack() {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
}
function takeFirstN(arr: number[], n: number) {
  return arr.slice(0, Math.max(0, Math.min(n, arr.length)));
}
function remainingAfter(arr: number[], knockedCount: number) {
  return arr.slice(Math.max(0, Math.min(knockedCount, arr.length)));
}
function toChopSplit(mark: Mark): "Chop" | "Split" | null {
  if (mark === "C") return "Chop";
  if (mark === "S") return "Split";
  return null;
}

function buildRolls(frameNumber: number, r1: number | null, r2: number | null, r3: number | null) {
  const rows: Array<{
    roll_number: 1 | 2 | 3;
    pins_eligible: number[];
    pins_knocked: number[];
  }> = [];

  if (r1 === null) return rows;

  // roll 1 always from full rack
  const eligible1 = fullRack();
  const knocked1 = takeFirstN(eligible1, r1);
  rows.push({ roll_number: 1, pins_eligible: eligible1, pins_knocked: knocked1 });

  // frames 1-9: strike ends
  if (frameNumber < 10 && r1 === 10) return rows;

  if (r2 === null) return rows;

  // roll2 eligible
  let eligible2: number[];
  if (frameNumber === 10 && r1 === 10) eligible2 = fullRack();
  else eligible2 = remainingAfter(eligible1, r1);

  const knocked2 = takeFirstN(eligible2, r2);
  rows.push({ roll_number: 2, pins_eligible: eligible2, pins_knocked: knocked2 });

  // frames 1-9: spare-in-2 ends
  if (frameNumber < 10 && r1 !== 10 && r1 + r2 === 10) return rows;

  if (frameNumber < 10) {
    if (r3 === null) return rows;
    const eligible3 = remainingAfter(eligible2, r2);
    const knocked3 = takeFirstN(eligible3, r3);
    rows.push({ roll_number: 3, pins_eligible: eligible3, pins_knocked: knocked3 });
    return rows;
  }

  // 10th roll3 logic
  if (r3 === null) return rows;

  let eligible3: number[];
  if (r1 === 10) {
    if (r2 === 10) eligible3 = fullRack();
    else eligible3 = remainingAfter(eligible2, r2);
  } else {
    if (r1 + r2 === 10) eligible3 = fullRack();
    else eligible3 = remainingAfter(eligible2, r2);
  }

  const knocked3 = takeFirstN(eligible3, r3);
  rows.push({ roll_number: 3, pins_eligible: eligible3, pins_knocked: knocked3 });

  return rows;
}

export async function POST(req: NextRequest) {
  let supabase, accessToken;
  try {
    ({ supabase, accessToken } = supabaseFromDuxCookie());
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server config error" }, { status: 500 });
  }

  // 1) Require login (must have your dux cookie)
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const user = userData.user;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    dev_game_id,
    played_date,
    location_name,
    event_type_name,
    game_number,
    frame_number,
    lane,
    r1,
    r2,
    r3,
    r1_mark,
    r2_mark,
    r3_mark
  } = body;

  if (!frame_number || frame_number < 1 || frame_number > 10) {
    return NextResponse.json({ error: "frame_number must be 1..10" }, { status: 400 });
  }

  // 2) Ensure dev_users + dev_bowlers exist
  const ensureUser = await supabase
    .from("dev_users")
    .upsert(
      {
        dev_user_id: user.id,
        email: user.email ?? null,
        user_type: "Bowler"
      } as any,
      { onConflict: "dev_user_id" }
    )
    .select("dev_user_id")
    .single();

  if (ensureUser.error) {
    return NextResponse.json({ error: `dev_users upsert failed: ${ensureUser.error.message}` }, { status: 400 });
  }

  const ensureBowler = await supabase
    .from("dev_bowlers")
    .upsert({ dev_user_id: user.id } as any, { onConflict: "dev_user_id" })
    .select("dev_bowler_id")
    .single();

  if (ensureBowler.error) {
    return NextResponse.json({ error: `dev_bowlers upsert failed: ${ensureBowler.error.message}` }, { status: 400 });
  }

  const dev_bowler_id = ensureBowler.data.dev_bowler_id as string;

  // 3) Resolve lookup IDs
  const alleyRes = await supabase.from("dev_alleys").select("dev_alley_id").eq("name", location_name).maybeSingle();
  const dev_alley_id = alleyRes.data?.dev_alley_id ?? null;

  const eventRes = await supabase
    .from("dev_event_types")
    .select("dev_event_type_id")
    .eq("name", event_type_name)
    .maybeSingle();
  const dev_event_type_id = eventRes.data?.dev_event_type_id ?? null;

  const gameTypeRes = await supabase
    .from("dev_game_types")
    .select("dev_game_type_id")
    .eq("name", "Traditional Duckpin")
    .maybeSingle();
  const dev_game_type_id = gameTypeRes.data?.dev_game_type_id ?? null;

  // 4) Ensure dev_game exists
  let effectiveDevGameId = (dev_game_id ?? "").trim();

  if (!effectiveDevGameId) {
    const played_at = new Date(`${played_date}T12:00:00.000Z`).toISOString();

    const gameIns = await supabase
      .from("dev_games")
      .insert({
        dev_bowler_id,
        dev_alley_id,
        dev_event_type_id,
        dev_game_type_id,
        game_number,
        played_at
      } as any)
      .select("dev_game_id")
      .single();

    if (gameIns.error) {
      return NextResponse.json({ error: `dev_games insert failed: ${gameIns.error.message}` }, { status: 400 });
    }

    effectiveDevGameId = gameIns.data.dev_game_id as string;
  }

  // 5) Reset frame case
  const isReset =
    lane === null &&
    r1 === null &&
    r2 === null &&
    r3 === null &&
    r1_mark === null &&
    r2_mark === null &&
    r3_mark === null;

  if (isReset) {
    const del = await supabase
      .from("dev_frames")
      .delete()
      .eq("dev_game_id", effectiveDevGameId)
      .eq("frame_number", frame_number);

    if (del.error) {
      return NextResponse.json({ error: `dev_frames delete failed: ${del.error.message}` }, { status: 400 });
    }

    const resp = NextResponse.json({ ok: true, dev_game_id: effectiveDevGameId });
    resp.cookies.set("dev_game_id", effectiveDevGameId, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
    return resp;
  }

  // 6) Upsert frame row
  const frameUp = await supabase
    .from("dev_frames")
    .upsert(
      { dev_game_id: effectiveDevGameId, frame_number, lane_number: lane } as any,
      { onConflict: "dev_game_id,frame_number" }
    )
    .select("dev_frame_id")
    .single();

  if (frameUp.error) {
    return NextResponse.json({ error: `dev_frames upsert failed: ${frameUp.error.message}` }, { status: 400 });
  }

  const dev_frame_id = frameUp.data.dev_frame_id as string;

  // 7) Rolls
  const computed = buildRolls(frame_number, r1, r2, r3);

  const keep = computed.map((x) => x.roll_number);
  if (keep.length === 0) {
    await supabase.from("dev_rolls").delete().eq("dev_frame_id", dev_frame_id);
  } else {
    await supabase
      .from("dev_rolls")
      .delete()
      .eq("dev_frame_id", dev_frame_id)
      .not("roll_number", "in", `(${keep.join(",")})`);
  }

  for (const rr of computed) {
    const mark = rr.roll_number === 1 ? r1_mark : rr.roll_number === 2 ? r2_mark : r3_mark;

    const up = await supabase.from("dev_rolls").upsert(
      {
        dev_frame_id,
        roll_number: rr.roll_number,
        pins_eligible: rr.pins_eligible,
        pins_knocked: rr.pins_knocked,
        chop_split: toChopSplit(mark)
      } as any,
      { onConflict: "dev_frame_id,roll_number" }
    );

    if (up.error) {
      return NextResponse.json(
        { error: `dev_rolls upsert failed (roll ${rr.roll_number}): ${up.error.message}` },
        { status: 400 }
      );
    }
  }

  const resp = NextResponse.json({ ok: true, dev_game_id: effectiveDevGameId });
  resp.cookies.set("dev_game_id", effectiveDevGameId, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return resp;
}