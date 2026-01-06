import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

// If you built your own auth routes, you should be setting a cookie.
// This reads a typical cookie name; update if yours differs.
function getAccessTokenFromCookies() {
  const jar = cookies();
  return (
    jar.get("sb-access-token")?.value ||
    jar.get("access_token")?.value ||
    jar.get("supabase_access_token")?.value ||
    null
  );
}

function range(min: number, max: number) {
  const out: number[] = [];
  for (let i = min; i <= max; i++) out.push(i);
  return out;
}

function buildPinsEligibleAndDown(r1: number | null, r2: number | null, r3: number | null, frameNumber: number) {
  // Pins are 1..10 each rack; you said “assume they fall in order”.
  // For frames 1-9:
  // - Strike ends frame (r1=10)
  // - Spare in two ends frame (r1+r2=10)
  // - Else r3 allowed only up to remaining
  //
  // For 10th:
  // - If strike on r1 => reset rack for r2
  // - If spare in two (r1+r2=10) => reset rack for r3
  // - Otherwise r3 only remaining

  const rolls: Array<{
    roll_number: 1 | 2 | 3;
    eligible: number[];
    down: number[];
  }> = [];

  const takeFirstN = (arr: number[], n: number) => arr.slice(0, Math.max(0, Math.min(n, arr.length)));

  // helper for a single rack sequence
  const applyOnRack = (rackPins: number[], a: number | null, b: number | null, c: number | null) => {
    let remaining = [...rackPins];

    // r1
    if (a !== null) {
      const down1 = takeFirstN(remaining, a);
      rolls.push({ roll_number: 1, eligible: [...rackPins], down: down1 });
      remaining = remaining.slice(down1.length);
    } else {
      return;
    }

    // r2
    if (b !== null) {
      const down2 = takeFirstN(remaining, b);
      rolls.push({ roll_number: 2, eligible: [...remaining], down: down2 });
      remaining = remaining.slice(down2.length);
    } else {
      return;
    }

    // r3
    if (c !== null) {
      const down3 = takeFirstN(remaining, c);
      rolls.push({ roll_number: 3, eligible: [...remaining], down: down3 });
    }
  };

  // Frames 1-9 are one rack only
  if (frameNumber < 10) {
    const rack = range(1, 10);
    if (r1 === null) return rolls;

    if (r1 === 10) {
      rolls.push({ roll_number: 1, eligible: rack, down: rack });
      return rolls;
    }

    if (r2 === null) {
      const down1 = rack.slice(0, Math.max(0, Math.min(r1, 10)));
      rolls.push({ roll_number: 1, eligible: rack, down: down1 });
      return rolls;
    }

    // eligible for roll2 is remaining after r1
    const eligible2 = rack.slice(Math.min(r1, 10));
    const down1 = rack.slice(0, Math.min(r1, 10));
    const down2 = eligible2.slice(0, Math.min(r2, eligible2.length));

    rolls.push({ roll_number: 1, eligible: rack, down: down1 });
    rolls.push({ roll_number: 2, eligible: eligible2, down: down2 });

    if (r1 + r2 === 10) return rolls; // spare-in-2 ends

    if (r3 !== null) {
      const eligible3 = eligible2.slice(down2.length);
      const down3 = eligible3.slice(0, Math.min(r3, eligible3.length));
      rolls.push({ roll_number: 3, eligible: eligible3, down: down3 });
    }
    return rolls;
  }

  // 10th frame: possible rack resets
  const rack = range(1, 10);
  if (r1 === null) return rolls;

  // roll1 always uses full rack
  const down1 = rack.slice(0, Math.min(r1, 10));
  rolls.push({ roll_number: 1, eligible: rack, down: down1 });

  if (r2 === null) return rolls;

  if (r1 === 10) {
    // reset for roll2
    const down2 = rack.slice(0, Math.min(r2, 10));
    rolls.push({ roll_number: 2, eligible: rack, down: down2 });

    if (r3 === null) return rolls;

    if (r2 === 10) {
      // reset again for roll3
      const down3 = rack.slice(0, Math.min(r3, 10));
      rolls.push({ roll_number: 3, eligible: rack, down: down3 });
      return rolls;
    }

    // remaining from roll2 rack
    const eligible3 = rack.slice(Math.min(r2, 10));
    const down3 = eligible3.slice(0, Math.min(r3, eligible3.length));
    rolls.push({ roll_number: 3, eligible: eligible3, down: down3 });
    return rolls;
  }

  // r1 not strike
  const eligible2 = rack.slice(Math.min(r1, 10));
  const down2 = eligible2.slice(0, Math.min(r2, eligible2.length));
  // overwrite roll2 with correct eligible (we already inserted roll2 above? no, only roll1 so far)
  rolls[0] = { roll_number: 1, eligible: rack, down: down1 };
  rolls.push({ roll_number: 2, eligible: eligible2, down: down2 });

  if (r3 === null) return rolls;

  if (r1 + r2 === 10) {
    // spare-in-2 => reset rack for roll3
    const down3 = rack.slice(0, Math.min(r3, 10));
    rolls.push({ roll_number: 3, eligible: rack, down: down3 });
    return rolls;
  }

  const eligible3 = eligible2.slice(down2.length);
  const down3 = eligible3.slice(0, Math.min(r3, eligible3.length));
  rolls.push({ roll_number: 3, eligible: eligible3, down: down3 });
  return rolls;
}

export async function POST(req: Request) {
  try {
    const token = getAccessTokenFromCookies();
    if (!token) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const body = await req.json();
    const {
      dev_game_id,
      frame_number,
      lane,
      r1,
      r2,
      r3,
      r1_mark,
      r2_mark,
      r3_mark
    } = body ?? {};

    if (!dev_game_id || !frame_number) {
      return NextResponse.json({ error: "Missing dev_game_id or frame_number" }, { status: 400 });
    }

    const sb = supabaseAdmin();

    // Identify user from token
    const { data: userRes, error: userErr } = await sb.auth.getUser(token);
    if (userErr || !userRes?.user?.id) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    const user_id = userRes.user.id;

    // Ensure a dev_game row exists for this user/game (minimal)
    // dev_games columns assumed: id (uuid/text), user_id, created_at, date, location, game_type, game_number
    // If your schema differs, adjust accordingly.
    await sb
      .from("dev_games")
      .upsert(
        [{ game_id: dev_game_id, user_id }],
        { onConflict: "game_id" }
      );

    // Find or create frame row
    // dev_frames columns assumed: frame_id (uuid), game_id, frame_number, lane, created_at
    // We'll delete old frame+rolls for this frame_number so edits don't leave stale rows.
    const { data: oldFrames } = await sb
      .from("dev_frames")
      .select("frame_id")
      .eq("game_id", dev_game_id)
      .eq("frame_number", frame_number);

    const oldFrameIds = (oldFrames ?? []).map((x: any) => x.frame_id);

    if (oldFrameIds.length > 0) {
      await sb.from("dev_rolls").delete().in("frame_id", oldFrameIds);
      await sb.from("dev_frames").delete().in("frame_id", oldFrameIds);
    }

    // If everything is null, we treat this as “delete/reset only”
    const allNull = r1 == null && r2 == null && r3 == null && lane == null && r1_mark == null && r2_mark == null && r3_mark == null;
    if (allNull) {
      return NextResponse.json({ ok: true, deleted: true });
    }

    // Insert new frame
    const { data: frameIns, error: frameErr } = await sb
      .from("dev_frames")
      .insert([{ game_id: dev_game_id, frame_number, lane: lane ?? null }])
      .select("frame_id")
      .single();

    if (frameErr) throw frameErr;

    const frame_id = (frameIns as any).frame_id;

    // Build rolls
    const rolls = buildPinsEligibleAndDown(
      r1 ?? null,
      r2 ?? null,
      r3 ?? null,
      Number(frame_number)
    );

    // Attach marks
    const markByRoll: Record<number, string | null> = {
      1: r1_mark ?? null,
      2: r2_mark ?? null,
      3: r3_mark ?? null
    };

    const toInsert = rolls.map((x) => ({
      frame_id,
      roll_number: x.roll_number,
      pins_eligible: x.eligible,
      pins_knocked_down: x.down,
      chop_split: markByRoll[x.roll_number] // column name assumed
    }));

    if (toInsert.length > 0) {
      const { error: rollErr } = await sb.from("dev_rolls").insert(toInsert);
      if (rollErr) throw rollErr;
    }

    return NextResponse.json({ ok: true, frame_id, rolls_inserted: toInsert.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}