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
  dev_frame_id: string;
  roll_number: number;
  pins_knocked: number[] | null;
  chop_split: string | null; // <-- IMPORTANT
};

type FrameRow = {
  frame_number: number;
  dev_frame_id: string;
};

type GameRow = {
  dev_game_id: string;
  played_at: string | null;

  // these need to exist for filters:
  dev_alley_id: string | null;
  lane_number: number | null;
  dev_game_type_id: string | null;
};

type AlleyRow = { dev_alley_id: string; alley_name: string };
type GameTypeRow = { dev_game_type_id: string; game_type_name: string };

function rollPins(pins: number[] | null) {
  const arr = pins ?? [];
  return Array.isArray(arr) ? arr.length : 0;
}

function computeDuckpinScoreFromFrames(frames: Array<{ frame_number: number; r1: number; r2: number; r3: number }>) {
  const f = Array.from({ length: 10 }, (_, i) => {
    const row = frames.find(x => x.frame_number === i + 1);
    return row ?? { frame_number: i + 1, r1: 0, r2: 0, r3: 0 };
  });

  const rollStream: number[] = [];
  for (let i = 0; i < 9; i++) {
    const fr = f[i];
    if (fr.r1 === 10) { rollStream.push(10); continue; }
    const two = fr.r1 + fr.r2;
    if (two === 10) { rollStream.push(fr.r1, fr.r2); continue; }
    rollStream.push(fr.r1, fr.r2, fr.r3);
  }

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
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}
function stddev(nums: number[]) {
  if (nums.length === 0) return 0;
  const m = mean(nums);
  let s = 0;
  for (const n of nums) { const d = n - m; s += d * d; }
  return Math.sqrt(s / nums.length);
}

function buildHistogram(scores: number[]) {
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

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
function pct(numer: number, denom: number) {
  if (!denom) return 0;
  return clamp01(numer / denom);
}
function sum(arr: number[]) {
  let s = 0;
  for (const n of arr) s += n;
  return s;
}
function toISODate(d: string | null) {
  const iso = d ?? new Date().toISOString();
  return iso.slice(0, 10);
}

function isChopOrSplit(chop_split: string | null) {
  // adjust to your actual values if different
  const v = String(chop_split ?? "").toLowerCase();
  return v === "chop" || v === "split" || v === "chop_split" || v === "both";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // filters
    const alleyId = searchParams.get("alleyId") || "";
    const lane = searchParams.get("lane") || "";
    const gameType = searchParams.get("gameType") || ""; // dev_game_type_id

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
        histogram: buildHistogram([]),
        kpi: { strikePct: 0, sparePct: 0 },
        rolling: [],
        filterOptions: { alleys: [], lanes: [], gameTypes: [] }
      });
    }

    // Lookups for filter labels (safe; tables are read-only)
    const [alleysRes, gameTypesRes] = await Promise.all([
      sb(`dev_alleys?select=dev_alley_id,alley_name&order=alley_name.asc`, { method: "GET" }),
      sb(`dev_game_types?select=dev_game_type_id,game_type_name&order=game_type_name.asc`, { method: "GET" })
    ]);
    const alleys: AlleyRow[] = alleysRes.ok ? (alleysRes.json ?? []) : [];
    const gameTypes: GameTypeRow[] = gameTypesRes.ok ? (gameTypesRes.json ?? []) : [];

    // Games (must include filter columns)
    const gamesRes = await sb(
      `dev_games?dev_bowler_id=eq.${encodeURIComponent(devBowlerId)}` +
        `&select=dev_game_id,played_at,dev_alley_id,lane_number,dev_game_type_id` +
        `&order=played_at.desc`,
      { method: "GET" }
    );
    if (!gamesRes.ok) return NextResponse.json({ ok: false, step: "dev_games", detail: gamesRes.json }, { status: 500 });

    const allGames: GameRow[] = gamesRes.json ?? [];

    // Filter options from the user's games
    const laneSet = new Set<string>();
    const alleySet = new Set<string>();
    const gtSet = new Set<string>();

    for (const g of allGames) {
      if (g.lane_number !== null && g.lane_number !== undefined) laneSet.add(String(g.lane_number));
      if (g.dev_alley_id) alleySet.add(g.dev_alley_id);
      if (g.dev_game_type_id) gtSet.add(g.dev_game_type_id);
    }

    const filterOptions = {
      alleys: Array.from(alleySet).map((id) => ({
        value: id,
        label: alleys.find((a) => a.dev_alley_id === id)?.alley_name ?? id
      })),
      lanes: Array.from(laneSet).sort((a, b) => Number(a) - Number(b)).map((ln) => ({
        value: ln,
        label: `Lane ${ln}`
      })),
      gameTypes: Array.from(gtSet).map((id) => ({
        value: id,
        label: gameTypes.find((t) => t.dev_game_type_id === id)?.game_type_name ?? id
      }))
    };

    // Apply filters
    const games = allGames.filter((g) => {
      if (alleyId && g.dev_alley_id !== alleyId) return false;
      if (lane && String(g.lane_number ?? "") !== lane) return false;
      if (gameType && g.dev_game_type_id !== gameType) return false;
      return true;
    });

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
        histogram: buildHistogram([]),
        kpi: { strikePct: 0, sparePct: 0 },
        rolling: [],
        filterOptions
      });
    }

    // Rolling window size (frames)
    const ROLLING_FRAMES = 50;

    const scores: number[] = [];
    const rolling: Array<{ t: string; strikePct: number; sparePct: number }> = [];

    let strikeEligible = 0;
    let strikeMade = 0;

    let cleanSpareEligible = 0;
    let cleanSpareMade = 0;

    const rbStrikeEligible: number[] = [];
    const rbStrikeMade: number[] = [];
    const rbSpareEligible: number[] = [];
    const rbSpareMade: number[] = [];

    // Rolling chart should be chronological
    const gamesChrono = [...games].sort((a, b) => String(a.played_at ?? "").localeCompare(String(b.played_at ?? "")));

    for (const g of gamesChrono) {
      // frames for this game
      const framesRes = await sb(
        `dev_frames?dev_game_id=eq.${encodeURIComponent(g.dev_game_id)}` +
          `&select=dev_frame_id,frame_number` +
          `&order=frame_number.asc`,
        { method: "GET" }
      );
      if (!framesRes.ok) continue;

      const frames: FrameRow[] = framesRes.json ?? [];
      if (!frames.length) continue;

      // completed game requirement
      if (!frames.some((f) => f.frame_number === 10)) continue;

      const frameIds = frames.map((f) => f.dev_frame_id);
      const inList = `(${frameIds.map((id) => `"${id}"`).join(",")})`;

      // all rolls for these frames, including chop_split
      const rollsRes = await sb(
        `dev_rolls?dev_frame_id=in.${encodeURIComponent(inList)}` +
          `&select=dev_frame_id,roll_number,pins_knocked,chop_split` +
          `&order=dev_frame_id.asc,roll_number.asc`,
        { method: "GET" }
      );
      if (!rollsRes.ok) continue;

      const rolls: RollRow[] = rollsRes.json ?? [];
      const rollsByFrame = new Map<string, RollRow[]>();
      for (const r of rolls) {
        const arr = rollsByFrame.get(r.dev_frame_id) ?? [];
        arr.push(r);
        rollsByFrame.set(r.dev_frame_id, arr);
      }

      const frameRollsForScore: Array<{ frame_number: number; r1: number; r2: number; r3: number }> = [];

      for (const fr of frames) {
        const rr = rollsByFrame.get(fr.dev_frame_id) ?? [];
        const roll1 = rr.find((x) => x.roll_number === 1);
        const roll2 = rr.find((x) => x.roll_number === 2);
        const roll3 = rr.find((x) => x.roll_number === 3);

        const r1 = rollPins(roll1?.pins_knocked ?? null);
        const r2 = rollPins(roll2?.pins_knocked ?? null);
        const r3 = rollPins(roll3?.pins_knocked ?? null);

        frameRollsForScore.push({ frame_number: fr.frame_number, r1, r2, r3 });

        const isStrike = r1 === 10;

        // Strike KPI
        strikeEligible += 1;
        if (isStrike) strikeMade += 1;

        rbStrikeEligible.push(1);
        rbStrikeMade.push(isStrike ? 1 : 0);

        // Clean spare eligibility:
        // exclude strikes
        // exclude frames where roll_number=1 had chop/split
        const hadChopOrSplitOnBall1 = isChopOrSplit(roll1?.chop_split ?? null);
        const eligibleCleanSpare = !isStrike && !hadChopOrSplitOnBall1;

        if (eligibleCleanSpare) cleanSpareEligible += 1;

        // Spare success:
        // all pins down on second ball (for duckpin, that means r1+r2==10)
        const isSpare = !isStrike && (r1 + r2 === 10);
        const madeCleanSpare = eligibleCleanSpare && isSpare;

        if (madeCleanSpare) cleanSpareMade += 1;

        rbSpareEligible.push(eligibleCleanSpare ? 1 : 0);
        rbSpareMade.push(madeCleanSpare ? 1 : 0);

        // clamp rolling buffers
        if (rbStrikeEligible.length > ROLLING_FRAMES) { rbStrikeEligible.shift(); rbStrikeMade.shift(); }
        if (rbSpareEligible.length > ROLLING_FRAMES) { rbSpareEligible.shift(); rbSpareMade.shift(); }
      }

      // score
      const score = computeDuckpinScoreFromFrames(frameRollsForScore);
      scores.push(score);

      // rolling point at game date
      const t = toISODate(g.played_at);
      rolling.push({
        t,
        strikePct: pct(sum(rbStrikeMade), sum(rbStrikeEligible)),
        sparePct: pct(sum(rbSpareMade), sum(rbSpareEligible))
      });
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
        histogram: buildHistogram([]),
        kpi: { strikePct: 0, sparePct: 0 },
        rolling: [],
        filterOptions
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
      histogram,
      kpi: {
        strikePct: pct(strikeMade, strikeEligible),
        sparePct: pct(cleanSpareMade, cleanSpareEligible)
      },
      rolling,
      filterOptions
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}