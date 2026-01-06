import { NextResponse } from "next/server";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

// Minimal PostgREST helper (server-only)
async function sb(path: string, init: RequestInit) {
  const url = mustEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
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

  if (!res.ok) return { ok: false as const, status: res.status, json };
  return { ok: true as const, status: res.status, json };
}

type RollRow = {
  roll_number: number;
  pins_knocked: number[] | null;
};

type FrameRow = {
  frame_number: number;
  dev_frame_id: string;
};

function rollPins(r: RollRow | undefined) {
  const arr = r?.pins_knocked ?? [];
  return Array.isArray(arr) ? arr.length : 0;
}

function computeDuckpinScoreFromFrames(frames: Array<{ frame_number: number; r1: number; r2: number; r3: number }>) {
  // Expect frames 1..10, missing frames treated as 0s (but your flow should only compute completed games)
  const f = Array.from({ length: 10 }, (_, i) => {
    const row = frames.find(x => x.frame_number === i + 1);
    return row ?? { frame_number: i + 1, r1: 0, r2: 0, r3: 0 };
  });

  // Build roll stream for frames 1-9 only (for bonuses)
  const rollStream: number[] = [];
  for (let i = 0; i < 9; i++) {
    const fr = f[i];
    if (fr.r1 === 10) {
      rollStream.push(10);
      continue;
    }
    const two = fr.r1 + fr.r2;
    if (two === 10) {
      rollStream.push(fr.r1, fr.r2);
      continue;
    }
    rollStream.push(fr.r1, fr.r2, fr.r3);
  }

  // Add 10th frame rolls (no bonus beyond)
  rollStream.push(f[9].r1, f[9].r2, f[9].r3);

  let total = 0;
  let rollIndex = 0;

  for (let i = 0; i < 10; i++) {
    const fr = f[i];
    const frameNum = i + 1;

    if (frameNum === 10) {
      total += fr.r1 + fr.r2 + fr.r3;
      break;
    }

    if (fr.r1 === 10) {
      const b1 = rollStream[rollIndex + 1] ?? 0;
      const b2 = rollStream[rollIndex + 2] ?? 0;
      total += 10 + b1 + b2;
      rollIndex += 1;
      continue;
    }

    const two = fr.r1 + fr.r2;
    if (two === 10) {
      const bonus = rollStream[rollIndex + 2] ?? 0;
      total += 10 + bonus;
      rollIndex += 2;
      continue;
    }

    total += fr.r1 + fr.r2 + fr.r3;
    rollIndex += 3;
  }

  return total;
}

function mean(nums: number[]) {
  if (nums.length === 0) return 0;
  let s = 0;
  for (const n of nums) s += n;
  return s / nums.length;
}

function median(nums: number[]) {
  if (nums.length === 0) return 0;
  const a = [...nums].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  if (a.length % 2 === 1) return a[mid];
  return (a[mid - 1] + a[mid]) / 2;
}

function stddev(nums: number[]) {
  if (nums.length === 0) return 0;
  const m = mean(nums);
  let s = 0;
  for (const n of nums) {
    const d = n - m;
    s += d * d;
  }
  // population std dev
  return Math.sqrt(s / nums.length);
}

function buildHistogram(scores: number[]) {
  // buckets of 10: 0-9, 10-19, ... up to max
  const maxScore = scores.length ? Math.max(...scores) : 0;
  const maxBucket = Math.max(10, Math.ceil((maxScore + 1) / 10) * 10);
  const buckets: { label: string; start: number; end: number; count: number }[] = [];

  for (let start = 0; start < maxBucket; start += 10) {
    const end = start + 9;
    buckets.push({ label: `${start}-${end}`, start, end, count: 0 });
  }

  for (const s of scores) {
    const idx = Math.min(buckets.length - 1, Math.floor(s / 10));
    buckets[idx].count += 1;
  }

  return buckets;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Missing userId" }, { status: 400 });
    }

    // Find dev_bowler_id from dev_user_id
    const bowlerRes = await sb(
      `dev_bowlers?dev_user_id=eq.${encodeURIComponent(userId)}&select=dev_bowler_id`,
      { method: "GET" }
    );
    if (!bowlerRes.ok) return NextResponse.json({ ok: false, step: "dev_bowlers", detail: bowlerRes.json }, { status: 500 });

    const devBowlerId = bowlerRes.json?.[0]?.dev_bowler_id;
    if (!devBowlerId) {
      return NextResponse.json({
        ok: true,
        gamesPlayed: 0,
        average: 0,
        median: 0,
        high: 0,
        low: 0,
        stddev: 0,
        scores: [],
        histogram: buildHistogram([])
      });
    }

    // Get games for this bowler (most recent first)
    const gamesRes = await sb(
      `dev_games?dev_bowler_id=eq.${encodeURIComponent(devBowlerId)}&select=dev_game_id,played_at&order=played_at.desc`,
      { method: "GET" }
    );
    if (!gamesRes.ok) return NextResponse.json({ ok: false, step: "dev_games", detail: gamesRes.json }, { status: 500 });

    const games: Array<{ dev_game_id: string; played_at: string | null }> = gamesRes.json ?? [];
    if (games.length === 0) {
      return NextResponse.json({
        ok: true,
        gamesPlayed: 0,
        average: 0,
        median: 0,
        high: 0,
        low: 0,
        stddev: 0,
        scores: [],
        histogram: buildHistogram([])
      });
    }

    // For each game, fetch frames then rolls and compute score
    const scores: number[] = [];

    for (const g of games) {
      // frames (1..10)
      const framesRes = await sb(
        `dev_frames?dev_game_id=eq.${encodeURIComponent(g.dev_game_id)}&select=dev_frame_id,frame_number&order=frame_number.asc`,
        { method: "GET" }
      );
      if (!framesRes.ok) continue;

      const frames: FrameRow[] = framesRes.json ?? [];
      if (frames.length === 0) continue;

      const frameRolls: Array<{ frame_number: number; r1: number; r2: number; r3: number }> = [];

      for (const fr of frames) {
        const rollsRes = await sb(
          `dev_rolls?dev_frame_id=eq.${encodeURIComponent(fr.dev_frame_id)}&select=roll_number,pins_knocked&order=roll_number.asc`,
          { method: "GET" }
        );
        if (!rollsRes.ok) continue;

        const rolls: RollRow[] = rollsRes.json ?? [];
        const r1 = rollPins(rolls.find(r => r.roll_number === 1));
        const r2 = rollPins(rolls.find(r => r.roll_number === 2));
        const r3 = rollPins(rolls.find(r => r.roll_number === 3));

        frameRolls.push({ frame_number: fr.frame_number, r1, r2, r3 });
      }

      // If game isn't complete (missing frame 10 or missing rolls), you can skip it:
      // We'll require at least frame 10 exists.
      const has10 = frameRolls.some(x => x.frame_number === 10);
      if (!has10) continue;

      const score = computeDuckpinScoreFromFrames(frameRolls);
      scores.push(score);
    }

    if (scores.length === 0) {
      return NextResponse.json({
        ok: true,
        gamesPlayed: 0,
        average: 0,
        median: 0,
        high: 0,
        low: 0,
        stddev: 0,
        scores: [],
        histogram: buildHistogram([])
      });
    }

    const gamesPlayed = scores.length;
    const avg = mean(scores);
    const med = median(scores);
    const hi = Math.max(...scores);
    const lo = Math.min(...scores);
    const sd = stddev(scores);
    const histogram = buildHistogram(scores);

    return NextResponse.json({
      ok: true,
      gamesPlayed,
      average: avg,
      median: med,
      high: hi,
      low: lo,
      stddev: sd,
      scores,
      histogram
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}