import { NextResponse } from "next/server";
import { clearAuthCookies, getTokensFromCookies, SUPABASE_AUTH_BASE } from "../_helpers";

export async function POST() {
  const { access } = getTokensFromCookies();

  // Best-effort: tell Supabase to revoke session
  if (access) {
    try {
      await fetch(`${SUPABASE_AUTH_BASE}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`
        }
      });
    } catch {
      // ignore
    }
  }

  clearAuthCookies();
  return NextResponse.json({ ok: true });
}