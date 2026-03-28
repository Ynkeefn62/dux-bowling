import { NextResponse } from "next/server";
import { supabaseAdminServer } from "@/app/lib/supabase/server";
import { requireAdmin } from "../_guard";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const admin = supabaseAdminServer();

  const [
    alleysRes, profilesRes, gamesRes,
    serviceReqRes, subscriptionsRes, paymentsRes,
    leaguesRes,
  ] = await Promise.all([
    admin.from("dux_alleys").select("id, name, city, state"),
    admin.from("profiles").select("id, email, first_name, last_name, username, user_type, created_at"),
    admin.from("dux_games").select("id, user_id, alley_id, score, status, played_at"),
    admin.from("dux_service_requests").select("*, dux_lanes(lane_number), profiles!submitted_by(email)"),
    admin.from("dux_subscriptions").select("*"),
    admin.from("dux_payments").select("*, dux_alleys(name)").order("created_at", { ascending: false }).limit(100),
    admin.from("dux_leagues").select("alley_id, status"),
  ]);

  const alleys      = (alleysRes.data      ?? []) as any[];
  const profiles    = (profilesRes.data    ?? []) as any[];
  const games       = (gamesRes.data       ?? []) as any[];
  const rawRequests = (serviceReqRes.data  ?? []) as any[];
  const subs        = (subscriptionsRes.data ?? []) as any[];
  const rawPayments = (paymentsRes.data    ?? []) as any[];
  const leagues     = (leaguesRes.data     ?? []) as any[];

  // Also fetch dux_bowler_profiles for stats
  const { data: bowlerProfiles } = await admin
    .from("dux_bowler_profiles")
    .select("user_id, display_name, games_played, average_score, highest_game");
  const bpMap = new Map((bowlerProfiles ?? []).map((b: any) => [b.user_id, b]));

  // Also fetch account_status from profiles (we store freeze state there)
  // For now we derive from user metadata — frozen users have user_type = "bowler_frozen"

  // ── Build alley summaries ─────────────────────────────────
  const alleyMap = new Map(alleys.map((a: any) => [a.id, a]));
  const subMap   = new Map(subs.map((s: any) => [s.alley_id, s]));

  const alleySummaries = alleys.map((a: any) => {
    const sub = subMap.get(a.id);
    const alleyGames  = games.filter((g: any) => g.alley_id === a.id);
    const alleyReqs   = rawRequests.filter((r: any) => r.alley_id === a.id && !["resolved","closed"].includes(r.status));
    const alleyLeagues = leagues.filter((l: any) => l.alley_id === a.id && ["active","forming"].includes(l.status));

    // Find owner
    const ownerProfile = profiles.find((p: any) => p.id === a.owner_user_id);

    return {
      id:                  a.id,
      name:                a.name,
      city:                a.city,
      state:               a.state,
      lane_count:          a.lane_count ?? 0,
      subscription_status: sub?.status ?? null,
      monthly_total_cents: ((sub?.software_monthly_cents ?? 0) + (sub?.hardware_monthly_cents ?? 0)) || null,
      owner_email:         ownerProfile?.email ?? null,
      games_total:         alleyGames.length,
      open_requests:       alleyReqs.length,
      active_leagues:      alleyLeagues.length,
    };
  });

  // ── Build bowler summaries ────────────────────────────────
  const bowlerSummaries = profiles
    .filter((p: any) => p.user_type === "bowler" || p.user_type === "bowler_frozen")
    .map((p: any) => {
      const bp = bpMap.get(p.id) as any;
      return {
        id:             p.id,
        user_id:        p.id,
        email:          p.email,
        display_name:   bp?.display_name ?? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || null,
        username:       p.username,
        user_type:      p.user_type,
        games_played:   bp?.games_played ?? 0,
        average_score:  bp?.average_score ?? null,
        highest_game:   bp?.highest_game ?? null,
        created_at:     p.created_at,
        account_status: p.user_type === "bowler_frozen" ? "frozen" : "active",
      };
    });

  // ── Build service request summaries ──────────────────────
  const serviceRequests = rawRequests.map((r: any) => ({
    id:             r.id,
    alley_name:     alleyMap.get(r.alley_id)?.name ?? "Unknown",
    lane_number:    r.dux_lanes?.lane_number ?? null,
    request_type:   r.request_type,
    severity:       r.severity,
    machine_down:   r.machine_down,
    description:    r.description,
    status:         r.status,
    created_at:     r.created_at,
    resolved_at:    r.resolved_at,
    submitter_email: (r.profiles as any)?.email ?? null,
  }));

  // ── Build payment summaries ───────────────────────────────
  const paymentSummaries = rawPayments.map((p: any) => ({
    id:           p.id,
    alley_name:   (p.dux_alleys as any)?.name ?? "Unknown",
    amount_cents: p.amount_cents,
    status:       p.status,
    description:  p.description,
    paid_at:      p.paid_at,
    created_at:   p.created_at,
    invoice_url:  p.invoice_url,
  }));

  // ── Overview stats ────────────────────────────────────────
  const mrr = subs
    .filter((s: any) => s.status === "active")
    .reduce((sum: number, s: any) => sum + (s.software_monthly_cents ?? 0) + (s.hardware_monthly_cents ?? 0), 0);

  const overview = {
    total_alleys:          alleys.length,
    active_subscriptions:  subs.filter((s: any) => s.status === "active").length,
    total_bowlers:         bowlerSummaries.length,
    total_games:           games.length,
    open_service_requests: rawRequests.filter((r: any) => !["resolved","closed"].includes(r.status)).length,
    critical_requests:     rawRequests.filter((r: any) => r.severity === "critical" && !["resolved","closed"].includes(r.status)).length,
    mrr_cents:             mrr,
    payments_due_cents:    rawPayments.filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + p.amount_cents, 0),
  };

  return NextResponse.json({
    ok: true,
    overview,
    alleys:          alleySummaries,
    bowlers:         bowlerSummaries,
    serviceRequests: serviceRequests.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    payments:        paymentSummaries,
  });
}