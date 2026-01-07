import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}

// If you're using server-only auth cookies already, you likely have a helper.
// For now, we’ll read the Supabase access token cookie you set during login.
// If your cookie name differs, tell me and I’ll adjust.
function getAccessTokenFromCookies() {
  const jar = cookies();
  return jar.get("sb-access-token")?.value ?? null;
}

export async function POST() {
  const token = getAccessTokenFromCookies();
  if (!token) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const admin = supabaseAdmin();

  // Validate token → get user
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const u = userData.user;

  // Pull names/username from public.profiles if you want
  const { data: profile } = await admin
    .from("profiles")
    .select("first_name,last_name,username,role")
    .eq("id", u.id)
    .maybeSingle();

  const payload = {
    dev_user_id: u.id,
    email: u.email ?? null,
    first_name: profile?.first_name ?? null,
    last_name: profile?.last_name ?? null,
    username: profile?.username ?? null,
    user_type: (profile?.role ?? "Bowler") === "bowler" ? "Bowler" : "Bowler"
  };

  // Upsert dev_users
  const { error: upsertErr } = await admin.from("dev_users").upsert(payload, { onConflict: "dev_user_id" });
  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  // Ensure dev_bowlers row exists
  const { data: bowlerRow } = await admin
    .from("dev_bowlers")
    .select("dev_bowler_id")
    .eq("dev_user_id", u.id)
    .maybeSingle();

  if (!bowlerRow) {
    const { error: bErr } = await admin.from("dev_bowlers").insert({ dev_user_id: u.id });
    if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}