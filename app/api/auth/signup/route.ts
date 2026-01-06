import { NextResponse } from "next/server";
import { supabaseAnonServer, supabaseAdminServer } from "@/app/lib/supabase/server";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: Request) {
  try {
    const { email, password, first_name, last_name, username } = await req.json();

    if (!email || !password || !first_name || !last_name || !username) {
      return bad("Missing required fields.");
    }

    const uname = String(username).trim();
    if (uname.length < 3 || uname.length > 24) {
      return bad("Username must be between 3 and 24 characters.");
    }

    const admin = supabaseAdminServer();

    // Ensure username is unique
    const { data: existing, error: exErr } = await admin
      .from("profiles")
      .select("id")
      .eq("username", uname)
      .maybeSingle();

    if (exErr) return bad(exErr.message, 500);
    if (existing) return bad("That username is already taken.");

    const anon = supabaseAnonServer();

    const { data, error } = await anon.auth.signUp({
      email,
      password,
      options: {
        data: { first_name, last_name, username: uname }
      }
    });

    if (error) return bad(error.message, 400);
    if (!data.user) return bad("No user returned from signup.", 500);

    // Create profile row (role defaults to bowler)
    const { error: profErr } = await admin.from("profiles").insert([
      {
        id: data.user.id,
        email,
        first_name,
        last_name,
        username: uname,
        user_type: "bowler"
      }
    ]);

    if (profErr) {
      // If profile insert fails, return a clear message (common cause: RLS/constraints)
      return bad(`Profile insert failed: ${profErr.message}`, 400);
    }

    // If email confirmations are ON, session may be null until confirmed.
    const hasSession = Boolean(data.session);

    return NextResponse.json({
      ok: true,
      needs_email_confirm: !hasSession,
      message: hasSession
        ? "Account created and signed in."
        : "Account created. Please confirm your email to finish sign-in."
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}