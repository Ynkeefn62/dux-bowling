// app/api/dev/ensure-user/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthCookies } from "@/app/api/auth/_cookies";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}

export async function POST() {
  const { accessToken } = getAuthCookies();
  if (!accessToken) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const admin = supabaseAdmin();

  // Validate token and get user
  const { data: userData, error: userErr } = await admin.auth.getUser(accessToken);
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const u = userData.user;

  // Pull from public.profiles (optional)
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
    user_type: "Bowler" as const
  };

  const { error: upsertErr } = await admin
    .from("dev_users")
    .upsert(payload, { onConflict: "dev_user_id" });

  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 });

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