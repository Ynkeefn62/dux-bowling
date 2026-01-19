// app/api/auth-score/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// optional but recommended for auth verification call
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing Supabase environment variables");
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

type Mark = "C" | "S" | null;

type FramePayload = {
  frame_number: number;
  lane?: number | null;
  r1: number | null;
  r2: number | null;
  r3: number | null;
  r1_mark?: Mark;
  r2_mark?: Mark;
  r3_mark?: Mark;
};

type SubmitPayload = {
  game_id: string;
  played_date?: string;
  location_name?: string;
  event_type_name?: string;
  game_number?: number;
  frames: FramePayload[];
};

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((s) => s.trim());
  const key = encodeURIComponent(name) + "=";
  for (const p of parts) {
    if (p.startsWith(key)) return decodeURIComponent(p.slice(key.length));
  }
  return null;
}

// Tries common Supabase cookie conventions:
// - sb-access-token
// - sb-<projectref>-auth-token (JSON)
// - supabase-auth-token (JSON)
function extractAccessToken(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");

  // auth-helpers-nextjs commonly uses these
  const direct = getCookieValue(cookieHeader, "sb-access-token");
  if (direct) return direct;

  // sometimes stored as JSON array or object
  const candidates: string[] = [];
  if (cookieHeader) {
    const parts = cookieHeader.split(";").map((s) => s.trim());
    for (const p of parts) {
      const eq = p.indexOf("=");
      if (eq <= 0) continue;
      const name = decodeURIComponent(p.slice(0, eq));
      if (name === "supabase-auth-token") candidates.push(name);
      if (name.startsWith("sb-") && name.endsWith("-auth-token")) candidates.push(name);
    }
  }

  for (const name of candidates) {
    const raw = getCookieValue(cookieHeader, name);
    if (!raw) continue;

    // common formats:
    // 1) JSON array: ["access_token", "refresh_token", ...]
    // 2) JSON object: { "access_token": "...", ... }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && typeof parsed[0] === "string") return parsed[0];
      if (parsed && typeof parsed.access_token === "string") return parsed.access_token;
    } catch {
      // ignore
    }
  }

  // fallback: Authorization header if you ever add it client-side
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7);

  return null;
}

async function requireUserId(req: Request): Promise<string> {
  const token = extractAccessToken(req);
  if (!token) throw new Error("UNAUTHENTICATED");

  // Verify token with Supabase Auth REST API
  // (apikey can be anon or service role; anon is preferred)
  const apikey = anonKey || serviceKey;

  const r = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey,
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!r.ok) throw new Error("UNAUTHENTICATED");

  const u = (await r.json().catch(() => null)) as any;
  const userId = u?.id as string | undefined;
  if (!userId) throw new Error("UNAUTHENTICATED");
  return userId;
}

function frameCompleteDuckpin(frame: FramePayload, frameNumber: number) {
  const r1 = frame.r1;
  const r2 = frame.r2;
  const r3 = frame.r3;

  if (frameNumber < 10) {
    if (r1 === null) return false;
    if (r1 === 10) return true;
    if (r2 === null) return false;
    if (r1 + r2 === 10) return true; // spare only in 2
    return r3 !== null;
  }

  return r1 !== null && r2 !== null && r3 !== null;
}

/**
 * Duckpin scoring:
 * - Strike bonus = next 2 rolls
 * - Spare bonus ONLY if 10 in 2 rolls (not 10 in 3)
 * - 10th frame: no bonuses beyond, max 3 rolls
 */
function scoreDuckpin(frames: FramePayload[]) {
  const rollStream: number[] = [];

  // frames 1-9 build stream
  for (let i = 0; i < 9; i++) {
    const f = frames[i];
    if (!f) break;
    if (f.r1 === null) break;

    if (f.r1 === 10) {
      rollStream.push(10);
      continue;
    }

    if (f.r2 === null) break;

    const two = (f.r1 ?? 0) + (f.r2 ?? 0);
    if (two === 10) {
      rollStream.push(f.r1, f.r2);
      continue;
    }

    if (f.r3 === null) break;
    rollStream.push(f.r1, f.r2, f.r3);
  }

  // add 10th (no bonus beyond)
  const t = frames[9];
  if (t?.r1 !== null && t?.r2 !== null && t?.r3 !== null) {
    rollStream.push(t.r1, t.r2, t.r3);
  }

  let total = 0;
  let rollIndex = 0;

  for (let frame = 0; frame < 10; frame++) {
    const fnum = frame + 1;
    const f = frames[frame];
    if (!f) break;

    if (!frameCompleteDuckpin(f, fnum)) break;

    if (fnum === 10) {
      total += (f.r1 ?? 0) + (f.r2 ?? 0) + (f.r3 ?? 0);
      break;
    }

    if (f.r1 === 10) {
      const b1 = rollStream[rollIndex + 1] ?? 0;
      const b2 = rollStream[rollIndex + 2] ?? 0;
      total += 10 + b1 + b2;
      rollIndex += 1;
      continue;
    }

    const two = (f.r1 ?? 0) + (f.r2 ?? 0);
    if (two === 10) {
      const bonus = rollStream[rollIndex + 2] ?? 0;
      total += 10 + bonus;
      rollIndex += 2;
      continue;
    }

    total += (f.r1 ?? 0) + (f.r2 ?? 0) + (f.r3 ?? 0);
    rollIndex += 3;
  }

  return total;
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId(req);

    const body = (await req.json().catch(() => null)) as SubmitPayload | null;
    if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });

    const { game_id, played_date, location_name, event_type_name, game_number, frames } = body;

    if (!game_id || typeof game_id !== "string") {
      return NextResponse.json({ ok: false, error: "game_id is required" }, { status: 400 });
    }
    if (!Array.isArray(frames) || frames.length !== 10) {
      return NextResponse.json({ ok: false, error: "frames must be an array of length 10" }, { status: 400 });
    }

    // Validate completeness
    for (let i = 0; i < 10; i++) {
      const f = frames[i];
      const fnum = i + 1;
      if (!f || f.frame_number !== fnum) {
        return NextResponse.json({ ok: false, error: `frame_number mismatch at frame ${fnum}` }, { status: 400 });
      }
      if (!frameCompleteDuckpin(f, fnum)) {
        return NextResponse.json({ ok: false, error: `frame ${fnum} is incomplete` }, { status: 400 });
      }
    }

    // Enforce "final"
    const { count: existingCount, error: countErr } = await admin
      .from("test_frames")
      .select("game_id", { count: "exact", head: true })
      .eq("game_id", game_id);

    if (countErr) {
      return NextResponse.json({ ok: false, error: "Failed to check existing submission" }, { status: 500 });
    }
    if ((existingCount ?? 0) > 0) {
      return NextResponse.json(
        { ok: false, error: "Score already submitted for this game." },
        { status: 409 }
      );
    }

    const score = scoreDuckpin(frames);

    // Ensure a game row exists (best-effort; your table may have different columns)
    // If your test_games schema does NOT include these columns, remove them.
    const { error: gameInsertErr } = await admin.from("test_games").upsert(
      {
        id: game_id,
        user_id: userId,
        played_date: played_date ?? null,
        location_name: location_name ?? null,
        event_type_name: event_type_name ?? null,
        game_number: typeof game_number === "number" ? game_number : null,
        score
      },
      { onConflict: "id" }
    );

    if (gameInsertErr) {
      // fallback: try just updating score if row exists already
      const { error: gameUpdateErr } = await admin.from("test_games").update({ score }).eq("id", game_id);
      if (gameUpdateErr) {
        return NextResponse.json({ ok: false, error: "Failed to write game score" }, { status: 500 });
      }
    }

    // Insert frames (store as rolls array; ignore extra fields safely)
    const frameRows = frames.map((f) => ({
      game_id,
      frame_number: f.frame_number,
      rolls: [f.r1 ?? 0, f.r2 ?? 0, f.r3 ?? 0]
    }));

    const { error: frameInsertErr } = await admin.from("test_frames").insert(frameRows);
    if (frameInsertErr) {
      return NextResponse.json({ ok: false, error: "Failed to insert frames" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, score });
  } catch (err: any) {
    const msg = String(err?.message || "");
    if (msg === "UNAUTHENTICATED") {
      return NextResponse.json({ ok: false, error: "You must be logged in to submit a score." }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}