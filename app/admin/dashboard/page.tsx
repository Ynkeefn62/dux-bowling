"use client";

import { useEffect, useState } from "react";

// ── Design tokens ─────────────────────────────────────────────
const ORANGE      = "#e46a2e";
const ORANGE_SOFT = "rgba(228,106,46,0.12)";
const BG          = "#0a0a0a";
const PANEL       = "rgba(22,22,22,0.95)";
const BORDER      = "rgba(255,255,255,0.08)";
const TEXT        = "#f2f2f2";
const MUTED       = "rgba(242,242,242,0.55)";
const SHADOW      = "0 16px 40px rgba(0,0,0,0.6)";
const GREEN       = "#4ade80";
const YELLOW      = "#facc15";
const RED         = "#f87171";
const BLUE        = "#60a5fa";

// ── Types ─────────────────────────────────────────────────────
type Tab = "overview" | "alleys" | "bowlers" | "service" | "payments" | "accounts";

type AlleySummary = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  lane_count: number;
  subscription_status: string | null;
  monthly_total_cents: number | null;
  owner_email: string | null;
  games_total: number;
  open_requests: number;
  active_leagues: number;
};

type BowlerSummary = {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  username: string | null;
  user_type: string;
  games_played: number;
  average_score: number | null;
  highest_game: number | null;
  created_at: string;
  account_status: "active" | "frozen" | "deleted";
};

type ServiceRequest = {
  id: string;
  alley_name: string;
  lane_number: number | null;
  request_type: string;
  severity: string;
  machine_down: boolean;
  description: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  submitter_email: string | null;
};

type Payment = {
  id: string;
  alley_name: string;
  amount_cents: number;
  status: string;
  description: string | null;
  paid_at: string | null;
  created_at: string;
  invoice_url: string | null;
};

type OverviewStats = {
  total_alleys: number;
  active_subscriptions: number;
  total_bowlers: number;
  total_games: number;
  open_service_requests: number;
  critical_requests: number;
  mrr_cents: number;
  payments_due_cents: number;
};

// ── Shared UI ─────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: PANEL, border: `1px solid ${BORDER}`,
      borderRadius: 16, padding: "1.1rem",
      boxShadow: SHADOW, ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ margin: "0 0 .85rem", fontSize: ".95rem", fontWeight: 900, color: ORANGE, letterSpacing: ".04em", textTransform: "uppercase" }}>{children}</h2>;
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: "inline-block", padding: ".2rem .55rem",
      borderRadius: 999, background: `${color}18`,
      border: `1px solid ${color}40`,
      color, fontWeight: 900, fontSize: ".68rem",
      letterSpacing: ".04em", textTransform: "capitalize", whiteSpace: "nowrap",
    }}>
      {label.replace(/_/g, " ")}
    </span>
  );
}

function statusColor(s: string) {
  const v = s.toLowerCase();
  if (["active","paid","open","forming","resolved"].includes(v)) return GREEN;
  if (["trialing","in_progress","pending","medium"].includes(v)) return YELLOW;
  if (["past_due","failed","critical","offline","frozen","deleted"].includes(v)) return RED;
  if (["closed","completed","cancelled"].includes(v)) return MUTED;
  return BLUE;
}

function dollars(cents: number | null | undefined) {
  if (cents == null) return "—";
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function cap(s: string) { return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()); }

function StatTile({ value, label, sub, accent }: { value: string | number; label: string; sub?: string; accent?: string }) {
  return (
    <Card style={{ textAlign: "center", padding: ".9rem" }}>
      <div style={{ fontSize: "clamp(1.5rem, 3.5vw, 2rem)", fontWeight: 900, color: accent ?? ORANGE }}>{value}</div>
      <div style={{ fontWeight: 900, fontSize: ".78rem", color: TEXT, marginTop: ".15rem" }}>{label}</div>
      {sub && <div style={{ fontSize: ".68rem", color: MUTED, marginTop: ".1rem" }}>{sub}</div>}
    </Card>
  );
}

function Empty({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: MUTED }}>
      <div style={{ fontSize: "1.8rem", marginBottom: ".4rem" }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: ".9rem" }}>{message}</div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "grid", placeItems: "center", zIndex: 200, padding: "1rem" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#161616", border: `1px solid ${BORDER}`,
        borderRadius: 18, padding: "1.5rem",
        width: "min(500px, 96vw)", maxHeight: "85vh", overflowY: "auto",
        fontFamily: "Montserrat, system-ui", color: TEXT,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.1rem" }}>
          <h3 style={{ margin: 0, color: ORANGE, fontWeight: 900, fontSize: "1rem" }}>{title}</h3>
          <button onClick={onClose} style={{ border: 0, background: "transparent", color: MUTED, fontSize: "1.4rem", cursor: "pointer" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Search bar ────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        padding: ".55rem .85rem", borderRadius: 10,
        border: `1px solid ${BORDER}`, background: "#111",
        color: TEXT, fontFamily: "Montserrat, system-ui",
        fontSize: ".85rem", width: "min(280px, 100%)", outline: "none",
      }}
    />
  );
}

// ── Confirm dialog ────────────────────────────────────────────
function ConfirmModal({ message, confirmLabel, confirmColor = RED, onConfirm, onClose }: {
  message: string; confirmLabel: string; confirmColor?: string;
  onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Modal title="Confirm Action" onClose={onClose}>
      <p style={{ color: MUTED, lineHeight: 1.65, marginBottom: "1.25rem" }}>{message}</p>
      <div style={{ display: "flex", gap: ".75rem" }}>
        <button onClick={onConfirm} style={{ flex: 1, padding: ".75rem", borderRadius: 10, border: 0, background: confirmColor, color: "#fff", fontWeight: 900, cursor: "pointer", fontFamily: "Montserrat, system-ui" }}>
          {confirmLabel}
        </button>
        <button onClick={onClose} style={{ flex: 1, padding: ".75rem", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT, fontWeight: 900, cursor: "pointer", fontFamily: "Montserrat, system-ui" }}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════
// ── MAIN PAGE ─────────────────────────────────────────════════
// ══════════════════════════════════════════════════════════════
export default function AdminDashboardPage() {
  const [tab, setTab]         = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed]   = useState<"loading" | "ok" | "denied">("loading");

  const [overview, setOverview]       = useState<OverviewStats | null>(null);
  const [alleys, setAlleys]           = useState<AlleySummary[]>([]);
  const [bowlers, setBowlers]         = useState<BowlerSummary[]>([]);
  const [requests, setRequests]       = useState<ServiceRequest[]>([]);
  const [payments, setPayments]       = useState<Payment[]>([]);

  const [toast, setToast]             = useState("");
  const [confirm, setConfirm]         = useState<{ message: string; label: string; color?: string; onConfirm: () => void } | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  // Auth check + initial load
  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { cache: "no-store" }).then(r => r.json());
        if (!me?.user?.id || me?.profile?.user_type !== "admin") {
          setAuthed("denied");
          setLoading(false);
          return;
        }
        setAuthed("ok");

        const data = await fetch("/api/admin/dashboard", { cache: "no-store" }).then(r => r.json());
        if (data.ok) {
          setOverview(data.overview);
          setAlleys(data.alleys ?? []);
          setBowlers(data.bowlers ?? []);
          setRequests(data.serviceRequests ?? []);
          setPayments(data.payments ?? []);
        }
      } catch {
        setAuthed("denied");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function accountAction(userId: string, action: "freeze" | "unfreeze" | "delete", userType: "bowler" | "alley") {
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, action }),
      });
      const data = await res.json();
      if (!data.ok) { showToast(`Error: ${data.error}`); return; }

      if (userType === "bowler") {
        setBowlers(prev => prev.map(b => b.user_id === userId
          ? { ...b, account_status: action === "delete" ? "deleted" : action === "freeze" ? "frozen" : "active" }
          : b
        ));
      } else {
        setAlleys(prev => prev.map(a => {
          // Update subscription status for alleys
          return a;
        }));
      }
      showToast(`Account ${action === "freeze" ? "frozen" : action === "unfreeze" ? "unfrozen" : "deleted"} successfully.`);
    } catch { showToast("Network error."); }
    setConfirm(null);
  }

  async function updateServiceStatus(id: string, status: string) {
    try {
      const res = await fetch("/api/admin/service-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!data.ok) { showToast(`Error: ${data.error}`); return; }
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      showToast("Status updated.");
    } catch { showToast("Network error."); }
  }

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: "overview",  label: "Overview" },
    { id: "alleys",    label: "Alleys",    badge: alleys.length > 0 ? alleys.length : undefined },
    { id: "bowlers",   label: "Bowlers",   badge: bowlers.length > 0 ? bowlers.length : undefined },
    { id: "service",   label: "Service",   badge: requests.filter(r => r.status === "open" || r.status === "in_progress").length || undefined },
    { id: "payments",  label: "Payments",  badge: payments.filter(p => p.status === "pending" || p.status === "failed").length || undefined },
    { id: "accounts",  label: "Accounts" },
  ];

  // ── Access denied ────────────────────────────────────────────
  if (authed === "denied") {
    return (
      <main style={{ minHeight: "100vh", background: BG, display: "grid", placeItems: "center", fontFamily: "Montserrat, system-ui", color: TEXT }}>
        <Card style={{ textAlign: "center", maxWidth: 380, width: "90vw", padding: "2rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: ".75rem" }}>🔒</div>
          <div style={{ fontWeight: 900, color: RED, fontSize: "1.1rem", marginBottom: ".5rem" }}>Access Denied</div>
          <div style={{ color: MUTED, fontSize: ".88rem", lineHeight: 1.6 }}>
            This dashboard is restricted to Dux Bowling administrators only.
          </div>
          <a href="/" style={{ display: "inline-block", marginTop: "1.25rem", padding: ".7rem 1.25rem", borderRadius: 999, background: ORANGE, color: "#fff", fontWeight: 900, textDecoration: "none", fontSize: ".88rem" }}>
            Go Home
          </a>
        </Card>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: BG, fontFamily: "Montserrat, system-ui", color: TEXT }}>
      {/* Background glow */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(700px 350px at 12% 6%, rgba(228,106,46,0.12), transparent 55%), radial-gradient(500px 250px at 90% 15%, rgba(228,106,46,0.07), transparent 55%)" }} />

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", border: `1px solid ${BORDER}`, borderRadius: 12, padding: ".75rem 1.25rem", fontWeight: 900, fontSize: ".88rem", zIndex: 300, boxShadow: SHADOW, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          confirmLabel={confirm.label}
          confirmColor={confirm.color}
          onConfirm={confirm.onConfirm}
          onClose={() => setConfirm(null)}
        />
      )}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1080, margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: ".72rem", color: MUTED, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: ".25rem" }}>
              Dux Bowling
            </div>
            <h1 style={{ margin: 0, fontSize: "clamp(1.3rem, 4vw, 1.75rem)", fontWeight: 900 }}>
              Admin Dashboard
            </h1>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", padding: ".35rem .75rem", borderRadius: 999, background: "rgba(228,106,46,0.12)", border: `1px solid rgba(228,106,46,0.25)`, fontSize: ".75rem", fontWeight: 900, color: ORANGE }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: ORANGE, display: "inline-block" }} />
            Admin Access
          </div>
        </div>

        {/* Tab nav */}
        <div style={{ display: "flex", gap: ".3rem", flexWrap: "wrap", borderBottom: `1px solid ${BORDER}`, marginBottom: "1.5rem", paddingBottom: ".1rem" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: ".5rem .85rem", borderRadius: "10px 10px 0 0",
              border: `1px solid ${tab === t.id ? BORDER : "transparent"}`,
              borderBottom: tab === t.id ? `1px solid ${BG}` : "transparent",
              background: tab === t.id ? PANEL : "transparent",
              color: tab === t.id ? ORANGE : MUTED,
              fontWeight: 900, fontSize: ".78rem", cursor: "pointer",
              fontFamily: "Montserrat, system-ui", position: "relative", marginBottom: -1,
            }}>
              {t.label}
              {t.badge !== undefined && (
                <span style={{ marginLeft: ".35rem", display: "inline-block", background: t.id === "service" || t.id === "payments" ? RED : ORANGE, color: "#fff", borderRadius: 999, fontSize: ".62rem", fontWeight: 900, padding: ".1rem .38rem", lineHeight: 1.4 }}>
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
            {tab === "overview"  && <OverviewTab overview={overview} alleys={alleys} requests={requests} payments={payments} />}
            {tab === "alleys"    && <AlleysTab alleys={alleys} />}
            {tab === "bowlers"   && <BowlersTab bowlers={bowlers} onAction={(userId, action) => {
              const bowler = bowlers.find(b => b.user_id === userId);
              const actionLabel = action === "freeze" ? "Freeze" : action === "unfreeze" ? "Unfreeze" : "Delete";
              const color = action === "delete" ? RED : action === "freeze" ? YELLOW : GREEN;
              setConfirm({
                message: `${actionLabel} account for ${bowler?.display_name ?? bowler?.email ?? "this bowler"}? ${action === "delete" ? "This cannot be undone." : ""}`,
                label: actionLabel,
                color,
                onConfirm: () => accountAction(userId, action, "bowler"),
              });
            }} />}
            {tab === "service"   && <ServiceTab requests={requests} onStatusChange={updateServiceStatus} />}
            {tab === "payments"  && <PaymentsTab payments={payments} alleys={alleys} />}
            {tab === "accounts"  && <AccountsTab bowlers={bowlers} alleys={alleys} onBowlerAction={(userId, action) => {
              const bowler = bowlers.find(b => b.user_id === userId);
              const actionLabel = action === "freeze" ? "Freeze" : action === "unfreeze" ? "Unfreeze" : "Delete";
              setConfirm({
                message: `${actionLabel} account for ${bowler?.display_name ?? bowler?.email}? ${action === "delete" ? "This cannot be undone." : ""}`,
                label: actionLabel,
                color: action === "delete" ? RED : action === "freeze" ? YELLOW : GREEN,
                onConfirm: () => accountAction(userId, action, "bowler"),
              });
            }} />}
          </>
        )}
      </div>
    </main>
  );
}

// ── OVERVIEW TAB ──────────────────────────────────────────────
function OverviewTab({ overview, alleys, requests, payments }: {
  overview: OverviewStats | null; alleys: AlleySummary[];
  requests: ServiceRequest[]; payments: Payment[];
}) {
  const critical = requests.filter(r => r.severity === "critical" && r.status !== "resolved" && r.status !== "closed");
  const overduePayments = payments.filter(p => p.status === "failed" || p.status === "past_due");

  return (
    <div style={{ display: "grid", gap: "1.1rem" }}>
      {/* Alerts */}
      {(critical.length > 0 || overduePayments.length > 0) && (
        <div style={{ display: "grid", gap: ".6rem" }}>
          {critical.length > 0 && (
            <div style={{ background: "rgba(248,113,113,0.08)", border: `1px solid ${RED}33`, borderRadius: 12, padding: ".85rem 1rem" }}>
              <div style={{ fontWeight: 900, color: RED, marginBottom: ".3rem" }}>⚠ {critical.length} Critical Service Issue{critical.length > 1 ? "s" : ""}</div>
              {critical.map(r => (
                <div key={r.id} style={{ fontSize: ".82rem", color: MUTED }}>{r.alley_name}{r.lane_number ? ` · Lane ${r.lane_number}` : ""} — {r.description.slice(0, 70)}</div>
              ))}
            </div>
          )}
          {overduePayments.length > 0 && (
            <div style={{ background: "rgba(250,204,21,0.07)", border: `1px solid ${YELLOW}33`, borderRadius: 12, padding: ".85rem 1rem" }}>
              <div style={{ fontWeight: 900, color: YELLOW, marginBottom: ".3rem" }}>💳 {overduePayments.length} Overdue Payment{overduePayments.length > 1 ? "s" : ""}</div>
              {overduePayments.map(p => (
                <div key={p.id} style={{ fontSize: ".82rem", color: MUTED }}>{p.alley_name} — {dollars(p.amount_cents)}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stat tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: ".75rem" }}>
        <StatTile value={overview?.total_alleys ?? 0} label="Total Alleys" />
        <StatTile value={overview?.active_subscriptions ?? 0} label="Active Subs" accent={GREEN} />
        <StatTile value={overview?.total_bowlers ?? 0} label="Bowlers" />
        <StatTile value={overview?.total_games ?? 0} label="Games Logged" />
        <StatTile value={overview?.open_service_requests ?? 0} label="Open Tickets" accent={overview?.open_service_requests ? YELLOW : GREEN} />
        <StatTile value={dollars(overview?.mrr_cents)} label="MRR" accent={GREEN} sub="monthly recurring" />
      </div>

      {/* Alleys at a glance */}
      {alleys.length > 0 && (
        <Card>
          <SectionTitle>Alleys at a Glance</SectionTitle>
          <div style={{ display: "grid", gap: ".5rem" }}>
            {alleys.map(a => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: ".75rem", padding: ".6rem .75rem", background: "rgba(0,0,0,0.25)", borderRadius: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontWeight: 900, fontSize: ".88rem" }}>{a.name}</div>
                  <div style={{ fontSize: ".72rem", color: MUTED }}>{a.city}{a.state ? `, ${a.state}` : ""} · {a.lane_count} lane{a.lane_count !== 1 ? "s" : ""}</div>
                </div>
                <div style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
                  {a.open_requests > 0 && <Badge label={`${a.open_requests} open`} color={YELLOW} />}
                  <Badge label={a.subscription_status ?? "no sub"} color={statusColor(a.subscription_status ?? "")} />
                  <span style={{ fontSize: ".78rem", color: MUTED, fontWeight: 700 }}>{dollars(a.monthly_total_cents)}/mo</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent service requests */}
      {requests.filter(r => r.status !== "resolved" && r.status !== "closed").length > 0 && (
        <Card>
          <SectionTitle>Open Service Requests</SectionTitle>
          <div style={{ display: "grid", gap: ".5rem" }}>
            {requests.filter(r => r.status !== "resolved" && r.status !== "closed").slice(0, 5).map(r => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: ".65rem", padding: ".55rem .75rem", background: "rgba(0,0,0,0.25)", borderRadius: 10, flexWrap: "wrap" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.severity === "critical" ? RED : r.severity === "high" ? "#fb923c" : YELLOW, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 900, fontSize: ".85rem" }}>{r.alley_name}</span>
                  {r.lane_number && <span style={{ color: MUTED, fontSize: ".78rem" }}> · Lane {r.lane_number}</span>}
                  <span style={{ color: MUTED, fontSize: ".78rem" }}> — {cap(r.request_type)}</span>
                </div>
                <Badge label={r.status.replace("_", " ")} color={statusColor(r.status)} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── ALLEYS TAB ────────────────────────────────────────────────
function AlleysTab({ alleys }: { alleys: AlleySummary[] }) {
  const [search, setSearch] = useState("");
  const filtered = alleys.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.city ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", gap: ".75rem", alignItems: "center", flexWrap: "wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search alleys…" />
        <span style={{ fontSize: ".8rem", color: MUTED }}>{filtered.length} alley{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {filtered.length === 0 ? <Card><Empty icon="🏠" message="No alleys found." /></Card> : (
        <div style={{ display: "grid", gap: ".75rem" }}>
          {filtered.map(a => (
            <Card key={a.id} style={{ padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontWeight: 900, fontSize: "1rem", marginBottom: ".25rem" }}>{a.name}</div>
                  <div style={{ fontSize: ".78rem", color: MUTED, marginBottom: ".5rem" }}>
                    {a.city}{a.state ? `, ${a.state}` : ""} · {a.lane_count} lane{a.lane_count !== 1 ? "s" : ""}
                    {a.owner_email && <> · <span style={{ color: BLUE }}>{a.owner_email}</span></>}
                  </div>
                  <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", fontSize: ".8rem", color: MUTED }}>
                    <span>🎳 {a.games_total.toLocaleString()} games total</span>
                    {a.open_requests > 0 && <span style={{ color: YELLOW }}>🔧 {a.open_requests} open request{a.open_requests !== 1 ? "s" : ""}</span>}
                    {a.active_leagues > 0 && <span>🏅 {a.active_leagues} active league{a.active_leagues !== 1 ? "s" : ""}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: ".4rem" }}>
                  <Badge label={a.subscription_status ?? "no subscription"} color={statusColor(a.subscription_status ?? "")} />
                  <div style={{ fontWeight: 900, color: GREEN, fontSize: ".95rem" }}>{dollars(a.monthly_total_cents)}<span style={{ fontWeight: 400, color: MUTED, fontSize: ".75rem" }}>/mo</span></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── BOWLERS TAB ───────────────────────────────────────────────
function BowlersTab({ bowlers, onAction }: {
  bowlers: BowlerSummary[];
  onAction: (userId: string, action: "freeze" | "unfreeze" | "delete") => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "frozen">("all");

  const filtered = bowlers.filter(b => {
    const matchSearch = (b.display_name ?? "").toLowerCase().includes(search.toLowerCase())
      || (b.email ?? "").toLowerCase().includes(search.toLowerCase())
      || (b.username ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || b.account_status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", gap: ".75rem", alignItems: "center", flexWrap: "wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search bowlers…" />
        <div style={{ display: "flex", gap: ".3rem" }}>
          {(["all","active","frozen"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: ".35rem .7rem", borderRadius: 999,
              border: `1px solid ${filter === f ? ORANGE : BORDER}`,
              background: filter === f ? ORANGE_SOFT : "transparent",
              color: filter === f ? ORANGE : MUTED,
              fontWeight: 900, fontSize: ".72rem", cursor: "pointer",
              fontFamily: "Montserrat, system-ui",
            }}>{cap(f)}</button>
          ))}
        </div>
        <span style={{ fontSize: ".8rem", color: MUTED }}>{filtered.length} bowler{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {filtered.length === 0 ? <Card><Empty icon="🎳" message="No bowlers found." /></Card> : (
        <div style={{ display: "grid", gap: ".6rem" }}>
          {filtered.map(b => (
            <Card key={b.id} style={{ padding: ".85rem 1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: ".85rem", flexWrap: "wrap" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: b.account_status === "frozen" ? "#333" : ORANGE, display: "grid", placeItems: "center", fontWeight: 900, color: "#fff", fontSize: ".85rem", flexShrink: 0 }}>
                  {(b.display_name ?? b.email ?? "?").charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontWeight: 900, fontSize: ".9rem" }}>{b.display_name ?? b.username ?? "—"}</div>
                  <div style={{ fontSize: ".72rem", color: MUTED }}>{b.email} {b.username ? `· @${b.username}` : ""}</div>
                </div>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: ".78rem", color: MUTED, alignItems: "center" }}>
                  <span>{b.games_played} games</span>
                  {b.average_score && <span>avg {b.average_score.toFixed(1)}</span>}
                  {b.highest_game && <span>high {b.highest_game}</span>}
                  <span>joined {fmtDate(b.created_at)}</span>
                </div>
                <div style={{ display: "flex", gap: ".4rem", alignItems: "center", flexShrink: 0 }}>
                  <Badge label={b.account_status} color={statusColor(b.account_status)} />
                  {b.account_status === "active" && (
                    <button onClick={() => onAction(b.user_id, "freeze")} style={{ padding: ".3rem .65rem", borderRadius: 8, border: `1px solid ${YELLOW}44`, background: "transparent", color: YELLOW, fontWeight: 900, fontSize: ".68rem", cursor: "pointer", fontFamily: "Montserrat, system-ui" }}>Freeze</button>
                  )}
                  {b.account_status === "frozen" && (
                    <button onClick={() => onAction(b.user_id, "unfreeze")} style={{ padding: ".3rem .65rem", borderRadius: 8, border: `1px solid ${GREEN}44`, background: "transparent", color: GREEN, fontWeight: 900, fontSize: ".68rem", cursor: "pointer", fontFamily: "Montserrat, system-ui" }}>Unfreeze</button>
                  )}
                  {b.account_status !== "deleted" && (
                    <button onClick={() => onAction(b.user_id, "delete")} style={{ padding: ".3rem .65rem", borderRadius: 8, border: `1px solid ${RED}44`, background: "transparent", color: RED, fontWeight: 900, fontSize: ".68rem", cursor: "pointer", fontFamily: "Montserrat, system-ui" }}>Delete</button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SERVICE TAB ───────────────────────────────────────────────
function ServiceTab({ requests, onStatusChange }: {
  requests: ServiceRequest[];
  onStatusChange: (id: string, status: string) => void;
}) {
  const [filter, setFilter] = useState<"open" | "all" | "resolved">("open");
  const [search, setSearch] = useState("");

  const filtered = requests.filter(r => {
    const matchFilter = filter === "all" || (filter === "open" ? !["resolved","closed"].includes(r.status) : ["resolved","closed"].includes(r.status));
    const matchSearch = r.alley_name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", gap: ".75rem", alignItems: "center", flexWrap: "wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search requests…" />
        <div style={{ display: "flex", gap: ".3rem" }}>
          {(["open","all","resolved"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: ".35rem .7rem", borderRadius: 999,
              border: `1px solid ${filter === f ? ORANGE : BORDER}`,
              background: filter === f ? ORANGE_SOFT : "transparent",
              color: filter === f ? ORANGE : MUTED,
              fontWeight: 900, fontSize: ".72rem", cursor: "pointer",
              fontFamily: "Montserrat, system-ui",
            }}>{cap(f)}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? <Card><Empty icon="✅" message="No service requests found." /></Card> : (
        <div style={{ display: "grid", gap: ".75rem" }}>
          {filtered.map(r => (
            <Card key={r.id} style={{ padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".3rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 900 }}>{r.alley_name}</span>
                    {r.lane_number && <span style={{ color: MUTED, fontSize: ".78rem" }}>Lane {r.lane_number}</span>}
                    {r.machine_down && <Badge label="Machine Down" color={RED} />}
                  </div>
                  <div style={{ fontSize: ".85rem", color: MUTED, marginBottom: ".4rem", lineHeight: 1.55 }}>{r.description}</div>
                  <div style={{ fontSize: ".72rem", color: MUTED }}>
                    {r.submitter_email} · {fmtDate(r.created_at)}
                    {r.resolved_at ? ` · Resolved ${fmtDate(r.resolved_at)}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: ".4rem" }}>
                  <Badge label={r.severity} color={r.severity === "critical" ? RED : r.severity === "high" ? "#fb923c" : r.severity === "medium" ? YELLOW : GREEN} />
                  <Badge label={r.status.replace("_"," ")} color={statusColor(r.status)} />
                </div>
              </div>
              {!["resolved","closed"].includes(r.status) && (
                <div style={{ display: "flex", gap: ".5rem", marginTop: ".75rem", flexWrap: "wrap" }}>
                  {r.status === "open" && (
                    <button onClick={() => onStatusChange(r.id, "in_progress")} style={{ padding: ".35rem .75rem", borderRadius: 8, border: `1px solid ${YELLOW}44`, background: "transparent", color: YELLOW, fontWeight: 900, fontSize: ".72rem", cursor: "pointer", fontFamily: "Montserrat, system-ui" }}>
                      In Progress
                    </button>
                  )}
                  <button onClick={() => onStatusChange(r.id, "resolved")} style={{ padding: ".35rem .75rem", borderRadius: 8, border: `1px solid ${GREEN}44`, background: "transparent", color: GREEN, fontWeight: 900, fontSize: ".72rem", cursor: "pointer", fontFamily: "Montserrat, system-ui" }}>
                    Mark Resolved
                  </button>
                  <button onClick={() => onStatusChange(r.id, "waiting_parts")} style={{ padding: ".35rem .75rem", borderRadius: 8, border: `1px solid ${BLUE}44`, background: "transparent", color: BLUE, fontWeight: 900, fontSize: ".72rem", cursor: "pointer", fontFamily: "Montserrat, system-ui" }}>
                    Waiting Parts
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── PAYMENTS TAB ──────────────────────────────────────────────
function PaymentsTab({ payments, alleys }: { payments: Payment[]; alleys: AlleySummary[] }) {
  const [filter, setFilter] = useState<"all" | "pending" | "paid" | "failed">("all");
  const [search, setSearch] = useState("");

  const filtered = payments.filter(p => {
    const matchFilter = filter === "all" || p.status === filter;
    const matchSearch = p.alley_name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalMrr   = alleys.reduce((a, x) => a + (x.monthly_total_cents ?? 0), 0);
  const pendingAmt = payments.filter(p => p.status === "pending").reduce((a, p) => a + p.amount_cents, 0);
  const paidThisMonth = payments.filter(p => p.status === "paid" && p.paid_at && new Date(p.paid_at).getMonth() === new Date().getMonth()).reduce((a, p) => a + p.amount_cents, 0);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {/* Summary tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: ".75rem" }}>
        <StatTile value={dollars(totalMrr)} label="Monthly MRR" accent={GREEN} />
        <StatTile value={dollars(paidThisMonth)} label="Collected This Month" accent={GREEN} />
        <StatTile value={dollars(pendingAmt)} label="Pending" accent={YELLOW} />
        <StatTile value={payments.filter(p => p.status === "failed").length} label="Failed" accent={RED} />
      </div>

      <div style={{ display: "flex", gap: ".75rem", alignItems: "center", flexWrap: "wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by alley…" />
        <div style={{ display: "flex", gap: ".3rem" }}>
          {(["all","pending","paid","failed"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: ".35rem .7rem", borderRadius: 999,
              border: `1px solid ${filter === f ? ORANGE : BORDER}`,
              background: filter === f ? ORANGE_SOFT : "transparent",
              color: filter === f ? ORANGE : MUTED,
              fontWeight: 900, fontSize: ".72rem", cursor: "pointer",
              fontFamily: "Montserrat, system-ui",
            }}>{cap(f)}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? <Card><Empty icon="💳" message="No payments found." /></Card> : (
        <Card>
          <div style={{ display: "grid", gap: ".5rem" }}>
            {filtered.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: ".85rem", padding: ".6rem .75rem", background: "rgba(0,0,0,0.2)", borderRadius: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontWeight: 900, fontSize: ".88rem" }}>{p.alley_name}</div>
                  <div style={{ fontSize: ".72rem", color: MUTED }}>{p.description ?? "Monthly invoice"} · {fmtDate(p.paid_at ?? p.created_at)}</div>
                </div>
                <Badge label={p.status} color={statusColor(p.status)} />
                <div style={{ fontWeight: 900, color: p.status === "paid" ? GREEN : p.status === "failed" ? RED : TEXT, fontSize: ".95rem", flexShrink: 0 }}>
                  {dollars(p.amount_cents)}
                </div>
                {p.invoice_url && (
                  <a href={p.invoice_url} target="_blank" rel="noopener noreferrer" style={{ color: MUTED, fontSize: ".72rem", fontWeight: 900, textDecoration: "none" }}>PDF ↗</a>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── ACCOUNTS TAB ──────────────────────────────────────────────
function AccountsTab({ bowlers, alleys, onBowlerAction }: {
  bowlers: BowlerSummary[];
  alleys: AlleySummary[];
  onBowlerAction: (userId: string, action: "freeze" | "unfreeze" | "delete") => void;
}) {
  const [section, setSection] = useState<"bowlers" | "alleys">("bowlers");
  const [search, setSearch] = useState("");

  const filteredBowlers = bowlers.filter(b =>
    (b.display_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (b.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (b.username ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredAlleys = alleys.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.owner_email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", gap: ".75rem", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: ".3rem" }}>
          {(["bowlers","alleys"] as const).map(s => (
            <button key={s} onClick={() => setSection(s)} style={{
              padding: ".45rem .9rem", borderRadius: 999,
              border: `1px solid ${section === s ? ORANGE : BORDER}`,
              background: section === s ? ORANGE_SOFT : "transparent",
              color: section === s ? ORANGE : MUTED,
              fontWeight: 900, fontSize: ".78rem", cursor: "pointer",
              fontFamily: "Montserrat, system-ui",
            }}>{cap(s)}</button>
          ))}
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder={`Search ${section}…`} />
      </div>

      {section === "bowlers" && (
        <>
          <div style={{ fontSize: ".8rem", color: MUTED }}>{filteredBowlers.length} bowler account{filteredBowlers.length !== 1 ? "s" : ""}</div>
          {filteredBowlers.length === 0 ? <Card><Empty icon="🎳" message="No bowlers found." /></Card> : (
            <div style={{ display: "grid", gap: ".5rem" }}>
              {filteredBowlers.map(b => (
                <Card key={b.id} style={{ padding: ".85rem 1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: ".75rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 150 }}>
                      <div style={{ fontWeight: 900, fontSize: ".88rem" }}>{b.display_name ?? b.username ?? "—"}</div>
                      <div style={{ fontSize: ".72rem", color: MUTED }}>{b.email} · Joined {fmtDate(b.created_at)}</div>
                    </div>
                    <div style={{ display: "flex", gap: ".4rem", alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
                      <Badge label={b.account_status} color={statusColor(b.account_status)} />
                      {b.account_status === "active" && (
                        <button onClick={() => onBowlerAction(b.user_id, "freeze")} style={{ padding: ".3rem .65rem", borderRadius: 8, border: `1px solid ${YELLOW}44`, background: "transparent", color: YELLOW, fontWeight: 900, fontSize: ".68rem", cursor: "pointer", fontFamily: "Montserrat, system-ui" }}>Freeze</button>
                      )}
                      {b.account_status === "frozen" && (
                        <button onClick={() => onBowlerAction(b.user_id, "unfreeze")} style={{ padding: ".3rem .65rem", borderRadius: 8, border: `1px solid ${GREEN}44`, background: "transparent", color: GREEN, fontWeight: 900, fontSize: ".68rem", cursor: "pointer", fontFamily: "Montserrat, system-ui" }}>Unfreeze</button>
                      )}
                      {b.account_status !== "deleted" && (
                        <button onClick={() => onBowlerAction(b.user_id, "delete")} style={{ padding: ".3rem .65rem", borderRadius: 8, border: `1px solid ${RED}44`, background: "transparent", color: RED, fontWeight: 900, fontSize: ".68rem", cursor: "pointer", fontFamily: "Montserrat, system-ui" }}>Delete</button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {section === "alleys" && (
        <>
          <div style={{ fontSize: ".8rem", color: MUTED }}>{filteredAlleys.length} alley account{filteredAlleys.length !== 1 ? "s" : ""}</div>
          {filteredAlleys.length === 0 ? <Card><Empty icon="🏠" message="No alleys found." /></Card> : (
            <div style={{ display: "grid", gap: ".5rem" }}>
              {filteredAlleys.map(a => (
                <Card key={a.id} style={{ padding: ".85rem 1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: ".75rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 150 }}>
                      <div style={{ fontWeight: 900, fontSize: ".88rem" }}>{a.name}</div>
                      <div style={{ fontSize: ".72rem", color: MUTED }}>{a.owner_email ?? "No owner assigned"} · {a.city}{a.state ? `, ${a.state}` : ""}</div>
                    </div>
                    <div style={{ display: "flex", gap: ".4rem", alignItems: "center", flexShrink: 0 }}>
                      <Badge label={a.subscription_status ?? "no sub"} color={statusColor(a.subscription_status ?? "")} />
                      <span style={{ fontSize: ".78rem", color: GREEN, fontWeight: 900 }}>{dollars(a.monthly_total_cents)}/mo</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}