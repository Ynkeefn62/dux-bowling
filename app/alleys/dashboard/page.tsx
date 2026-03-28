"use client";

import { useEffect, useState } from "react";

// ── Design tokens ─────────────────────────────────────────────
const ORANGE      = "#e46a2e";
const ORANGE_SOFT = "rgba(228,106,46,0.12)";
const BG          = "#121212";
const PANEL       = "rgba(26,26,26,0.90)";
const BORDER      = "rgba(255,255,255,0.09)";
const TEXT        = "#f2f2f2";
const MUTED       = "rgba(242,242,242,0.62)";
const SHADOW      = "0 18px 45px rgba(0,0,0,0.55)";
const GREEN       = "#4ade80";
const YELLOW      = "#facc15";
const RED         = "#f87171";

// ── Types ─────────────────────────────────────────────────────
type Tab = "overview" | "lanes" | "service" | "leagues" | "tournaments" | "payments";

type Lane = {
  id: string;
  lane_number: number;
  status: "active" | "maintenance" | "offline";
  pinsetter_serial: string | null;
  last_service_at: string | null;
  notes: string | null;
  games_today?: number;
};

type ServiceRequest = {
  id: string;
  lane_id: string | null;
  lane_number?: number | null;
  request_type: string;
  severity: "low" | "medium" | "high" | "critical";
  machine_down: boolean;
  description: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
};

type League = {
  id: string;
  name: string;
  season: string | null;
  day_of_week: string | null;
  start_time: string | null;
  start_date: string | null;
  end_date: string | null;
  max_teams: number | null;
  ndbc_sanctioned: boolean;
  status: string;
  entry_fee_cents: number | null;
  team_count?: number;
};

type Tournament = {
  id: string;
  name: string;
  format: string;
  event_date: string | null;
  registration_close: string | null;
  capacity: number | null;
  entry_fee_cents: number | null;
  prize_description: string | null;
  ndbc_sanctioned: boolean;
  status: string;
};

type Subscription = {
  plan: string;
  status: string;
  software_lanes: number;
  hardware_lanes: number;
  software_monthly_cents: number | null;
  hardware_monthly_cents: number | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
};

type Payment = {
  id: string;
  amount_cents: number;
  status: string;
  description: string | null;
  paid_at: string | null;
  created_at: string;
  invoice_url: string | null;
};

// ── Shared UI components ───────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: PANEL, border: `1px solid ${BORDER}`,
      borderRadius: 18, padding: "1.25rem",
      boxShadow: SHADOW, backdropFilter: "blur(8px)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ margin: "0 0 1rem", fontSize: "1.05rem", fontWeight: 900, color: ORANGE, letterSpacing: ".03em" }}>
      {children}
    </h2>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: "inline-block", padding: ".25rem .6rem",
      borderRadius: 999, background: `${color}18`,
      border: `1px solid ${color}44`,
      color, fontWeight: 900, fontSize: ".72rem",
      letterSpacing: ".04em", textTransform: "capitalize",
    }}>
      {label}
    </span>
  );
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "active" || s === "open" || s === "paid" || s === "forming") return GREEN;
  if (s === "maintenance" || s === "in_progress" || s === "pending" || s === "trialing") return YELLOW;
  if (s === "offline" || s === "critical" || s === "failed" || s === "past_due") return RED;
  if (s === "resolved" || s === "closed" || s === "completed") return MUTED;
  return MUTED;
}

function severityColor(s: string): string {
  if (s === "critical") return RED;
  if (s === "high") return "#fb923c";
  if (s === "medium") return YELLOW;
  return GREEN;
}

function dollars(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function capitalize(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ── Modal wrapper ──────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
      display: "grid", placeItems: "center", zIndex: 200, padding: "1rem",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#1c1c1c", border: `1px solid ${BORDER}`,
        borderRadius: 20, padding: "1.5rem",
        width: "min(540px, 96vw)", maxHeight: "90vh", overflowY: "auto",
        fontFamily: "Montserrat, system-ui", color: TEXT,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h3 style={{ margin: 0, color: ORANGE, fontWeight: 900 }}>{title}</h3>
          <button onClick={onClose} style={{ border: 0, background: "transparent", color: MUTED, fontSize: "1.4rem", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: ".85rem" }}>
      <label style={{ display: "block", fontSize: ".78rem", color: MUTED, fontWeight: 700, marginBottom: ".3rem", letterSpacing: ".03em" }}>
        {label.toUpperCase()}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: ".65rem .75rem", borderRadius: 10,
  border: `1px solid ${BORDER}`, background: "#111",
  color: TEXT, fontFamily: "Montserrat, system-ui", fontSize: ".9rem",
};

const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "none" as any };

function SubmitBtn({ label, loading, onClick }: { label: string; loading?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      width: "100%", padding: ".85rem", borderRadius: 12,
      border: 0, background: ORANGE, color: "#fff",
      fontWeight: 900, fontSize: ".95rem", cursor: loading ? "default" : "pointer",
      opacity: loading ? 0.65 : 1, marginTop: ".5rem",
      fontFamily: "Montserrat, system-ui",
    }}>
      {loading ? "Saving…" : label}
    </button>
  );
}

// ── Stat tile ──────────────────────────────────────────────────
function StatTile({ value, label, sub }: { value: string | number; label: string; sub?: string }) {
  return (
    <Card style={{ textAlign: "center", padding: "1rem" }}>
      <div style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 900, color: ORANGE }}>{value}</div>
      <div style={{ fontWeight: 900, fontSize: ".82rem", color: TEXT, marginTop: ".2rem" }}>{label}</div>
      {sub && <div style={{ fontSize: ".72rem", color: MUTED, marginTop: ".15rem" }}>{sub}</div>}
    </Card>
  );
}

// ── Empty state ────────────────────────────────────────────────
function Empty({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: MUTED }}>
      <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>{icon}</div>
      <div style={{ fontWeight: 700 }}>{message}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ── MAIN PAGE ─────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
export default function AlleyDashboardPage() {
  const [tab, setTab]         = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [alleyName, setAlleyName] = useState("Your Alley");

  // Data states
  const [lanes, setLanes]             = useState<Lane[]>([]);
  const [requests, setRequests]       = useState<ServiceRequest[]>([]);
  const [leagues, setLeagues]         = useState<League[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments]       = useState<Payment[]>([]);

  // Modal states
  const [showSRModal, setShowSRModal]     = useState(false);
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [showTourneyModal, setShowTourneyModal] = useState(false);
  const [editSR, setEditSR]               = useState<ServiceRequest | null>(null);
  const [editLeague, setEditLeague]       = useState<League | null>(null);
  const [editTourney, setEditTourney]     = useState<Tournament | null>(null);

  // Auth check + data load
  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { cache: "no-store" }).then(r => r.json());
        if (!me?.user?.id) { setLoggedIn(false); setLoading(false); return; }
        setLoggedIn(true);

        // Load all data via the admin API route
        const data = await fetch("/api/alley/dashboard", { cache: "no-store" }).then(r => r.json());

        if (data.ok) {
          setAlleyName(data.alley?.name ?? "Your Alley");
          setLanes(data.lanes ?? []);
          setRequests(data.serviceRequests ?? []);
          setLeagues(data.leagues ?? []);
          setTournaments(data.tournaments ?? []);
          setSubscription(data.subscription ?? null);
          setPayments(data.payments ?? []);
        }
      } catch {
        // Silently handle — shows empty states
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openRequests   = requests.filter(r => r.status === "open" || r.status === "in_progress");
  const activeLeagues  = leagues.filter(l => l.status === "active" || l.status === "forming");
  const upcomingTourneys = tournaments.filter(t => t.status === "open" || t.status === "draft");
  const activeLanes    = lanes.filter(l => l.status === "active").length;
  const offlineLanes   = lanes.filter(l => l.status !== "active").length;

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: "overview",     label: "Overview" },
    { id: "lanes",        label: "Lanes",        badge: offlineLanes > 0 ? offlineLanes : undefined },
    { id: "service",      label: "Service",       badge: openRequests.length > 0 ? openRequests.length : undefined },
    { id: "leagues",      label: "Leagues" },
    { id: "tournaments",  label: "Tournaments" },
    { id: "payments",     label: "Payments" },
  ];

  if (!loggedIn && !loading) {
    return (
      <main style={{ minHeight: "100vh", background: BG, display: "grid", placeItems: "center", fontFamily: "Montserrat, system-ui", color: TEXT }}>
        <Card style={{ textAlign: "center", maxWidth: 400, width: "90vw" }}>
          <div style={{ fontSize: "2rem", marginBottom: ".75rem" }}>🔒</div>
          <div style={{ fontWeight: 900, color: ORANGE, marginBottom: ".5rem" }}>Sign in required</div>
          <div style={{ color: MUTED, fontSize: ".9rem" }}>Log in with your alley operator account to access the dashboard.</div>
        </Card>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: BG, fontFamily: "Montserrat, system-ui", color: TEXT }}>
      {/* Background glow */}
      <div aria-hidden="true" style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background:
          "radial-gradient(800px 400px at 15% 8%, rgba(228,106,46,0.16), transparent 55%)," +
          "radial-gradient(600px 300px at 88% 20%, rgba(228,106,46,0.09), transparent 55%)",
      }} />

      {/* Modals */}
      {showSRModal && (
        <ServiceRequestModal
          lanes={lanes}
          initial={editSR}
          onClose={() => { setShowSRModal(false); setEditSR(null); }}
          onSave={(req) => {
            setRequests(prev => editSR ? prev.map(r => r.id === req.id ? req : r) : [req, ...prev]);
            setShowSRModal(false); setEditSR(null);
          }}
        />
      )}
      {showLeagueModal && (
        <LeagueModal
          initial={editLeague}
          onClose={() => { setShowLeagueModal(false); setEditLeague(null); }}
          onSave={(l) => {
            setLeagues(prev => editLeague ? prev.map(x => x.id === l.id ? l : x) : [l, ...prev]);
            setShowLeagueModal(false); setEditLeague(null);
          }}
        />
      )}
      {showTourneyModal && (
        <TournamentModal
          initial={editTourney}
          onClose={() => { setShowTourneyModal(false); setEditTourney(null); }}
          onSave={(t) => {
            setTournaments(prev => editTourney ? prev.map(x => x.id === t.id ? t : x) : [t, ...prev]);
            setShowTourneyModal(false); setEditTourney(null);
          }}
        />
      )}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: ".78rem", color: MUTED, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: ".3rem" }}>
            Alley Dashboard
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(1.4rem, 4vw, 1.9rem)", fontWeight: 900, color: TEXT }}>
            {alleyName}
          </h1>
          {subscription && (
            <div style={{ marginTop: ".35rem", display: "flex", alignItems: "center", gap: ".5rem" }}>
              <Badge label={subscription.status} color={statusColor(subscription.status)} />
              <span style={{ fontSize: ".78rem", color: MUTED }}>
                {capitalize(subscription.plan)} · {subscription.software_lanes} software lane{subscription.software_lanes !== 1 ? "s" : ""}
                {subscription.hardware_lanes > 0 ? ` · ${subscription.hardware_lanes} hardware lane${subscription.hardware_lanes !== 1 ? "s" : ""}` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Tab nav */}
        <div style={{
          display: "flex", gap: ".35rem", flexWrap: "wrap",
          borderBottom: `1px solid ${BORDER}`, marginBottom: "1.5rem", paddingBottom: ".1rem",
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: ".55rem .9rem", borderRadius: "10px 10px 0 0",
              border: `1px solid ${tab === t.id ? BORDER : "transparent"}`,
              borderBottom: tab === t.id ? "1px solid #121212" : "transparent",
              background: tab === t.id ? PANEL : "transparent",
              color: tab === t.id ? ORANGE : MUTED,
              fontWeight: 900, fontSize: ".82rem", cursor: "pointer",
              fontFamily: "Montserrat, system-ui",
              position: "relative", marginBottom: -1,
            }}>
              {t.label}
              {t.badge !== undefined && (
                <span style={{
                  marginLeft: ".4rem", display: "inline-block",
                  background: RED, color: "#fff",
                  borderRadius: 999, fontSize: ".65rem",
                  fontWeight: 900, padding: ".1rem .4rem", lineHeight: 1.4,
                }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <Card><p style={{ margin: 0, color: MUTED }}>Loading…</p></Card>
        ) : (
          <>
            {tab === "overview"    && <OverviewTab lanes={lanes} requests={requests} leagues={leagues} tournaments={tournaments} subscription={subscription} payments={payments} />}
            {tab === "lanes"       && <LanesTab lanes={lanes} setLanes={setLanes} />}
            {tab === "service"     && <ServiceTab requests={requests} onNew={() => setShowSRModal(true)} onEdit={r => { setEditSR(r); setShowSRModal(true); }} onStatusChange={(id, status) => setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))} />}
            {tab === "leagues"     && <LeaguesTab leagues={leagues} onNew={() => setShowLeagueModal(true)} onEdit={l => { setEditLeague(l); setShowLeagueModal(true); }} />}
            {tab === "tournaments" && <TournamentsTab tournaments={tournaments} onNew={() => setShowTourneyModal(true)} onEdit={t => { setEditTourney(t); setShowTourneyModal(true); }} />}
            {tab === "payments"    && <PaymentsTab subscription={subscription} payments={payments} />}
          </>
        )}
      </div>
    </main>
  );
}

// ── OVERVIEW TAB ──────────────────────────────────────────────
function OverviewTab({ lanes, requests, leagues, tournaments, subscription, payments }: {
  lanes: Lane[]; requests: ServiceRequest[]; leagues: League[];
  tournaments: Tournament[]; subscription: Subscription | null; payments: Payment[];
}) {
  const openReqs    = requests.filter(r => r.status === "open" || r.status === "in_progress");
  const criticalReqs = requests.filter(r => r.severity === "critical" && r.status !== "resolved" && r.status !== "closed");
  const activeLanes  = lanes.filter(l => l.status === "active").length;
  const totalGames   = lanes.reduce((a, l) => a + (l.games_today ?? 0), 0);
  const lastPayment  = payments.find(p => p.status === "paid");

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      {/* Critical alert */}
      {criticalReqs.length > 0 && (
        <div style={{ background: "rgba(248,113,113,0.10)", border: `1px solid ${RED}44`, borderRadius: 14, padding: "1rem" }}>
          <div style={{ fontWeight: 900, color: RED, marginBottom: ".35rem" }}>
            ⚠ {criticalReqs.length} Critical Issue{criticalReqs.length > 1 ? "s" : ""}
          </div>
          {criticalReqs.map(r => (
            <div key={r.id} style={{ fontSize: ".85rem", color: MUTED }}>
              {r.lane_number ? `Lane ${r.lane_number} — ` : ""}{r.description}
            </div>
          ))}
        </div>
      )}

      {/* Stat tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
        <StatTile value={activeLanes} label="Active Lanes" sub={`${lanes.length - activeLanes} offline`} />
        <StatTile value={openReqs.length} label="Open Requests" sub="service tickets" />
        <StatTile value={leagues.filter(l => l.status === "active").length} label="Active Leagues" />
        <StatTile value={totalGames || "—"} label="Games Today" sub="across all lanes" />
      </div>

      {/* Subscription summary */}
      {subscription && (
        <Card>
          <SectionTitle>Subscription</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: ".78rem", color: MUTED, marginBottom: ".2rem" }}>Plan</div>
              <div style={{ fontWeight: 900 }}>{capitalize(subscription.plan)}</div>
            </div>
            <div>
              <div style={{ fontSize: ".78rem", color: MUTED, marginBottom: ".2rem" }}>Status</div>
              <Badge label={subscription.status} color={statusColor(subscription.status)} />
            </div>
            <div>
              <div style={{ fontSize: ".78rem", color: MUTED, marginBottom: ".2rem" }}>Monthly Total</div>
              <div style={{ fontWeight: 900, color: ORANGE }}>
                {dollars((subscription.software_monthly_cents ?? 0) + (subscription.hardware_monthly_cents ?? 0))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: ".78rem", color: MUTED, marginBottom: ".2rem" }}>Next Billing</div>
              <div style={{ fontWeight: 900 }}>{fmtDate(subscription.current_period_end)}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Recent service requests */}
      {openReqs.length > 0 && (
        <Card>
          <SectionTitle>Open Service Requests</SectionTitle>
          <div style={{ display: "grid", gap: ".6rem" }}>
            {openReqs.slice(0, 3).map(r => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: ".75rem", padding: ".65rem", background: "rgba(0,0,0,0.2)", borderRadius: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: severityColor(r.severity), flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: ".88rem" }}>{capitalize(r.request_type)}{r.lane_number ? ` — Lane ${r.lane_number}` : ""}</div>
                  <div style={{ fontSize: ".78rem", color: MUTED }}>{r.description.slice(0, 80)}{r.description.length > 80 ? "…" : ""}</div>
                </div>
                <Badge label={r.status.replace("_", " ")} color={statusColor(r.status)} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Upcoming leagues */}
      {leagues.length > 0 && (
        <Card>
          <SectionTitle>Leagues</SectionTitle>
          <div style={{ display: "grid", gap: ".5rem" }}>
            {leagues.slice(0, 4).map(l => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                <Badge label={l.status} color={statusColor(l.status)} />
                <span style={{ fontWeight: 700, flex: 1 }}>{l.name}</span>
                <span style={{ fontSize: ".8rem", color: MUTED }}>{l.day_of_week ? capitalize(l.day_of_week) : "—"}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── LANES TAB ─────────────────────────────────────────────────
function LanesTab({ lanes, setLanes }: { lanes: Lane[]; setLanes: (l: Lane[]) => void }) {
  function toggleStatus(lane: Lane) {
    const next = lane.status === "active" ? "maintenance" : "active";
    setLanes(lanes.map(l => l.id === lane.id ? { ...l, status: next as any } : l));
    // In production: PATCH /api/alley/lanes/{id} with { status: next }
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 900, color: TEXT }}>
          {lanes.length} lane{lanes.length !== 1 ? "s" : ""} registered
        </div>
        <div style={{ fontSize: ".82rem", color: MUTED }}>
          {lanes.filter(l => l.status === "active").length} active ·{" "}
          {lanes.filter(l => l.status === "maintenance").length} maintenance ·{" "}
          {lanes.filter(l => l.status === "offline").length} offline
        </div>
      </div>

      {lanes.length === 0 ? (
        <Card><Empty icon="🎳" message="No lanes registered yet. Contact Dux to add lanes to your account." /></Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {lanes.map(lane => (
            <Card key={lane.id} style={{ padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".6rem" }}>
                <div style={{ fontWeight: 900, fontSize: "1.1rem" }}>Lane {lane.lane_number}</div>
                <Badge label={lane.status} color={statusColor(lane.status)} />
              </div>
              {lane.pinsetter_serial && (
                <div style={{ fontSize: ".75rem", color: MUTED, marginBottom: ".4rem" }}>
                  Pinsetter: {lane.pinsetter_serial}
                </div>
              )}
              <div style={{ fontSize: ".75rem", color: MUTED, marginBottom: ".75rem" }}>
                Last service: {fmtDate(lane.last_service_at)}
              </div>
              {lane.notes && (
                <div style={{ fontSize: ".8rem", color: MUTED, marginBottom: ".75rem", padding: ".5rem", background: "rgba(0,0,0,0.2)", borderRadius: 8 }}>
                  {lane.notes}
                </div>
              )}
              <div style={{ display: "flex", gap: ".5rem" }}>
                <button
                  onClick={() => toggleStatus(lane)}
                  style={{
                    flex: 1, padding: ".55rem", borderRadius: 8,
                    border: `1px solid ${BORDER}`, background: "transparent",
                    color: lane.status === "active" ? YELLOW : GREEN,
                    fontWeight: 900, fontSize: ".78rem", cursor: "pointer",
                    fontFamily: "Montserrat, system-ui",
                  }}
                >
                  {lane.status === "active" ? "Mark Maintenance" : "Mark Active"}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SERVICE TAB ───────────────────────────────────────────────
function ServiceTab({ requests, onNew, onEdit, onStatusChange }: {
  requests: ServiceRequest[];
  onNew: () => void;
  onEdit: (r: ServiceRequest) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");

  const filtered = requests.filter(r => {
    if (filter === "open")     return r.status !== "resolved" && r.status !== "closed";
    if (filter === "resolved") return r.status === "resolved" || r.status === "closed";
    return true;
  });

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: ".75rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: ".35rem" }}>
          {(["open", "all", "resolved"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: ".4rem .85rem", borderRadius: 999,
              border: `1px solid ${filter === f ? ORANGE : BORDER}`,
              background: filter === f ? ORANGE_SOFT : "transparent",
              color: filter === f ? ORANGE : MUTED,
              fontWeight: 900, fontSize: ".78rem", cursor: "pointer",
              fontFamily: "Montserrat, system-ui",
            }}>
              {capitalize(f)}
            </button>
          ))}
        </div>
        <button onClick={onNew} style={{
          marginLeft: "auto", padding: ".5rem 1rem", borderRadius: 10,
          border: 0, background: ORANGE, color: "#fff",
          fontWeight: 900, fontSize: ".82rem", cursor: "pointer",
          fontFamily: "Montserrat, system-ui",
        }}>
          + New Request
        </button>
      </div>

      {filtered.length === 0 ? (
        <Card><Empty icon="✅" message={filter === "open" ? "No open service requests." : "No requests found."} /></Card>
      ) : (
        <div style={{ display: "grid", gap: ".75rem" }}>
          {filtered.map(r => (
            <Card key={r.id} style={{ padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".3rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 900 }}>{capitalize(r.request_type)}</span>
                    {r.lane_number && <span style={{ fontSize: ".78rem", color: MUTED }}>Lane {r.lane_number}</span>}
                    {r.machine_down && <Badge label="Machine Down" color={RED} />}
                  </div>
                  <div style={{ fontSize: ".85rem", color: MUTED, marginBottom: ".4rem", lineHeight: 1.55 }}>{r.description}</div>
                  <div style={{ fontSize: ".72rem", color: MUTED }}>Submitted {fmtDate(r.created_at)}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: ".4rem", flexShrink: 0 }}>
                  <Badge label={r.severity} color={severityColor(r.severity)} />
                  <Badge label={r.status.replace("_", " ")} color={statusColor(r.status)} />
                </div>
              </div>
              <div style={{ display: "flex", gap: ".5rem", marginTop: ".75rem", flexWrap: "wrap" }}>
                {r.status === "open" && (
                  <button onClick={() => onStatusChange(r.id, "in_progress")} style={{ padding: ".4rem .8rem", borderRadius: 8, border: `1px solid ${YELLOW}44`, background: "transparent", color: YELLOW, fontWeight: 900, fontSize: ".75rem", cursor: "pointer", fontFamily: "Montserrat, system-ui" }}>
                    Mark In Progress
                  </button>
                )}
                {(r.status === "open" || r.status === "in_progress" || r.status === "waiting_parts") && (
                  <button onClick={() => onStatusChange(r.id, "resolved")} style={{ padding: ".4rem .8rem", borderRadius: 8, border: `1px solid ${GREEN}44`, background: "transparent", color: GREEN, fontWeight: 900, fontSize: ".75rem", cursor: "pointer", fontFamily: "Montserrat, system-ui" }}>
                    Mark Resolved
                  </button>
                )}
                <button onClick={() => onEdit(r)} style={{ padding: ".4rem .8rem", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: MUTED, fontWeight: 900, fontSize: ".75rem", cursor: "pointer", fontFamily: "Montserrat, system-ui" }}>
                  Edit
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── LEAGUES TAB ───────────────────────────────────────────────
function LeaguesTab({ leagues, onNew, onEdit }: { leagues: League[]; onNew: () => void; onEdit: (l: League) => void }) {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onNew} style={{ padding: ".5rem 1rem", borderRadius: 10, border: 0, background: ORANGE, color: "#fff", fontWeight: 900, fontSize: ".82rem", cursor: "pointer", fontFamily: "Montserrat, system-ui" }}>
          + New League
        </button>
      </div>

      {leagues.length === 0 ? (
        <Card><Empty icon="🏅" message="No leagues yet. Create your first league to get started." /></Card>
      ) : (
        <div style={{ display: "grid", gap: ".75rem" }}>
          {leagues.map(l => (
            <Card key={l.id} style={{ padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".3rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 900, fontSize: "1rem" }}>{l.name}</span>
                    {l.season && <span style={{ fontSize: ".78rem", color: MUTED }}>{l.season}</span>}
                    {l.ndbc_sanctioned && <Badge label="NDBC Sanctioned" color={ORANGE} />}
                  </div>
                  <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", fontSize: ".82rem", color: MUTED }}>
                    {l.day_of_week && <span>📅 {capitalize(l.day_of_week)}{l.start_time ? ` at ${l.start_time}` : ""}</span>}
                    {l.team_count !== undefined && <span>👥 {l.team_count}{l.max_teams ? `/${l.max_teams}` : ""} teams</span>}
                    {l.entry_fee_cents && <span>💰 {dollars(l.entry_fee_cents)} entry</span>}
                    {l.start_date && <span>Starts {fmtDate(l.start_date)}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: ".5rem" }}>
                  <Badge label={l.status} color={statusColor(l.status)} />
                  <button onClick={() => onEdit(l)} style={{ padding: ".4rem .8rem", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: MUTED, fontWeight: 900, fontSize: ".75rem", cursor: "pointer", fontFamily: "Montserrat, system-ui" }}>
                    Edit
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TOURNAMENTS TAB ───────────────────────────────────────────
function TournamentsTab({ tournaments, onNew, onEdit }: { tournaments: Tournament[]; onNew: () => void; onEdit: (t: Tournament) => void }) {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onNew} style={{ padding: ".5rem 1rem", borderRadius: 10, border: 0, background: ORANGE, color: "#fff", fontWeight: 900, fontSize: ".82rem", cursor: "pointer", fontFamily: "Montserrat, system-ui" }}>
          + New Tournament
        </button>
      </div>

      {tournaments.length === 0 ? (
        <Card><Empty icon="🏆" message="No tournaments yet. Create your first tournament." /></Card>
      ) : (
        <div style={{ display: "grid", gap: ".75rem" }}>
          {tournaments.map(t => (
            <Card key={t.id} style={{ padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".3rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 900 }}>{t.name}</span>
                    {t.ndbc_sanctioned && <Badge label="NDBC" color={ORANGE} />}
                  </div>
                  <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", fontSize: ".82rem", color: MUTED }}>
                    <span>📋 {capitalize(t.format)}</span>
                    {t.event_date && <span>📅 {fmtDate(t.event_date)}</span>}
                    {t.capacity && <span>👥 {t.capacity} bowlers</span>}
                    {t.entry_fee_cents && <span>💰 {dollars(t.entry_fee_cents)} entry</span>}
                    {t.prize_description && <span>🏆 {t.prize_description}</span>}
                  </div>
                  {t.registration_close && (
                    <div style={{ fontSize: ".75rem", color: MUTED, marginTop: ".3rem" }}>
                      Registration closes: {fmtDate(t.registration_close)}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: ".5rem" }}>
                  <Badge label={t.status} color={statusColor(t.status)} />
                  <button onClick={() => onEdit(t)} style={{ padding: ".4rem .8rem", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: MUTED, fontWeight: 900, fontSize: ".75rem", cursor: "pointer", fontFamily: "Montserrat, system-ui" }}>
                    Edit
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── PAYMENTS TAB ──────────────────────────────────────────────
function PaymentsTab({ subscription, payments }: { subscription: Subscription | null; payments: Payment[] }) {
  const softwareTotal = (subscription?.software_monthly_cents ?? 0);
  const hardwareTotal = (subscription?.hardware_monthly_cents ?? 0);
  const monthlyTotal  = softwareTotal + hardwareTotal;

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      {/* Subscription breakdown */}
      <Card>
        <SectionTitle>Monthly Billing</SectionTitle>
        {!subscription ? (
          <p style={{ margin: 0, color: MUTED }}>No active subscription. Contact andrew@duxbowling.com to get started.</p>
        ) : (
          <>
            <div style={{ display: "grid", gap: ".6rem", marginBottom: "1rem" }}>
              {softwareTotal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: ".6rem .75rem", background: "rgba(0,0,0,0.2)", borderRadius: 10 }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: ".88rem" }}>Software Subscription</div>
                    <div style={{ fontSize: ".75rem", color: MUTED }}>{subscription.software_lanes} lane{subscription.software_lanes !== 1 ? "s" : ""} × $100/month</div>
                  </div>
                  <div style={{ fontWeight: 900, color: ORANGE }}>{dollars(softwareTotal)}</div>
                </div>
              )}
              {hardwareTotal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: ".6rem .75rem", background: "rgba(0,0,0,0.2)", borderRadius: 10 }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: ".88rem" }}>Hardware Lease</div>
                    <div style={{ fontSize: ".75rem", color: MUTED }}>{subscription.hardware_lanes} pinsetter{subscription.hardware_lanes !== 1 ? "s" : ""} × ~$450/month</div>
                  </div>
                  <div style={{ fontWeight: 900, color: ORANGE }}>{dollars(hardwareTotal)}</div>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: ".6rem .75rem", background: ORANGE_SOFT, borderRadius: 10, border: `1px solid rgba(228,106,46,0.22)` }}>
                <div style={{ fontWeight: 900 }}>Total Monthly</div>
                <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.1rem" }}>{dollars(monthlyTotal)}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem", fontSize: ".82rem" }}>
              <div>
                <div style={{ color: MUTED, marginBottom: ".2rem" }}>Billing Status</div>
                <Badge label={subscription.status} color={statusColor(subscription.status)} />
              </div>
              <div>
                <div style={{ color: MUTED, marginBottom: ".2rem" }}>Next Payment</div>
                <div style={{ fontWeight: 900 }}>{fmtDate(subscription.current_period_end)}</div>
              </div>
              {subscription.trial_ends_at && (
                <div>
                  <div style={{ color: MUTED, marginBottom: ".2rem" }}>Trial Ends</div>
                  <div style={{ fontWeight: 900 }}>{fmtDate(subscription.trial_ends_at)}</div>
                </div>
              )}
            </div>
          </>
        )}
      </Card>

      {/* Payment history */}
      <Card>
        <SectionTitle>Payment History</SectionTitle>
        {payments.length === 0 ? (
          <Empty icon="💳" message="No payment history yet." />
        ) : (
          <div style={{ display: "grid", gap: ".5rem" }}>
            {payments.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: ".65rem .75rem", background: "rgba(0,0,0,0.2)", borderRadius: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: ".88rem" }}>{p.description ?? "Monthly invoice"}</div>
                  <div style={{ fontSize: ".72rem", color: MUTED }}>{fmtDate(p.paid_at ?? p.created_at)}</div>
                </div>
                <Badge label={p.status} color={statusColor(p.status)} />
                <div style={{ fontWeight: 900, color: p.status === "paid" ? GREEN : TEXT, fontSize: ".95rem", flexShrink: 0 }}>
                  {dollars(p.amount_cents)}
                </div>
                {p.invoice_url && (
                  <a href={p.invoice_url} target="_blank" rel="noopener noreferrer" style={{ color: MUTED, fontSize: ".75rem", fontWeight: 900, textDecoration: "none" }}>
                    PDF ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Contact for billing changes */}
      <Card style={{ textAlign: "center", padding: "1.25rem" }}>
        <div style={{ fontWeight: 900, color: ORANGE, marginBottom: ".4rem" }}>Need to make changes?</div>
        <div style={{ color: MUTED, fontSize: ".88rem", marginBottom: ".75rem" }}>
          To update your plan, add lanes, or adjust billing, contact Dux Bowling directly.
        </div>
        <a href="mailto:andrew@duxbowling.com" style={{ display: "inline-block", padding: ".65rem 1.25rem", borderRadius: 999, background: ORANGE, color: "#fff", fontWeight: 900, textDecoration: "none", fontSize: ".88rem" }}>
          Email andrew@duxbowling.com
        </a>
      </Card>
    </div>
  );
}

// ── SERVICE REQUEST MODAL ─────────────────────────────────────
function ServiceRequestModal({ lanes, initial, onClose, onSave }: {
  lanes: Lane[];
  initial: ServiceRequest | null;
  onClose: () => void;
  onSave: (r: ServiceRequest) => void;
}) {
  const [laneId, setLaneId]         = useState(initial?.lane_id ?? "");
  const [type, setType]             = useState(initial?.request_type ?? "mechanical");
  const [severity, setSeverity]     = useState(initial?.severity ?? "medium");
  const [machineDown, setMachineDown] = useState(initial?.machine_down ?? false);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [saving, setSaving]         = useState(false);
  const [err, setErr]               = useState("");

  async function save() {
    if (!description.trim()) { setErr("Please describe the issue."); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/alley/service-requests", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: initial?.id,
          lane_id: laneId || null,
          request_type: type,
          severity,
          machine_down: machineDown,
          description: description.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setErr(data.error ?? "Save failed."); return; }
      onSave(data.request);
    } catch { setErr("Network error."); }
    finally { setSaving(false); }
  }

  return (
    <Modal title={initial ? "Edit Service Request" : "New Service Request"} onClose={onClose}>
      <Field label="Lane (optional)">
        <select value={laneId} onChange={e => setLaneId(e.target.value)} style={selectStyle}>
          <option value="">No specific lane</option>
          {lanes.map(l => <option key={l.id} value={l.id}>Lane {l.lane_number}</option>)}
        </select>
      </Field>
      <Field label="Issue Type">
        <select value={type} onChange={e => setType(e.target.value)} style={selectStyle}>
          {["mechanical","electrical","software","sensors","camera","other"].map(t => (
            <option key={t} value={t}>{capitalize(t)}</option>
          ))}
        </select>
      </Field>
      <Field label="Severity">
        <select value={severity} onChange={e => setSeverity(e.target.value as any)} style={selectStyle}>
          {["low","medium","high","critical"].map(s => (
            <option key={s} value={s}>{capitalize(s)}</option>
          ))}
        </select>
      </Field>
      <Field label="Description">
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe the issue in detail..."
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </Field>
      <label style={{ display: "flex", alignItems: "center", gap: ".5rem", cursor: "pointer", marginBottom: ".75rem", fontSize: ".88rem", color: TEXT }}>
        <input type="checkbox" checked={machineDown} onChange={e => setMachineDown(e.target.checked)} style={{ width: 16, height: 16 }} />
        Machine is down / lane is out of service
      </label>
      {err && <div style={{ color: RED, fontSize: ".85rem", marginBottom: ".5rem" }}>{err}</div>}
      <SubmitBtn label={initial ? "Save Changes" : "Submit Request"} loading={saving} onClick={save} />
    </Modal>
  );
}

// ── LEAGUE MODAL ──────────────────────────────────────────────
function LeagueModal({ initial, onClose, onSave }: {
  initial: League | null;
  onClose: () => void;
  onSave: (l: League) => void;
}) {
  const [name, setName]         = useState(initial?.name ?? "");
  const [season, setSeason]     = useState(initial?.season ?? "");
  const [day, setDay]           = useState(initial?.day_of_week ?? "");
  const [time, setTime]         = useState(initial?.start_time ?? "");
  const [startDate, setStartDate] = useState(initial?.start_date ?? "");
  const [endDate, setEndDate]   = useState(initial?.end_date ?? "");
  const [maxTeams, setMaxTeams] = useState(String(initial?.max_teams ?? ""));
  const [fee, setFee]           = useState(initial?.entry_fee_cents ? String(initial.entry_fee_cents / 100) : "");
  const [ndbc, setNdbc]         = useState(initial?.ndbc_sanctioned ?? false);
  const [status, setStatus]     = useState(initial?.status ?? "forming");
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");

  async function save() {
    if (!name.trim()) { setErr("League name is required."); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/alley/leagues", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: initial?.id,
          name: name.trim(), season: season.trim() || null,
          day_of_week: day || null, start_time: time || null,
          start_date: startDate || null, end_date: endDate || null,
          max_teams: maxTeams ? Number(maxTeams) : null,
          entry_fee_cents: fee ? Math.round(Number(fee) * 100) : null,
          ndbc_sanctioned: ndbc, status,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setErr(data.error ?? "Save failed."); return; }
      onSave(data.league);
    } catch { setErr("Network error."); }
    finally { setSaving(false); }
  }

  return (
    <Modal title={initial ? "Edit League" : "New League"} onClose={onClose}>
      <Field label="League Name"><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tuesday Night League" style={inputStyle} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
        <Field label="Season"><input value={season} onChange={e => setSeason(e.target.value)} placeholder="e.g. Spring 2026" style={inputStyle} /></Field>
        <Field label="Day of Week">
          <select value={day} onChange={e => setDay(e.target.value)} style={selectStyle}>
            <option value="">— Select —</option>
            {["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].map(d => (
              <option key={d} value={d}>{capitalize(d)}</option>
            ))}
          </select>
        </Field>
        <Field label="Start Time"><input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} /></Field>
        <Field label="Max Teams"><input type="number" value={maxTeams} onChange={e => setMaxTeams(e.target.value)} placeholder="e.g. 8" style={inputStyle} /></Field>
        <Field label="Start Date"><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} /></Field>
        <Field label="End Date"><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} /></Field>
        <Field label="Entry Fee ($)"><input type="number" value={fee} onChange={e => setFee(e.target.value)} placeholder="0.00" style={inputStyle} /></Field>
        <Field label="Status">
          <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
            {["forming","active","completed","cancelled"].map(s => <option key={s} value={s}>{capitalize(s)}</option>)}
          </select>
        </Field>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: ".5rem", cursor: "pointer", marginBottom: ".75rem", fontSize: ".88rem", color: TEXT }}>
        <input type="checkbox" checked={ndbc} onChange={e => setNdbc(e.target.checked)} style={{ width: 16, height: 16 }} />
        NDBC Sanctioned
      </label>
      {err && <div style={{ color: RED, fontSize: ".85rem", marginBottom: ".5rem" }}>{err}</div>}
      <SubmitBtn label={initial ? "Save Changes" : "Create League"} loading={saving} onClick={save} />
    </Modal>
  );
}

// ── TOURNAMENT MODAL ──────────────────────────────────────────
function TournamentModal({ initial, onClose, onSave }: {
  initial: Tournament | null;
  onClose: () => void;
  onSave: (t: Tournament) => void;
}) {
  const [name, setName]         = useState(initial?.name ?? "");
  const [format, setFormat]     = useState(initial?.format ?? "single_day");
  const [eventDate, setEventDate] = useState(initial?.event_date ?? "");
  const [regClose, setRegClose] = useState(initial?.registration_close ?? "");
  const [capacity, setCapacity] = useState(String(initial?.capacity ?? ""));
  const [fee, setFee]           = useState(initial?.entry_fee_cents ? String(initial.entry_fee_cents / 100) : "");
  const [prize, setPrize]       = useState(initial?.prize_description ?? "");
  const [ndbc, setNdbc]         = useState(initial?.ndbc_sanctioned ?? false);
  const [status, setStatus]     = useState(initial?.status ?? "draft");
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");

  async function save() {
    if (!name.trim()) { setErr("Tournament name is required."); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/alley/tournaments", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: initial?.id,
          name: name.trim(), format,
          event_date: eventDate || null, registration_close: regClose || null,
          capacity: capacity ? Number(capacity) : null,
          entry_fee_cents: fee ? Math.round(Number(fee) * 100) : null,
          prize_description: prize.trim() || null,
          ndbc_sanctioned: ndbc, status,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setErr(data.error ?? "Save failed."); return; }
      onSave(data.tournament);
    } catch { setErr("Network error."); }
    finally { setSaving(false); }
  }

  return (
    <Modal title={initial ? "Edit Tournament" : "New Tournament"} onClose={onClose}>
      <Field label="Tournament Name"><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Spring Open 2026" style={inputStyle} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
        <Field label="Format">
          <select value={format} onChange={e => setFormat(e.target.value)} style={selectStyle}>
            {["single_day","bracket","series","qualifiers_finals"].map(f => <option key={f} value={f}>{capitalize(f)}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
            {["draft","open","closed","completed","cancelled"].map(s => <option key={s} value={s}>{capitalize(s)}</option>)}
          </select>
        </Field>
        <Field label="Event Date"><input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} style={inputStyle} /></Field>
        <Field label="Registration Closes"><input type="date" value={regClose} onChange={e => setRegClose(e.target.value)} style={inputStyle} /></Field>
        <Field label="Capacity (bowlers)"><input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g. 32" style={inputStyle} /></Field>
        <Field label="Entry Fee ($)"><input type="number" value={fee} onChange={e => setFee(e.target.value)} placeholder="0.00" style={inputStyle} /></Field>
      </div>
      <Field label="Prize Description"><input value={prize} onChange={e => setPrize(e.target.value)} placeholder="e.g. $500 cash + trophy" style={inputStyle} /></Field>
      <label style={{ display: "flex", alignItems: "center", gap: ".5rem", cursor: "pointer", marginBottom: ".75rem", fontSize: ".88rem", color: TEXT }}>
        <input type="checkbox" checked={ndbc} onChange={e => setNdbc(e.target.checked)} style={{ width: 16, height: 16 }} />
        NDBC Sanctioned
      </label>
      {err && <div style={{ color: RED, fontSize: ".85rem", marginBottom: ".5rem" }}>{err}</div>}
      <SubmitBtn label={initial ? "Save Changes" : "Create Tournament"} loading={saving} onClick={save} />
    </Modal>
  );
}