import { NextResponse } from "next/server";
import { authHeaders, clearSessionCookies, getAccessTokenFromCookies, getSupabaseAuthUrl } from "@/app/lib/authServer";

export async function POST() {
  const access = getAccessTokenFromCookies();

  // Tell Supabase to revoke session (best effort)
  if (access) {
    await fetch(getSupabaseAuthUrl("/logout"), {
      method: "POST",
      headers: authHeaders({ Authorization: `Bearer ${access}` })
    });
  }

  clearSessionCookies();
  return NextResponse.json({ ok: true });
}