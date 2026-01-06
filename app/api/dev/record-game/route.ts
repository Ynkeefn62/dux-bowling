import { NextResponse } from "next/server";

type ChopSplit = "Chop" | "Split" | null;

type FramePayload = {
  frameNumber: number; // 1..10
  laneNumber: number | null;
  rolls: Array<{
    rollNumber: 1 | 2 | 3;
    pinsKnocked: number | null; // 0..10 (null if not entered)
    chopSplit: ChopSplit;
  }>;
};

type Body = {
  // auth/me should provide these
  user: {
    id: string; // supabase auth user id (uuid)
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
  };

  // game meta from page cookies/inputs
  game: {
    gameId: string; // uuid from your cookie
    playedAtISO: string; // date string or datetime string; we'll coerce
    locationName: string; // must match dev_alleys.name seeded values
    eventTypeName: "Scrimmage" | "League" | "Tournament";
    gameTypeName: string; // e.g. "Traditional Duckpin"
    gameNumber: number; // 1..10
  };

  // we send one frame at a time on Confirm, OR all frames on Submit Score
  frames: FramePayload[];
};

const PIN_SET = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

// Minimal PostgREST helper (no supabase-js needed)
async function sb(path: string, init: RequestInit) {
  const url = mustEnv("SUPABASE_URL").replace(/\/$/, "");
  const key = mustEnv("SUPABASE_SERVICE_ROLE_KEY");

  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {})
    },
    cache: "no-store"
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!res.ok) {
    return { ok: false as const, status: res.status, json };
  }
  return { ok: true as const, status: res.status, json };
}

// Figure out pins_eligible / pins_knocked arrays using your rule.
function buildRollRowsForFrame(frame: FramePayload) {
  const rows: Array<{
    roll_number: 1 | 2 | 3;
    pins_eligible: number[];
    pins_knocked: number[];
    chop_split: "Chop" | "Split" | null;
  }> = [];

  let eligible = [...PIN_SET];

  const r1 = frame.rolls.find(r => r.rollNumber === 1)?.pinsKnocked;
  const r2 = frame.rolls.find(r => r.rollNumber === 2)?.pinsKnocked;
  const r3 = frame.rolls.find(r => r.rollNumber === 3)?.pinsKnocked;

  const r1cs = frame.rolls.find(r => r.rollNumber === 1)?.chopSplit ?? null;
  const r2cs = frame.rolls.find(r => r.rollNumber === 2)?.chopSplit ?? null;
  const r3cs = frame.rolls.find(r => r.rollNumber === 3)?.chopSplit ?? null;

  // helper to push one roll
  function pushRoll(rollNumber: 1 | 2 | 3, pinsKnocked: number | null, chopSplit: ChopSplit) {
    if (pinsKnocked === null) return;

    const knockedCount = Math.max(0, Math.min(pinsKnocked, eligible.length));
    const knocked = eligible.slice(0, knockedCount);
    const pinsEligibleThisRoll = [...eligible];

    // remove knocked pins from eligible
    eligible = eligible.slice(knockedCount);

    rows.push({
      roll_number: rollNumber,
      pins_eligible: pinsEligibleThisRoll,
      pins_knocked: knocked,
      chop_split: chopSplit
    });
  }

  // Frames 1-9: rack never resets inside a frame.
  if (frame.frameNumber < 10) {
    pushRoll(1, r1, r1cs);
    pushRoll(2, r2, r2cs);
    pushRoll(3, r3, r3cs);
    return rows;
  }

  // 10th frame: rack reset rules
  // Rule set you requested:
  // - Roll1 normal.
  // - Roll2: if roll1 strike => fresh rack (eligible reset to 1..10), else remaining.
  // - Roll3:
  //   - If roll1 strike:
  //        - if roll2 strike => fresh rack again
  //        - else remaining from roll2 rack
  //   - If roll1 not strike:
  //        - if roll1+roll2 == 10 (spare-in-2) => fresh rack for roll3
  //        - else remaining pins
  //
  // NOTE: If they "get to 10 on roll3", there is NO extra roll (we only store 3).
  eligible = [...PIN_SET];
  pushRoll(1, r1, r1cs);

  // before roll2
  if (r1 === 10) eligible = [...PIN_SET];
  pushRoll(2, r2, r2cs);

  // before roll3
  if (r1 === 10) {
    if (r2 === 10) eligible = [...PIN_SET];
    // else eligible already remaining from roll2 rack
  } else {
    if (r1 !== null && r2 !== null && r1 + r2 === 10) {
      eligible = [...PIN_SET];
    }
    // else eligible already remaining
  }

  pushRoll(3, r3, r3cs);

  return rows;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    // Basic "logged in" requirement: must have a user.id
    if (!body?.user?.id) {
      return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });
    }

    const userId = body.user.id;
    const email = body.user.email ?? null;

    // 1) Ensure dev_users exists (use auth user id as dev_user_id)
    //    Your dev_users table allows nulls, so we can store what we have.
    const upUser = await sb("dev_users?on_conflict=dev_user_id", {
      method: "POST",
      body: JSON.stringify([
        {
          dev_user_id: userId,
          email: email ?? `${userId}@unknown.local`,
          first_name: body.user.firstName ?? null,
          last_name: body.user.lastName ?? null,
          username: body.user.username ?? null,
          user_type: "Bowler"
        }
      ])
    });
    if (!upUser.ok) return NextResponse.json({ ok: false, step: "dev_users", detail: upUser.json }, { status: 500 });

    // 2) Ensure dev_bowlers exists for this user
    const upBowler = await sb("dev_bowlers?on_conflict=dev_user_id", {
      method: "POST",
      body: JSON.stringify([{ dev_user_id: userId }])
    });
    if (!upBowler.ok) return NextResponse.json({ ok: false, step: "dev_bowlers", detail: upBowler.json }, { status: 500 });

    // Grab dev_bowler_id (we used return=representation)
    const devBowlerId = upBowler.json?.[0]?.dev_bowler_id;
    if (!devBowlerId) {
      // Fallback fetch
      const fetchBowler = await sb(`dev_bowlers?dev_user_id=eq.${encodeURIComponent(userId)}&select=dev_bowler_id`, {
        method: "GET"
      });
      if (!fetchBowler.ok || !fetchBowler.json?.[0]?.dev_bowler_id) {
        return NextResponse.json({ ok: false, step: "dev_bowlers_fetch", detail: fetchBowler.json }, { status: 500 });
      }
    }

    // 3) Resolve alley id by name
    const alleyRes = await sb(
      `dev_alleys?name=eq.${encodeURIComponent(body.game.locationName)}&select=dev_alley_id`,
      { method: "GET" }
    );
    if (!alleyRes.ok) return NextResponse.json({ ok: false, step: "dev_alleys_lookup", detail: alleyRes.json }, { status: 500 });
    const devAlleyId = alleyRes.json?.[0]?.dev_alley_id ?? null;

    // 4) Resolve event type + game type IDs
    const evRes = await sb(
      `dev_event_types?name=eq.${encodeURIComponent(body.game.eventTypeName)}&select=dev_event_type_id`,
      { method: "GET" }
    );
    if (!evRes.ok) return NextResponse.json({ ok: false, step: "dev_event_types_lookup", detail: evRes.json }, { status: 500 });
    const devEventTypeId = evRes.json?.[0]?.dev_event_type_id ?? null;

    const gtRes = await sb(
      `dev_game_types?name=eq.${encodeURIComponent(body.game.gameTypeName)}&select=dev_game_type_id`,
      { method: "GET" }
    );
    if (!gtRes.ok) return NextResponse.json({ ok: false, step: "dev_game_types_lookup", detail: gtRes.json }, { status: 500 });
    const devGameTypeId = gtRes.json?.[0]?.dev_game_type_id ?? null;

    // 5) Upsert dev_games using your cookie UUID as dev_game_id
    //    (This works because dev_game_id is uuid PK in your schema.)
    const playedAt = body.game.playedAtISO?.length === 10 ? `${body.game.playedAtISO}T12:00:00Z` : body.game.playedAtISO;

    const upGame = await sb("dev_games?on_conflict=dev_game_id", {
      method: "POST",
      body: JSON.stringify([
        {
          dev_game_id: body.game.gameId,
          game_number: body.game.gameNumber,
          dev_bowler_id: devBowlerId,
          dev_alley_id: devAlleyId,
          played_at: playedAt,
          dev_game_type_id: devGameTypeId,
          dev_event_type_id: devEventTypeId
        }
      ])
    });
    if (!upGame.ok) return NextResponse.json({ ok: false, step: "dev_games", detail: upGame.json }, { status: 500 });

    // 6) Upsert frames + rolls
    // We will upsert each frame by unique (dev_game_id, frame_number)
    // then upsert rolls by unique (dev_frame_id, roll_number)
    for (const frame of body.frames) {
      // upsert frame
      const upFrame = await sb("dev_frames?on_conflict=dev_game_id,frame_number", {
        method: "POST",
        body: JSON.stringify([
          {
            dev_game_id: body.game.gameId,
            frame_number: frame.frameNumber,
            lane_number: frame.laneNumber ?? null
          }
        ])
      });
      if (!upFrame.ok) {
        return NextResponse.json({ ok: false, step: "dev_frames", frame: frame.frameNumber, detail: upFrame.json }, { status: 500 });
      }
      const devFrameId = upFrame.json?.[0]?.dev_frame_id;
      if (!devFrameId) {
        // fallback fetch
        const fRes = await sb(
          `dev_frames?dev_game_id=eq.${encodeURIComponent(body.game.gameId)}&frame_number=eq.${frame.frameNumber}&select=dev_frame_id`,
          { method: "GET" }
        );
        if (!fRes.ok || !fRes.json?.[0]?.dev_frame_id) {
          return NextResponse.json({ ok: false, step: "dev_frames_fetch", frame: frame.frameNumber, detail: fRes.json }, { status: 500 });
        }
      }

      const frameId = devFrameId ?? null;
      const rollRows = buildRollRowsForFrame(frame);

      // Upsert each roll
      for (const rr of rollRows) {
        const upRoll = await sb("dev_rolls?on_conflict=dev_frame_id,roll_number", {
          method: "POST",
          body: JSON.stringify([
            {
              dev_frame_id: frameId,
              roll_number: rr.roll_number,
              pins_eligible: rr.pins_eligible,
              pins_knocked: rr.pins_knocked,
              chop_split: rr.chop_split
            }
          ])
        });

        if (!upRoll.ok) {
          return NextResponse.json(
            { ok: false, step: "dev_rolls", frame: frame.frameNumber, roll: rr.roll_number, detail: upRoll.json },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}