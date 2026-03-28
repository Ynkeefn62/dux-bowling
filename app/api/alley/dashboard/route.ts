import { NextResponse } from "next/server";
import { supabaseAdminServer, supabaseAnonServer } from "@/app/lib/supabase/server";
import { getAccessToken } from "@/app/api/auth/_cookies";

export async function GET() {
  const access = getAccessToken();
  if (!access) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  const anon = supabaseAnonServer();
  const { data: userData } = await anon.auth.getUser(access);
  if (!userData?.user?.id) return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });

  const admin = supabaseAdminServer();
  const userId = userData.user.id;

  // Find alley owned by this user — for now we match by checking profiles.user_type
  // In production, dux_alleys.owner_user_id will be set during onboarding
  const { data: alley } = await admin
    .from("dux_alleys")
    .select("id, name, city, state")
    .eq("owner_user_id", userId)
    .maybeSingle();

  // If no owned alley found, return first alley as a fallback for demo
  // (Remove this fallback once onboarding assigns owner_user_id)
  const { data: fallbackAlley } = !alley
    ? await admin.from("dux_alleys").select("id, name, city, state").limit(1).single()
    : { data: null };

  const effectiveAlley = alley ?? fallbackAlley;
  if (!effectiveAlley) return NextResponse.json({ ok: true, alley: null, lanes: [], serviceRequests: [], leagues: [], tournaments: [], subscription: null, payments: [] });

  const alleyId = effectiveAlley.id;

  // Fetch all data in parallel
  const [lanesRes, srRes, leaguesRes, tourneysRes, subRes, paymentsRes] = await Promise.all([
    admin.from("dux_lanes").select("*").eq("alley_id", alleyId).order("lane_number"),
    admin.from("dux_service_requests").select("*, dux_lanes(lane_number)").eq("alley_id", alleyId).order("created_at", { ascending: false }).limit(50),
    admin.from("dux_leagues").select("*").eq("alley_id", alleyId).order("created_at", { ascending: false }),
    admin.from("dux_tournaments").select("*").eq("alley_id", alleyId).order("event_date", { ascending: true }),
    admin.from("dux_subscriptions").select("*").eq("alley_id", alleyId).maybeSingle(),
    admin.from("dux_payments").select("*").eq("alley_id", alleyId).order("created_at", { ascending: false }).limit(24),
  ]);

  // Flatten lane_number from joined dux_lanes onto service requests
  const serviceRequests = (srRes.data ?? []).map((r: any) => ({
    ...r,
    lane_number: r.dux_lanes?.lane_number ?? null,
    dux_lanes: undefined,
  }));

  return NextResponse.json({
    ok: true,
    alley: effectiveAlley,
    lanes: lanesRes.data ?? [],
    serviceRequests,
    leagues: leaguesRes.data ?? [],
    tournaments: tourneysRes.data ?? [],
    subscription: subRes.data ?? null,
    payments: paymentsRes.data ?? [],
  });
}