import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

/**
 * Requires env vars:
 * - SUPABASE_URL
 * - SUPABASE_ANON_KEY
 *
 * This route runs "as the logged-in user" (RLS applies).
 */
function supabaseFromCookies() {
  const cookieStore = cookies();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        }
      }
    }
  );
}

type Mark = "C" | "S" | null;

type Body = {
  // will be created if missing
  dev_game_id?: string | null;

  // game meta
  played_date: string; // YYYY-MM-DD
  location_name: string; // matches dev_alleys.name
  event_type_name: "Scrimmage" | "League" | "Tournament"; // matches dev_event_types.name
  game_number: number;

  // frame payload
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

/**
 * Build roll rows for dev_rolls using your "pins fall in order" assumption.
 * Also enforces duckpin frame structure:
 * - Frames 1-9: strike ends in 1 roll; spare-in-2 ends in 2 rolls; else 3 rolls.
 * - Frame 10: always up to 3 rolls with rack reset rules:
 *    - If r1=10 -> roll2 gets full rack
 *    - If r1=10 and r2=10 -> roll3 full rack
 *    - If r1=10 and r2<10 -> roll3 only remaining from roll2 rack
 *    - If r1<10 and r1+r2=10 -> roll3 full rack
 *    - If r1<10 and r1+r2<10 -> roll3 only remaining
 */
function buildRolls(frameNumber: number, r1: number | null, r2: number | null, r3: number | null) {
  const rows: Array<{
    roll_number: 1 | 2 | 3;
    pins_eligible: number[];
    pins_knocked: number[];
  }> = [];

  if (r1 === null) return rows;

  // roll 1 always from full rack
  let eligible1 = fullRack();
  let knocked1 = takeFirstN(eligible1, r1);
  rows.push({ roll_number: 1, pins_eligible: eligible1, pins_knocked: knocked1 });

  // frames 1-9: strike ends frame immediately
  if (frameNumber < 10 && r1 === 10) return rows;

  if (r2 === null) return rows;

  // Determine eligible for roll2
  let eligible2: number[];
  if (frameNumber === 10 && r1 === 10) {
    // 10th strike => new rack on roll2
    eligible2 = fullRack();
  } else {
    // remaining from roll1
    eligible2 = remainingAfter(eligible1, r1);
  }
  let knocked2 = takeFirstN(eligible2, r2);
  rows.push({ roll_number: 2, pins_eligible: eligible2, pins_knocked: knocked2 });

  // frames 1-9: spare-in-2 ends frame
  if (frameNumber < 10 && r1 !== 10 && r1 + r2 === 10) return rows;

  if (frameNumber < 10) {
    if (r3 === null) return rows;
    // roll3 eligible = remaining after roll2 (no resets in frames 1-9)
    const eligible3 = remainingAfter(eligible2, r2);
    const knocked3 = takeFirstN(eligible3, r3);
    rows.push({ roll_number: 3, pins_eligible: eligible3, pins_knocked: knocked3 });
    return rows;
  }

  // 10th frame roll3 logic
  if (r3 === null) return rows;

  let eligible3: number[];

  if (r1 === 10) {
    // roll2 was from a full rack
    if (r2 === 10) {
      // strike again => reset for roll3
      eligible3 = fullRack();
    } else {
      // only remaining from roll2 rack
      eligible3 = remainingAfter(eligible2, r2);
    }
  } else {
    // r1 < 10
    if (r1 + r2 === 10) {
      // spare-in-2 => reset for roll3
      eligible3 = fullRack();
    } else {
      // only remaining from combined rolls 1+2
      eligible3 = remainingAfter(eligible2, r2);
    }
  }

  const knocked3 = takeFirstN(eligible3, r3);
  rows.push({ roll_number: 3, pins_eligible: eligible3, pins_knocked: knocked3 });
  return rows;
}

export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Missing SUPABASE_URL or SUPABASE_ANON_KEY" }, { status: 500 });
  }

  const supabase = supabaseFromCookies();

  // 1) Require login
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

  // 2) Ensure dev_users + dev_bowlers exist for this auth user
  // dev_users.dev_user_id should match auth.uid() = auth.users.id
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
    .upsert(
      { dev_user_id: user.id } as any,
      { onConflict: "dev_user_id" }
    )
    .select("dev_bowler_id")
    .single();

  if (ensureBowler.error) {
    return NextResponse.json({ error: `dev_bowlers upsert failed: ${ensureBowler.error.message}` }, { status: 400 });
  }

  const dev_bowler_id = ensureBowler.data.dev_bowler_id as string;

  // 3) Resolve lookup IDs
  // Alley
  const alleyRes = await supabase
    .from("dev_alleys")
    .select("dev_alley_id")
    .eq("name", location_name)
    .maybeSingle();

  const dev_alley_id = alleyRes.data?.dev_alley_id ?? null;

  // Event type
  const eventRes = await supabase
    .from("dev_event_types")
    .select("dev_event_type_id")
    .eq("name", event_type_name)
    .maybeSingle();

  const dev_event_type_id = eventRes.data?.dev_event_type_id ?? null;

  // Game type (always Traditional Duckpin for this page)
  const gameTypeRes = await supabase
    .from("dev_game_types")
    .select("dev_game_type_id")
    .eq("name", "Traditional Duckpin")
    .maybeSingle();

  const dev_game_type_id = gameTypeRes.data?.dev_game_type_id ?? null;

  // 4) Ensure dev_game_id exists (create if missing)
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

    // set cookie for future calls
    const res = NextResponse.json({ ok: true, dev_game_id: effectiveDevGameId });
    res.cookies.set("dev_game_id", effectiveDevGameId, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
    // We’ll continue below by returning later after we finish syncing frame.
    // To keep it simple, we’ll build final response at the end — but we also want cookie set.
    // So we’ll store this res and mutate it at the end.
    (res as any).__setCookie = true;
    // attach for later
    (res as any).__dev_game_id = effectiveDevGameId;
    // fallthrough by using this as base response
    // (we’ll replace it at the end)
  }

  // 5) Reset/delete frame case
  const isReset =
    lane === null &&
    r1 === null &&
    r2 === null &&
    r3 === null &&
    r1_mark === null &&
    r2_mark === null &&
    r3_mark === null;

  if (isReset) {
    // delete the frame row; rolls cascade delete
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
      {
        dev_game_id: effectiveDevGameId,
        frame_number,
        lane_number: lane
      } as any,
      { onConflict: "dev_game_id,frame_number" }
    )
    .select("dev_frame_id")
    .single();

  if (frameUp.error) {
    return NextResponse.json({ error: `dev_frames upsert failed: ${frameUp.error.message}` }, { status: 400 });
  }

  const dev_frame_id = frameUp.data.dev_frame_id as string;

  // 7) Build roll rows + delete stale rolls + upsert current ones
  const computed = buildRolls(frame_number, r1, r2, r3);

  // delete rolls not in computed set (prevents stale roll3 after edits)
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

    const up = await supabase
      .from("dev_rolls")
      .upsert(
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
      return NextResponse.json({ error: `dev_rolls upsert failed (roll ${rr.roll_number}): ${up.error.message}` }, { status: 400 });
    }
  }

  // Return + ensure dev_game_id cookie exists on client
  const resp = NextResponse.json({ ok: true, dev_game_id: effectiveDevGameId });
  resp.cookies.set("dev_game_id", effectiveDevGameId, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return resp;
}