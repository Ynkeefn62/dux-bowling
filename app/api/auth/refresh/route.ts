import { NextResponse } from "next/server";
import { supabaseAnonServer } from "@/app/lib/supabase/server";
import { getRefreshToken, setAuthCookies, clearAuthCookies } from "../_cookies";

export async function POST() {
  try {
    const refresh = getRefreshToken();
    if (!refresh) return NextResponse.json({ ok: false, error: "No refresh token." }, { status: 401 });

    const supabase = supabaseAnonServer();
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refresh });

    if (error || !data.session) {
      clearAuthCookies();
      return NextResponse.json({ ok: false, error: error?.message ?? "Refresh failed" }, { status: 401 });
    }

    setAuthCookies(data.session.access_token, data.session.refresh_token);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}