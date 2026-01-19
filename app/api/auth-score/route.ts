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

type FrameInput = {
  frame_number: number;
  rolls: number[];
};

type SubmitBody = {
  game_id: string;
  frames: FrameInput[];
};

type ValidateOk = { ok: true; data: SubmitBody };
type ValidateErr = { ok: false; error: string };
type ValidateResult = ValidateOk | ValidateErr;

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

function extractAccessToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();

  const cookies = parseCookies(req.headers.get("cookie"));

  if (cookies["sb-access-token"]) {
    try {
      return decodeURIComponent(cookies["sb-access-token"]);
    } catch {
      return cookies["sb-access-token"];
    }
  }

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
 * Keep identical scoring behavior to your previous server route
 * (spare if 10-in-2 OR 10-in-3)
 */
function scoreDuckpin(frames: number[][]) {
  let total = 0;
  const rolls = frames.flat();
  let i = 0;

  for (let frame = 0; frame < 10; frame++) {
    const r1 = rolls[i] ?? 0;
    const r2 = rolls[i + 1] ?? 0;
    const r3 = rolls[i + 2] ?? 0;

    if (r1 === 10) {
      total += 10 + r2 + r3;
      i += 1;
      continue;
    }

    if (r1 + r2 === 10 || r1 + r2 + r3 === 10) {
      total += 10 + (rolls[i + 3] ?? 0);
      i += r1 + r2 === 10 ? 2 : 3;
      continue;
    }

    total += r1 + r2 + r3;
    i += 3;
  }

  return total;
}

function isInt(n: any) {
  return typeof n === "number" && Number.isFinite(n) && Math.floor(n) === n;
}

function validate(body: any): ValidateResult {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid JSON body" };

  const game_id = body?.game_id;
  const frames = body?.frames;

  if (!game_id || typeof game_id !== "string") return { ok: false, error: "game_id is required" };
  if (!Array.isArray(frames) || frames.length !== 10) return { ok: false, error: "frames must be an array of 10" };

  for (let i = 0; i < 10; i++) {
    const f = frames[i];
    if (!f || typeof f !== "object") return { ok: false, error: `frames[${i}] invalid` };

    if (!isInt(f.frame_number) || f.frame_number !== i + 1) {
      return { ok: false, error: `frames[${i}].frame_number must be ${i + 1}` };
    }

    if (!Array.isArray(f.rolls)) return { ok: false, error: `frames[${i}].rolls must be an array` };
    if (f.rolls.length < 1 || f.rolls.length > 3) {
      return { ok: false, error: `frames[${i}].rolls must have 1-3 items` };
    }

    for (const r of f.rolls) {
      if (!isInt(r) || r < 0 || r > 10) {
        return { ok: false, error: `frames[${i}].rolls contains invalid value` };
      }
    }
  }

  return { ok: true, data: { game_id, frames } };
}

export async function POST(req: Request) {
  try {
    // Require login
    const accessToken = extractAccessToken(req);
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (userErr || !userData?.user?.id) {
      return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });
    }

    const body = await req.json();
    const validated = validate(body);

    // ✅ This now narrows correctly
    if (validated.ok === false) {
      return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
    }

    const { game_id, frames } = validated.data;

    // Replace frames (retry-safe)
    const del = await supabaseAdmin.from("test_frames").delete().eq("game_id", game_id);
    if (del.error) {
      console.error(del.error);
      return NextResponse.json({ ok: false, error: "Failed to replace frames" }, { status: 500 });
    }

    const insertRows = frames.map((f) => ({
      game_id,
      frame_number: f.frame_number,
      rolls: f.rolls
    }));

    const ins = await supabaseAdmin.from("test_frames").insert(insertRows);
    if (ins.error) {
      console.error(ins.error);
      return NextResponse.json({ ok: false, error: "Insert failed" }, { status: 500 });
    }

    // Fetch & score
    const { data: savedFrames, error: fetchError } = await supabaseAdmin
      .from("test_frames")
      .select("rolls")
      .eq("game_id", game_id)
      .order("frame_number");

    if (fetchError || !savedFrames) {
      console.error(fetchError);
      return NextResponse.json({ ok: false, error: "Fetch failed" }, { status: 500 });
    }

    const score = scoreDuckpin(savedFrames.map((f: any) => f.rolls as number[]));

    // Update score on the game
    const upd = await supabaseAdmin.from("test_games").update({ score }).eq("id", game_id);
    if (upd.error) {
      console.error(upd.error);
      return NextResponse.json({ ok: false, error: "Failed to update game score" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, score });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}