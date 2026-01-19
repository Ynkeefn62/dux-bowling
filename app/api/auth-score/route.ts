import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Env vars (must exist in Vercel)
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

type Mark = "C" | "S" | null;

type SubmitFrame = {
  frame_number: number;
  lane: number | null;
  r1: number | null;
  r2: number | null;
  r3: number | null;
  r1_mark?: Mark;
  r2_mark?: Mark;
  r3_mark?: Mark;
};

type SubmitPayload = {
  game_id: string;
  played_date: string; // YYYY-MM-DD
  location_name: string;
  event_type_name: string;
  game_number: number;
  frames: SubmitFrame[];
};

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    out[k] = v;
  }
  return out;
}

/**
 * Tries to find a Supabase access token in cookies.
 * Handles:
 * - sb-access-token
 * - sb-<project>-auth-token (JSON that includes access_token)
 */
function extractAccessToken(req: Request): string | null {
  // 1) Authorization header (if you ever add it later)
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();

  // 2) Cookies
  const cookies = parseCookies(req.headers.get("cookie"));

  // Common simple cookie name
  if (cookies["sb-access-token"]) {
    try {
      return decodeURIComponent(cookies["sb-access-token"]);
    } catch {
      return cookies["sb-access-token"];
    }
  }

  // Supabase JS / auth helpers often store JSON in sb-*-auth-token
  const authTokenKey = Object.keys(cookies).find((k) => k.includes("auth-token"));
  if (authTokenKey) {
    const raw = cookies[authTokenKey];
    try {
      const decoded = decodeURIComponent(raw);
      const parsed = JSON.parse(decoded);
      if (parsed?.access_token) return parsed.access_token as string;
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * Duckpin scoring rules (same as your client):
 * - Strike bonus = next 2 rolls
 * - Spare bonus ONLY if 10 in 2 rolls (not if 10 in 3)
 * - 10th frame: no bonuses beyond, max 3 rolls
 */
function scoreDuckpinFromFrames(frames: SubmitFrame[]): number {
  // ensure frames in order
  const ordered = [...frames].sort((a, b) => a.frame_number - b.frame_number);

  // Build roll stream for scoring
  const rollStream: number[] = [];

  // frames 1-9
  for (let i = 0; i < 9; i++) {
    const f = ordered[i];
    const r1 = f?.r1 ?? null;
    const r2 = f?.r2 ?? null;
    const r3 = f?.r3 ?? null;
    if (r1 === null) break;

    if (r1 === 10) {
      rollStream.push(10);
      continue;
    }

    if (r2 === null) break;

    const two = r1 + r2;
    if (two === 10) {
      rollStream.push(r1, r2);
      continue;
    }

    if (r3 === null) break;
    rollStream.push(r1, r2, r3);
  }

  // frame 10 (no bonus beyond)
  const t = ordered[9];
  if (t && t.r1 !== null && t.r2 !== null && t.r3 !== null) {
    rollStream.push(t.r1, t.r2, t.r3);
  }

  let total = 0;
  let rollIndex = 0;

  for (let frame = 0; frame < 10; frame++) {
    const fnum = frame + 1;
    const f = ordered[frame];
    if (!f) break;

    const r1 = f.r1;
    const r2 = f.r2;
    const r3 = f.r3;

    // must be "complete" to score it
    const complete =
      fnum < 10
        ? r1 !== null && (r1 === 10 || (r2 !== null && (r1 + r2 === 10 || r3 !== null)))
        : r1 !== null && r2 !== null && r3 !== null;

    if (!complete) break;

    if (fnum === 10) {
      total += (r1 ?? 0) + (r2 ?? 0) + (r3 ?? 0);
      break;
    }

    // strike
    if (r1 === 10) {
      const b1 = rollStream[rollIndex + 1] ?? 0;
      const b2 = rollStream[rollIndex + 2] ?? 0;
      total += 10 + b1 + b2;
      rollIndex += 1;
      continue;
    }

    const two = (r1 ?? 0) + (r2 ?? 0);

    // spare ONLY in 2
    if (two === 10) {
      const bonus = rollStream[rollIndex + 2] ?? 0;
      total += 10 + bonus;
      rollIndex += 2;
      continue;
    }

    // open
    total += (r1 ?? 0) + (r2 ?? 0) + (r3 ?? 0);
    rollIndex += 3;
  }

  return total;
}

function validatePayload(body: any): { ok: true; data: SubmitPayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid JSON body" };

  const { game_id, played_date, location_name, event_type_name, game_number, frames } = body as SubmitPayload;

  if (!game_id || typeof game_id !== "string") return { ok: false, error: "game_id is required" };
  if (!played_date || typeof played_date !== "string") return { ok: false, error: "played_date is required" };
  if (!location_name || typeof location_name !== "string") return { ok: false, error: "location_name is required" };
  if (!event_type_name || typeof event_type_name !== "string") return { ok: false, error: "event_type_name is required" };
  if (typeof game_number !== "number") return { ok: false, error: "game_number is required" };
  if (!Array.isArray(frames) || frames.length !== 10) return { ok: false, error: "frames must be an array of 10 frames" };

  // Basic per-frame checks
  for (let i = 0; i < 10; i++) {
    const f = frames[i];
    if (!f || typeof f !== "object") return { ok: false, error: `frames[${i}] invalid` };
    if (typeof f.frame_number !== "number" || f.frame_number !== i + 1) {
      return { ok: false, error: `frames[${i}].frame_number must be ${i + 1}` };
    }
    // Final submission requires all rolls filled (your UI already enforces this)
    if (f.r1 === null || f.r2 === null || f.r3 === null) return { ok: false, error: `Frame ${i + 1} is incomplete` };
    if (f.r1 < 0 || f.r1 > 10 || f.r2 < 0 || f.r2 > 10 || f.r3 < 0 || f.r3 > 10) {
      return { ok: false, error: `Frame ${i + 1} has invalid roll values` };
    }
  }

  return { ok: true, data: body as SubmitPayload };
}

export async function POST(req: Request) {
  try {
    // ✅ Require login (server-side)
    const accessToken = extractAccessToken(req);
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (userErr || !userData?.user?.id) {
      return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });
    }
    const user_id = userData.user.id;

    const body = await req.json();
    const validated = validatePayload(body);
    if (!validated.ok) {
      return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
    }

    const payload = validated.data;
    const score = scoreDuckpinFromFrames(payload.frames);

    // ✅ Persist:
    // - Upsert game row
    // - Replace frames for that game_id (idempotent in case user retries submit)
    //
    // NOTE: adjust table/column names if yours differ.
    const gameUpsert = await supabaseAdmin
      .from("test_games")
      .upsert(
        {
          id: payload.game_id,
          user_id,
          played_date: payload.played_date,
          location_name: payload.location_name,
          event_type_name: payload.event_type_name,
          game_number: payload.game_number,
          score
        },
        { onConflict: "id" }
      );

    if (gameUpsert.error) {
      console.error(gameUpsert.error);
      return NextResponse.json({ ok: false, error: "Failed to save game" }, { status: 500 });
    }

    // delete existing frames (in case of retry)
    const del = await supabaseAdmin.from("test_frames").delete().eq("game_id", payload.game_id);
    if (del.error) {
      console.error(del.error);
      return NextResponse.json({ ok: false, error: "Failed to replace frames" }, { status: 500 });
    }

    // insert frames
    const frameRows = payload.frames.map((f) => ({
      game_id: payload.game_id,
      frame_number: f.frame_number,
      lane: f.lane,
      r1: f.r1,
      r2: f.r2,
      r3: f.r3,
      r1_mark: f.r1_mark ?? null,
      r2_mark: f.r2_mark ?? null,
      r3_mark: f.r3_mark ?? null
    }));

    const ins = await supabaseAdmin.from("test_frames").insert(frameRows);
    if (ins.error) {
      console.error(ins.error);
      return NextResponse.json({ ok: false, error: "Failed to save frames" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, score });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}