import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST() {
  const jar = await cookies();
  const access = jar.get("sb_access_token")?.value;

  // Best-effort revoke (still clear cookies even if this fails)
  if (SUPABASE_URL && SUPABASE_ANON && access) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${access}`
      }
    }).catch(() => {});
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set("sb_access_token", "", { path: "/", maxAge: 0 });
  response.cookies.set("sb_refresh_token", "", { path: "/", maxAge: 0 });

  return response;
}