import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * IMPORTANT:
 * These MUST exist in Vercel env vars
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, serviceKey);

function scoreDuckpin(frames: number[][]) {
  let total = 0;
  const rolls = frames.flat();
  let i = 0;

  for (let frame = 0; frame < 10; frame++) {
    const r1 = rolls[i] ?? 0;
    const r2 = rolls[i + 1] ?? 0;
    const r3 = rolls[i + 2] ?? 0;

    // Strike
    if (r1 === 10) {
      total += 10 + r2 + r3;
      i += 1;
      continue;
    }

    // Spare
    if (r1 + r2 === 10 || r1 + r2 + r3 === 10) {
      total += 10 + (rolls[i + 3] ?? 0);
      i += r1 + r2 === 10 ? 2 : 3;
      continue;
    }

    // Open frame
    total += r1 + r2 + r3;
    i += 3;
  }

  return total;
}

export async function POST(req: Request) {
  try {
    const { game_id, frame_number, rolls } = await req.json();

    // Insert frame
    const { error: insertError } = await supabase
      .from("test_frames")
      .insert({
        game_id,
        frame_number,
        rolls
      });

    if (insertError) {
      console.error(insertError);
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }

    // Fetch all frames for game
    const { data: frames, error: fetchError } = await supabase
      .from("test_frames")
      .select("rolls")
      .eq("game_id", game_id)
      .order("frame_number");

    if (fetchError || !frames) {
      return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }

    const score = scoreDuckpin(frames.map(f => f.rolls));

    // Update game score
    await supabase
      .from("test_games")
      .update({ score })
      .eq("id", game_id);

    return NextResponse.json({ score });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}