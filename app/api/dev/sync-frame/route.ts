import { NextResponse } from "next/server";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

// Minimal PostgREST helper (server-only)
async function sb(path: string, init: RequestInit) {
  const url = mustEnv("SUPABASE_URL").replace(/\/$/, "");
  const key = mustEnv("SUPABASE_SERVICE_ROLE_KEY");

  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
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

type Body = {
  // required
  dev_game_id: string;
  frame_number: number;

  // optional
  lane: number | null;

  // rolls (counts as “pins knocked” amount; we assume pins fall in order)
  r1: number | null;
  r2: number | null;
  r3: number | null;

  // chop/split markers for each roll ("C" | "S" | null)
  r1_mark: "C" | "S" | null;
  r2_mark: "C" | "S" | null;
  r3_mark: "C" | "S" | null;
};

function range(min: number, max: number) {
  const out: number[] = [];
  for (let i = min; i <= max; i++) out.push(i);
  return out;
}

// Assumption requested:
// if you knock down N pins, they are the first N eligible pins in order.
function buildPins(
  eligible: number[],
  knockedCount: number
): { pins_eligible: number[]; pins_knocked: number[]; nextEligible: number[] } {
  const k = Math.max(0, Math.min(knockedCount, eligible.length));
  const pins_knocked = eligible.slice(0, k);
  const nextEligible = eligible.slice(k);
  return { pins_eligible: eligible, pins_knocked, nextEligible };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!body?.dev_game_id) {
      return NextResponse.json({ ok: false, error: "dev_game_id required" }, { status: 400 });
    }
    if (!body?.frame_number || body.frame_number < 1 || body.frame_number > 10) {
      return NextResponse.json({ ok: false, error: "frame_number 1..10 required" }, { status: 400 });
    }

    // 1) Find or create dev_frame row
    const frFind = await sb(
      `dev_frames?dev_game_id=eq.${encodeURIComponent(body.dev_game_id)}&frame_number=eq.${body.frame_number}&select=dev_frame_id`,
      { method: "GET" }
    );
    if (!frFind.ok) return NextResponse.json({ ok: false, step: "find_frame", detail: frFind.json }, { status: 500 });

    let dev_frame_id: string | null = frFind.json?.[0]?.dev_frame_id ?? null;

    if (!dev_frame_id) {
      const frIns = await sb(`dev_frames`, {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          dev_game_id: body.dev_game_id,
          frame_number: body.frame_number
        })
      });
      if (!frIns.ok) return NextResponse.json({ ok: false, step: "insert_frame", detail: frIns.json }, { status: 500 });
      dev_frame_id = frIns.json?.[0]?.dev_frame_id ?? null;
    }

    if (!dev_frame_id) {
      return NextResponse.json({ ok: false, error: "Unable to determine dev_frame_id" }, { status: 500 });
    }

    // 2) Hard-delete ALL existing rolls for this frame (this fixes “stale rows”)
    const del = await sb(`dev_rolls?dev_frame_id=eq.${encodeURIComponent(dev_frame_id)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" }
    });
    if (!del.ok) {
      return NextResponse.json({ ok: false, step: "delete_rolls", detail: del.json }, { status: 500 });
    }

    // 3) Re-insert only the current rolls (non-null)
    const inserts: any[] = [];

    let eligible = range(1, 10);

    const roll1 = body.r1;
    if (roll1 !== null) {
      const built = buildPins(eligible, roll1);
      eligible = built.nextEligible;

      inserts.push({
        dev_frame_id,
        roll_number: 1,
        pins_eligible: built.pins_eligible,
        pins_knocked: built.pins_knocked,
        chop_split_indicator: body.r1_mark
      });
    }

    const roll2 = body.r2;
    if (roll2 !== null) {
      // 10th frame has special “reset rack” cases; BUT your UI already enforces valid values.
      // For dev logging, we just treat eligibility based on “remaining pins” rule.
      const built = buildPins(eligible, roll2);
      eligible = built.nextEligible;

      inserts.push({
        dev_frame_id,
        roll_number: 2,
        pins_eligible: built.pins_eligible,
        pins_knocked: built.pins_knocked,
        chop_split_indicator: body.r2_mark
      });
    }

    const roll3 = body.r3;
    if (roll3 !== null) {
      // If 10th frame and the rack “resets” before roll 3, your UI already adjusts options.
      // For logging we reflect the “eligible” pins computed from prior remaining.
      const built = buildPins(eligible, roll3);

      inserts.push({
        dev_frame_id,
        roll_number: 3,
        pins_eligible: built.pins_eligible,
        pins_knocked: built.pins_knocked,
        chop_split_indicator: body.r3_mark
      });
    }

    if (inserts.length > 0) {
      const ins = await sb(`dev_rolls`, {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(inserts)
      });
      if (!ins.ok) return NextResponse.json({ ok: false, step: "insert_rolls", detail: ins.json }, { status: 500 });
    }

    // (Optional) you can also store lane per frame in dev_frames if you add a column.
    // For now, lane is only cookie-backed per your requirement.

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}