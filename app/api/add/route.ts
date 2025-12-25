import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { a, b } = await request.json();

    if (typeof a !== "number" || typeof b !== "number") {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const sum = a + b;

    // OPTIONAL: insert into Supabase table
    // Comment this out until the table exists
    const { error } = await supabase
      .from("calculations")
      .insert([{ a, b}]);

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Database insert failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sum });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}