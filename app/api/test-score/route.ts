import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.json();
  const { gameId, frame, roll1, roll2, roll3, frameScore } = body;

  const { error } = await supabase
    .from("test_frames")
    .insert({
      game_id: gameId,
      frame_number: frame,
      roll_1: roll1,
      roll_2: roll2,
      roll_3: roll3,
      frame_score: frameScore
    });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}