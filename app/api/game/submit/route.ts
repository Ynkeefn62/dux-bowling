import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminServer, supabaseAnonServer } from "@/app/lib/supabase/server";
import { getAccessToken } from "@/app/api/auth/_cookies";

// ── Duckpin scoring engine ─────────────────────────────────────
// Spare counts only when 10 is reached in exactly 2 balls (not 3).
// Strike bonus = next 2 rolls. Spare bonus = next 1 roll.
// 10th frame: 3 rolls, no bonus beyond the frame itself.

type FrameRow = { r1: number; r2: number; r3: number };

function scoreDuckpin(frames: FrameRow[]): number {
  // Build roll stream for bonus lookups (frames 1-9 only)
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
  // Add 10th frame rolls (no bonus beyond)
  const t = frames[9];
  if (t?.r1 != null && t?.r2 != null && t?.r3 != null) {
    stream.push(t.r1, t.r2, t.r3);
  }

  let total = 0;
  let idx   = 0;

  for (let i = 0; i < 10; i++) {
    const f = frames[i];
    if (!f) break;

    if (i === 9) {
      // 10th frame — no bonuses
      total += (f.r1 ?? 0) + (f.r2 ?? 0) + (f.r3 ?? 0);
      break;
    }

    if (f.r1 === 10) {
      // Strike
      total += 10 + (stream[idx + 1] ?? 0) + (stream[idx + 2] ?? 0);
      idx += 1;
      continue;
    }

    if ((f.r1 ?? 0) + (f.r2 ?? 0) === 10) {
      // Spare (2-ball)
      total += 10 + (stream[idx + 2] ?? 0);
      idx += 2;
      continue;
    }

    // Open frame
    total += (f.r1 ?? 0) + (f.r2 ?? 0) + (f.r3 ?? 0);
    idx += 3;
  }

  return total;
}

function computeRunningTotals(frames: FrameRow[]): number[] {
  const totals: number[] = [];
  let running = 0;
  for (let i = 0; i < frames.length; i++) {
    // Score partial game up to frame i+1
    const partial = scoreDuckpin(frames.slice(0, i + 1));
    running = partial;
    totals.push(running);
  }
  return totals;
}

// ── Route ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
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

  // 2) Parse body
  const body = await req.json().catch(() => null);
  const game_id: string = body?.game_id;
  if (!game_id) return NextResponse.json({ ok: false, error: "game_id required" }, { status: 400 });

  // 3) Verify game belongs to this user
  const { data: game, error: gameErr } = await admin
    .from("dux_games")
    .select("id, user_id, status")
    .eq("id", game_id)
    .maybeSingle();

  if (gameErr || !game) return NextResponse.json({ ok: false, error: "Game not found" }, { status: 404 });
  if ((game as any).user_id !== userId) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  // 4) Load all frames
  const { data: frameRows, error: framesErr } = await admin
    .from("dux_frames")
    .select("frame_number, r1, r2, r3")
    .eq("game_id", game_id)
    .order("frame_number");

  if (framesErr || !frameRows) {
    return NextResponse.json({ ok: false, error: "Failed to load frames" }, { status: 500 });
  }

  // 5) Build ordered array (fill gaps with zeros for partial games)
  const ordered: FrameRow[] = Array.from({ length: 10 }, (_, i) => {
    const row = (frameRows as any[]).find((f) => f.frame_number === i + 1);
    return { r1: row?.r1 ?? 0, r2: row?.r2 ?? 0, r3: row?.r3 ?? 0 };
  });

  // 6) Compute scores
  const finalScore = scoreDuckpin(ordered);
  const runningTotals = computeRunningTotals(ordered);

  // 7) Update each frame with running total
  for (let i = 0; i < 10; i++) {
    await admin
      .from("dux_frames")
      .update({ running_total: runningTotals[i] })
      .eq("game_id", game_id)
      .eq("frame_number", i + 1);
  }

  // 8) Mark game complete with final score
  const { error: updateErr } = await admin
    .from("dux_games")
    .update({ score: finalScore, status: "completed" })
    .eq("id", game_id);

  if (updateErr) {
    return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
  }

  // 9) Update bowler profile stats
  const { data: allGames } = await admin
    .from("dux_games")
    .select("score")
    .eq("user_id", userId)
    .eq("status", "completed")
    .not("score", "is", null);

  const scores = ((allGames ?? []) as any[]).map((g) => g.score as number);
  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const highGame = scores.length ? Math.max(...scores) : 0;

  // Count strikes and spares across all frames
  const { data: allFrames } = await admin
    .from("dux_frames")
    .select("is_strike, is_spare, game_id")
    .in("game_id",
      ((allGames ?? []) as any[]).map((g: any) => g.id).filter(Boolean)
    );

  const totalStrikes = ((allFrames ?? []) as any[]).filter((f) => f.is_strike).length;
  const totalSpares  = ((allFrames ?? []) as any[]).filter((f) => f.is_spare).length;

  await admin
    .from("dux_bowler_profiles")
    .update({
      games_played:  scores.length,
      average_score: Math.round(avgScore * 100) / 100,
      highest_game:  highGame,
      total_strikes: totalStrikes,
      total_spares:  totalSpares,
    })
    .eq("user_id", userId);

  return NextResponse.json({ ok: true, score: finalScore });
}
