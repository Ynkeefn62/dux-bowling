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
    if (!/^[a-zA-Z0-9_]+$/.test(uname)) {
      return bad("Username can only contain letters, numbers, and underscores.");
    }

    const admin = supabaseAdminServer();

    // Check username uniqueness
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("username", uname)
      .maybeSingle();

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

    // Use upsert instead of insert — Supabase may have already created a profiles
    // row via a database trigger on auth.users. Upsert handles both cases safely.
    const { error: profErr } = await admin
      .from("profiles")
      .upsert(
        {
          id:        data.user.id,
          email,
          first_name,
          last_name,
          username:  uname,
          user_type: "bowler",
        },
        { onConflict: "id" }
      );

    if (profErr) {
      return bad(`Could not save profile: ${profErr.message}`, 500);
    }

    const hasSession = Boolean(data.session);

    return NextResponse.json({
      ok: true,
      needs_email_confirm: !hasSession,
      message: hasSession
        ? "Account created and signed in."
        : "Account created. Please confirm your email to finish sign-in.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}
