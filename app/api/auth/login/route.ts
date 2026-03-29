import { NextResponse } from "next/server";
import { supabaseAnonServer } from "@/app/lib/supabase/server";
import { setAuthCookies } from "../_cookies";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: Request) {
  try {
    const { email, password, remember = true } = await req.json();
    if (!email || !password) return bad("Email and password are required.");

    const supabase = supabaseAnonServer();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Give a clear, specific message
      if (error.message.toLowerCase().includes("invalid")) {
        return bad("Incorrect email or password.", 401);
      }
      return bad(error.message, 401);
    }
    if (!data.session) return bad("No session returned. Please confirm your email first.", 401);

    setAuthCookies(data.session.access_token, data.session.refresh_token, Boolean(remember));

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}
