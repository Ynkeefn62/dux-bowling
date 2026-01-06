import { NextResponse } from "next/server";
import { supabaseAnonServer, supabaseAdminServer } from "@/app/lib/supabase/server";
import { getAccessToken, clearAuthCookies } from "../_cookies";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: Request) {
  try {
    const access = getAccessToken();
    if (!access) return bad("Not logged in.", 401);

    const { new_password } = await req.json();
    if (!new_password || String(new_password).length < 8) {
      return bad("New password must be at least 8 characters.");
    }

    const anon = supabaseAnonServer();
    const { data: u, error: uErr } = await anon.auth.getUser(access);
    if (uErr || !u.user?.id) return bad("Session invalid.", 401);

    const admin = supabaseAdminServer();
    const { error } = await admin.auth.admin.updateUserById(u.user.id, { password: new_password });

    if (error) return bad(error.message, 400);

    // Optional: force re-login after password change
    clearAuthCookies();

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}