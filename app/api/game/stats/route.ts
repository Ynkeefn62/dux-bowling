import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminServer, supabaseAnonServer } from "@/app/lib/supabase/server";
import { getAccessToken } from "@/app/api/auth/_cookies";

// ── Helpers ──────────────────────────────────────────────────
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
    filterOptions: { alleys: [], lanes: [], gameTypes: [] },
    frameBreakdown: { strikes: 0, spares: 0, opens: 0, splits: 0 },
    recentGames: [],
    pinLeaveFreq: {},
    personalRecords: { highGame: 0, highSeries: 0, bestStrikeStreak: 0, bestSpareStreak: 0 },
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
    const admin = supabaseAdminServer();

    // 2) Parse filters
    const { searchParams } = new URL(req.url);
    const alleyId  = searchParams.get("alleyId") ?? "";
    const lane     = searchParams.get("lane") ?? "";
    const gameType = searchParams.get("gameType") ?? "";

    // 3) Load filter lookup tables (small, safe to fetch)
    const [alleysRes, gameTypesRes] = await Promise.all([
      admin.from("dux_alleys").select("id, name").order("name"),
      admin.from("dux_game_types").select("id, name").order("name"),
    ]);
    const alleys    = (alleysRes.data ?? []) as any[];
    const gameTypes = (gameTypesRes.data ?? []) as any[];

    // 4) Load games (paginated to handle >1000 results)
    // We fetch up to 5,000 games — plenty for any real bowler.
    let gamesQuery = admin
      .from("dux_games")
      .select("id, score, played_at, alley_id, lane_number, game_type_id")
      .eq("user_id", userId)
      .eq("status", "completed")
      .not("score", "is", null)
      .order("played_at", { ascending: true })
      .limit(5000);

    if (alleyId)  gamesQuery = gamesQuery.eq("alley_id", alleyId);
    if (lane)     gamesQuery = gamesQuery.eq("lane_number", Number(lane));
    if (gameType) gamesQuery = gamesQuery.eq("game_type_id", gameType);

    const { data: games, error: gamesErr } = await gamesQuery;
    if (gamesErr) return NextResponse.json({ ok: false, error: gamesErr.message }, { status: 500 });
    if (!games?.length) return NextResponse.json(empty());

    // 5) Filter options derived from user's unfiltered game history
    const { data: allUserGames } = await admin
      .from("dux_games")
      .select("alley_id, lane_number, game_type_id")
      .eq("user_id", userId)
      .eq("status", "completed")
      .limit(5000);

    const alleySet = new Set<string>();
    const laneSet  = new Set<string>();
    const gtSet    = new Set<string>();
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

    // 6) Aggregate frame stats directly in Postgres (avoids URL length and row limit issues).
    //    We use an RPC-style approach: do the join + aggregation on the server side
    //    by hitting dux_frames with the SAME user_id filter via a join through dux_games.
    //    PostgREST doesn't support multi-table JOINs in REST, so we instead pull frame
    //    aggregates per-game in batches.

    // To avoid the URL-too-long issue with .in("game_id", [...]), we DON'T fetch all
    // frame data. Instead we pull aggregate frame stats per user in a single query
    // using a database VIEW or RPC. But to keep this fix self-contained without
    // requiring a new SQL migration, we'll batch the .in() into chunks of 50 game_ids.

    const gameIds = (games as any[]).map(g => g.id);
    const CHUNK_SIZE = 50;

    const allFrames: any[] = [];
    for (let i = 0; i < gameIds.length; i += CHUNK_SIZE) {
      const chunk = gameIds.slice(i, i + CHUNK_SIZE);

      // Default limit is 1000 — for a 50-game chunk × 10 frames = 500 rows. Safe.
      const { data: framesChunk, error: framesErr } = await admin
        .from("dux_frames")
        .select("game_id, frame_number, r1, r2, r3, is_strike, is_spare, r1_mark")
        .in("game_id", chunk)
        .order("frame_number")
        .limit(1000);

      if (framesErr) {
        return NextResponse.json({ ok: false, error: `Frame load failed: ${framesErr.message}` }, { status: 500 });
      }
      if (framesChunk) allFrames.push(...framesChunk);
    }

    // 7) Group frames by game_id
    const framesByGame = new Map<string, any[]>();
    for (const f of allFrames as any[]) {
      const arr = framesByGame.get(f.game_id) ?? [];
      arr.push(f);
      framesByGame.set(f.game_id, arr);
    }

    // 8) Calculate scores and KPIs
    const scores: number[] = [];
    const rolling: { t: string; strikePct: number; sparePct: number }[] = [];
    const WINDOW = 50;
    const rbStrike: number[] = [];
    const rbSpare: number[] = [];
    const rbStrikeMade: number[] = [];
    const rbSpareMade: number[] = [];

    let totalStrikes = 0, totalStrikeEligible = 0;
    let totalSpares = 0, totalSpareEligible = 0;
    let totalOpens = 0, totalSplits = 0;

    // Personal records
    let bestStrikeStreak = 0;
    let bestSpareStreak  = 0;
    let curStrikeStreak  = 0;
    let curSpareStreak   = 0;

    // Pin leave frequency (pin 1-10 → count of times left standing after first ball)
    const pinLeaveFreq: Record<number, number> = {};
    let totalFirstBalls = 0;

    // Recent games (last 12 most recent by played_at)
    const sortedByDate = [...games as any[]].sort(
      (a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
    );
    const recentRaw = sortedByDate.slice(0, 12);

    for (const game of games as any[]) {
      const frames = framesByGame.get(game.id) ?? [];
      // Be lenient: accept any game with frames recorded (not just frame 10).
      // This handles partial games and seed data variations.
      if (frames.length === 0) continue;

      const score = game.score as number;
      scores.push(score);

      for (const f of frames as any[]) {
        const isStrike = Boolean(f.is_strike);
        const isSpare  = Boolean(f.is_spare);
        const hasChopSplit = f.r1_mark === "C" || f.r1_mark === "S";

        // Strike KPI
        totalStrikeEligible += 1;
        if (isStrike) {
          totalStrikes += 1;
          curStrikeStreak += 1;
          if (curStrikeStreak > bestStrikeStreak) bestStrikeStreak = curStrikeStreak;
        } else {
          curStrikeStreak = 0;
        }
        rbStrike.push(1);
        rbStrikeMade.push(isStrike ? 1 : 0);

        // Clean spare KPI (exclude strikes and chop/splits)
        if (!isStrike && !hasChopSplit) {
          totalSpareEligible += 1;
          if (isSpare) {
            totalSpares += 1;
            curSpareStreak += 1;
            if (curSpareStreak > bestSpareStreak) bestSpareStreak = curSpareStreak;
            rbSpareMade.push(1);
          } else {
            curSpareStreak = 0;
            rbSpareMade.push(0);
          }
          rbSpare.push(1);
        } else {
          rbSpare.push(0);
          rbSpareMade.push(0);
          if (!isStrike && !isSpare) {
            if (hasChopSplit) totalSplits += 1;
            else totalOpens += 1;
          }
        }

        // Pin leave tracking: if first ball not a strike, count pins left
        // We approximate "pins left after first ball" as 10 - r1
        if (!isStrike && typeof f.r1 === "number") {
          totalFirstBalls += 1;
          // We don't have per-pin data in dux_frames (just totals), so we
          // approximate using r1 as "pins down on first ball" and infer
          // pins-left count. This produces a heatmap proxy.
          const pinsLeft = 10 - (f.r1 ?? 0);
          // Distribute the "pins left" weight across the pins most commonly
          // left in duckpin (back pins fall less often). Pins 7,8,9,10 weighted heavier.
          const weights: Record<number, number> = { 1: 0.4, 2: 0.6, 3: 0.6, 4: 0.7, 5: 0.7, 6: 0.7, 7: 1.0, 8: 1.0, 9: 1.0, 10: 1.0 };
          for (let pin = 1; pin <= 10; pin++) {
            if (pinsLeft > 0) {
              pinLeaveFreq[pin] = (pinLeaveFreq[pin] ?? 0) + (pinsLeft / 10) * (weights[pin] ?? 1);
            } else {
              pinLeaveFreq[pin] = pinLeaveFreq[pin] ?? 0;
            }
          }
        }

        // Trim rolling window
        if (rbStrike.length > WINDOW) { rbStrike.shift(); rbStrikeMade.shift(); }
        if (rbSpare.length > WINDOW) { rbSpare.shift(); rbSpareMade.shift(); }
      }

      const strikePct = rbStrike.reduce((a,b)=>a+b,0) ? rbStrikeMade.reduce((a,b)=>a+b,0) / rbStrike.reduce((a,b)=>a+b,0) : 0;
      const sparePct  = rbSpare.reduce((a,b)=>a+b,0) ? rbSpareMade.reduce((a,b)=>a+b,0) / rbSpare.reduce((a,b)=>a+b,0) : 0;
      rolling.push({
        t: String(game.played_at ?? "").slice(0, 10),
        strikePct: Math.round(strikePct * 10000) / 10000,
        sparePct:  Math.round(sparePct * 10000) / 10000,
      });
    }

    if (!scores.length) return NextResponse.json({ ...empty(), filterOptions });

    // 9) Normalize pin leave frequency to a 0-1 range per pin
    const pinLeaveFreqNormalized: Record<number, number> = {};
    if (totalFirstBalls > 0) {
      for (let pin = 1; pin <= 10; pin++) {
        pinLeaveFreqNormalized[pin] = Math.min(1, (pinLeaveFreq[pin] ?? 0) / totalFirstBalls);
      }
    }

    // 10) Build recent games list
    const gameTypeNameById = new Map(gameTypes.map((gt: any) => [gt.id, gt.name]));
    const recentGames = recentRaw.map((g: any) => ({
      date: new Date(g.played_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      score: g.score,
      gameType: gameTypeNameById.get(g.game_type_id) ?? "Game",
    }));

    return NextResponse.json({
      ok: true,
      gamesPlayed: scores.length,
      average: Math.round(mean(scores) * 100) / 100,
      median:  Math.round(median(scores) * 100) / 100,
      high:    Math.max(...scores),
      low:     Math.min(...scores),
      stddev:  Math.round(stddev(scores) * 100) / 100,
      scores,
      histogram: buildHistogram(scores),
      kpi: {
        strikePct: totalStrikeEligible ? totalStrikes / totalStrikeEligible : 0,
        sparePct:  totalSpareEligible  ? totalSpares  / totalSpareEligible  : 0,
      },
      rolling,
      filterOptions,
      frameBreakdown: {
        strikes: totalStrikes,
        spares:  totalSpares,
        opens:   totalOpens,
        splits:  totalSplits,
      },
      recentGames,
      pinLeaveFreq: pinLeaveFreqNormalized,
      personalRecords: {
        highGame:         Math.max(...scores),
        highSeries:       scores.length >= 3
          ? Math.max(...Array.from({ length: scores.length - 2 }, (_, i) => scores[i] + scores[i+1] + scores[i+2]))
          : Math.max(...scores),
        bestStrikeStreak,
        bestSpareStreak,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Server error" }, { status: 500 });
  }
}