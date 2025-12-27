import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Supabase environment variables are missing");
}

const supabase = createClient(supabaseUrl, serviceKey);

export async function POST(req: Request) {
  const body = await req.json();

  const { error } = await supabase
    .from("test_frames")
    .insert(body);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}