import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminServer, supabaseAnonServer } from "@/app/lib/supabase/server";
import { getAccessToken } from "@/app/api/auth/_cookies";

// ── Scoring (same engine as submit route) ─────────────────────
type FrameRow = { r1: number; r2: number; r3: number };

function scoreDuckpin(frames: FrameRow[]): number {
  const stream: number[] = [];
  for (let i = 0; i < 9; i++) {
    const f = frames[i];
    if (!f || f.r1 == null) break;
    if (f.r1 === 10) { stream.push(10); continue; }
    if (f.r2 == null) break;
    if (f.r1 + f.r2 === 10) { stream.push(f.r1, f.r2); continue; }
    if (f.r3 == null) break;
    stream.push(f.r1, f.r2, f.r3);
  }
  const t = frames[9];
  if (t?.r1 != null && t?.r2 != null && t?.r3 != null) {
    stream.push(t.r1, t.r2, t.r3);
  }

  let total = 0, idx = 0;
  for (let i = 0; i < 10; i++) {
    const f = frames[i];
    if (!f) break;
    if (i === 9) { total += (f.r1 ?? 0) + (f.r2 ?? 0) + (f.r3 ?? 0); break; }
    if (f.r1 === 10) { total += 10 + (stream[idx + 1] ?? 0) + (stream[idx + 2] ?? 0); idx += 1; continue; }
    if ((f.r1 ?? 0) + (f.r2 ?? 0) === 10) { total += 10 + (stream[idx + 2] ?? 0); idx += 2; continue; }
    total += (f.r1 ?? 0) + (f.r2 ?? 0) + (f.r3 ?? 0);
    idx += 3;
  }
  return total;
}

function mean(nums: number[]) { return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0; }
function median(nums: number[]) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function stddev(nums: number[]) {
  if (!nums.length) return 0;
  const m = mean(nums);
  return Math.sqrt(nums.reduce((a, n) => a + (n - m) ** 2, 0) / nums.length);
}
function buildHistogram(scores: number[]) {
  const max = scores.length ? Math.max(...scores) : 0;
  const bucketMax = Math.max(10, Math.ceil((max + 1) / 10) * 10);
  const buckets: { label: string; start: number; end: number; count: number }[] = [];
  for (let s = 0; s < bucketMax; s += 10) {
    buckets.push({ label: `${s}-${s + 9}`, start: s, end: s + 9, count: 0 });
  }
  for (const sc of scores) {
    const i = Math.min(buckets.length - 1, Math.floor(sc / 10));
    buckets[i].count += 1;
  }
  return buckets;
}

function empty() {
  return {
    ok: true,
    gamesPlayed: 0, average: 0, median: 0,
    high: 0, low: 0, stddev: 0,
    scores: [], histogram: buildHistogram([]),
    kpi: { strikePct: 0, sparePct: 0 },
    rolling: [],
    filterOptions: { alleys: [], lanes: [], gameTypes: [] }
  };
}

// ── Route ─────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    // 1) Auth
    const access = getAccessToken();
    if (!access) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

    const anon = supabaseAnonServer();
    const { data: userData, error: uErr } = await anon.auth.getUser(access);
    if (uErr || !userData?.user?.id) {
      return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });
    }
    const userId = userData.user.id;
    const admin  = supabaseAdminServer();

    // 2) Parse filters
    const { searchParams } = new URL(req.url);
    const alleyId  = searchParams.get("alleyId")  ?? "";
    const lane     = searchParams.get("lane")      ?? "";
    const gameType = searchParams.get("gameType")  ?? "";

    // 3) Load lookup tables for filter labels
    const [alleysRes, gameTypesRes] = await Promise.all([
      admin.from("dux_alleys").select("id, name").order("name"),
      admin.from("dux_game_types").select("id, name").order("name"),
    ]);

    const alleys    = (alleysRes.data    ?? []) as any[];
    const gameTypes = (gameTypesRes.data ?? []) as any[];

    // 4) Load all completed games for this user
    let gamesQuery = admin
      .from("dux_games")
      .select("id, score, played_at, alley_id, lane_number, game_type_id")
      .eq("user_id", userId)
      .eq("status", "completed")
      .not("score", "is", null)
      .order("played_at", { ascending: true });

    if (alleyId)  gamesQuery = gamesQuery.eq("alley_id", alleyId);
    if (lane)     gamesQuery = gamesQuery.eq("lane_number", Number(lane));
    if (gameType) gamesQuery = gamesQuery.eq("game_type_id", gameType);

    const { data: games, error: gamesErr } = await gamesQuery;
    if (gamesErr) return NextResponse.json({ ok: false, error: gamesErr.message }, { status: 500 });
    if (!games?.length) return NextResponse.json(empty());

    // 5) Filter options derived from user's game history (unfiltered)
    const { data: allUserGames } = await admin
      .from("dux_games")
      .select("alley_id, lane_number, game_type_id")
      .eq("user_id", userId)
      .eq("status", "completed");

    const alleySet    = new Set<string>();
    const laneSet     = new Set<string>();
    const gtSet       = new Set<string>();
    for (const g of (allUserGames ?? []) as any[]) {
      if (g.alley_id)    alleySet.add(g.alley_id);
      if (g.lane_number) laneSet.add(String(g.lane_number));
      if (g.game_type_id) gtSet.add(g.game_type_id);
    }

    const filterOptions = {
      alleys:    [...alleySet].map(id => ({ value: id, label: alleys.find(a => a.id === id)?.name ?? id })),
      lanes:     [...laneSet].sort((a, b) => Number(a) - Number(b)).map(ln => ({ value: ln, label: `Lane ${ln}` })),
      gameTypes: [...gtSet].map(id => ({ value: id, label: gameTypes.find(t => t.id === id)?.name ?? id })),
    };

    // 6) Load frames for all returned games (for KPI calculations)
    const gameIds = (games as any[]).map(g => g.id);
    const { data: allFrames } = await admin
      .from("dux_frames")
      .select("game_id, frame_number, r1, r2, r3, is_strike, is_spare, r1_mark")
      .in("game_id", gameIds)
      .order("frame_number");

    const framesByGame = new Map<string, any[]>();
    for (const f of (allFrames ?? []) as any[]) {
      const arr = framesByGame.get(f.game_id) ?? [];
      arr.push(f);
      framesByGame.set(f.game_id, arr);
    }

    // 7) Calculate scores and KPIs
    const scores: number[] = [];
    const rolling: { t: string; strikePct: number; sparePct: number }[] = [];

    const WINDOW = 50;
    const rbStrike: number[] = [];
    const rbSpare:  number[] = [];
    const rbStrikeMade: number[] = [];
    const rbSpareMade:  number[] = [];

    let totalStrikes = 0, totalStrikeEligible = 0;
    let totalSpares  = 0, totalSpareEligible  = 0;

    for (const game of games as any[]) {
      const frames = framesByGame.get(game.id) ?? [];
      if (!frames.some((f: any) => f.frame_number === 10)) continue; // skip incomplete

      const score = game.score as number;
      scores.push(score);

      for (const f of frames as any[]) {
        const isStrike  = Boolean(f.is_strike);
        const isSpare   = Boolean(f.is_spare);
        const hasChopSplit = f.r1_mark === "C" || f.r1_mark === "S";

        // Strike KPI
        totalStrikeEligible += 1;
        if (isStrike) totalStrikes += 1;
        rbStrike.push(1);
        rbStrikeMade.push(isStrike ? 1 : 0);

        // Clean spare KPI (exclude strikes and chop/splits)
        if (!isStrike && !hasChopSplit) {
          totalSpareEligible += 1;
          if (isSpare) { totalSpares += 1; rbSpareMade.push(1); }
          else rbSpareMade.push(0);
          rbSpare.push(1);
        } else {
          rbSpare.push(0);
          rbSpareMade.push(0);
        }

        // Trim rolling window
        if (rbStrike.length > WINDOW)  { rbStrike.shift();  rbStrikeMade.shift(); }
        if (rbSpare.length  > WINDOW)  { rbSpare.shift();   rbSpareMade.shift();  }
      }

      const strikePct = rbStrike.reduce((a,b)=>a+b,0) ? rbStrikeMade.reduce((a,b)=>a+b,0) / rbStrike.reduce((a,b)=>a+b,0) : 0;
      const sparePct  = rbSpare.reduce((a,b)=>a+b,0)  ? rbSpareMade.reduce((a,b)=>a+b,0)  / rbSpare.reduce((a,b)=>a+b,0)  : 0;

      rolling.push({
        t: String(game.played_at ?? "").slice(0, 10),
        strikePct: Math.round(strikePct * 10000) / 10000,
        sparePct:  Math.round(sparePct  * 10000) / 10000,
      });
    }

    if (!scores.length) return NextResponse.json({ ...empty(), filterOptions });

    return NextResponse.json({
      ok:         true,
      gamesPlayed: scores.length,
      average:    Math.round(mean(scores)   * 100) / 100,
      median:     Math.round(median(scores) * 100) / 100,
      high:       Math.max(...scores),
      low:        Math.min(...scores),
      stddev:     Math.round(stddev(scores) * 100) / 100,
      scores,
      histogram:  buildHistogram(scores),
      kpi: {
        strikePct: totalStrikeEligible ? totalStrikes / totalStrikeEligible : 0,
        sparePct:  totalSpareEligible  ? totalSpares  / totalSpareEligible  : 0,
      },
      rolling,
      filterOptions,
    });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Server error" }, { status: 500 });
  }
}
