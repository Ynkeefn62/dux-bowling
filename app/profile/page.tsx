"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ORANGE      = "#e46a2e";
const ORANGE_SOFT = "rgba(228,106,46,0.12)";
const BG          = "#121212";
const PANEL       = "rgba(26,26,26,0.90)";
const BORDER      = "rgba(255,255,255,0.09)";
const TEXT        = "#f2f2f2";
const MUTED       = "rgba(242,242,242,0.60)";
const SHADOW      = "0 18px 45px rgba(0,0,0,0.55)";
const GREEN       = "#4ade80";
const RED         = "#f87171";

type Profile = {
  first_name:  string | null;
  last_name:   string | null;
  username:    string | null;
  user_type:   string | null;
  email:       string | null;
};

type BowlerProfile = {
  display_name:  string | null;
  handedness:    string | null;
  home_alley:    string | null;
  ndbc_id:       string | null;
  games_played:  number;
  average_score: number | null;
  highest_game:  number | null;
  total_strikes: number;
  total_spares:  number;
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: ".65rem .8rem", borderRadius: 10,
  border: `1px solid ${BORDER}`, background: "rgba(0,0,0,0.3)",
  color: TEXT, fontFamily: "Montserrat, system-ui", fontSize: ".9rem",
  outline: "none",
};

const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "none" as any };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: ".85rem" }}>
      <label style={{ display: "block", fontSize: ".75rem", color: MUTED, fontWeight: 700, marginBottom: ".3rem", letterSpacing: ".03em", textTransform: "uppercase" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function StatTile({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 12, padding: ".75rem 1rem", textAlign: "center" }}>
      <div style={{ fontSize: "1.5rem", fontWeight: 900, color: ORANGE }}>{value}</div>
      <div style={{ fontSize: ".72rem", color: MUTED, fontWeight: 700, marginTop: ".15rem" }}>{label}</div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading]     = useState(true);
  const [loggedIn, setLoggedIn]   = useState(false);
  const [userId, setUserId]       = useState("");
  const [email, setEmail]         = useState("");
  const [isNew, setIsNew]         = useState(false);

  // Editable profile fields
  const [firstName,   setFirstName]   = useState("");
  const [lastName,    setLastName]    = useState("");
  const [username,    setUsername]    = useState("");
  const [displayName, setDisplayName] = useState("");
  const [handedness,  setHandedness]  = useState("");
  const [homeAlley,   setHomeAlley]   = useState("");
  const [ndbcId,      setNdbcId]      = useState("");

  // Stats (read-only)
  const [stats, setStats] = useState<Partial<BowlerProfile>>({});

  // Save state
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveErr, setSaveErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { cache: "no-store" }).then(r => r.json());
        if (!me?.user?.id) {
          router.replace("/?login=1");
          return;
        }

        setLoggedIn(true);
        setUserId(me.user.id);
        setEmail(me.user.email ?? "");

        const p: Profile = me.profile ?? {};
        setFirstName(p.first_name ?? "");
        setLastName(p.last_name ?? "");
        setUsername(p.username ?? "");

        // Check if this is a fresh account (no display name set yet)
        const res = await fetch("/api/profile/me", { cache: "no-store" });
        const data = await res.json();

        if (data.ok && data.bowlerProfile) {
          const bp: BowlerProfile = data.bowlerProfile;
          setDisplayName(bp.display_name ?? "");
          setHandedness(bp.handedness ?? "");
          setHomeAlley(bp.home_alley ?? "");
          setNdbcId(bp.ndbc_id ?? "");
          setStats(bp);
          // New account = no games yet AND no display name set
          setIsNew(!bp.display_name && bp.games_played === 0);
        } else {
          setIsNew(true);
        }
      } catch {
        router.replace("/");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setSaving(true); setSaveMsg(""); setSaveErr("");
    try {
      const res = await fetch("/api/profile/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name:   firstName.trim(),
          last_name:    lastName.trim(),
          username:     username.trim(),
          display_name: displayName.trim() || `${firstName.trim()} ${lastName.trim()}`.trim(),
          handedness:   handedness || null,
          home_alley:   homeAlley.trim() || null,
          ndbc_id:      ndbcId.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setSaveErr(data.error ?? "Save failed. Please try again.");
      } else {
        setSaveMsg("Profile saved!");
        setIsNew(false);
        setTimeout(() => setSaveMsg(""), 3000);
      }
    } catch {
      setSaveErr("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: BG, display: "grid", placeItems: "center", fontFamily: "Montserrat, system-ui", color: TEXT }}>
        <div style={{ color: MUTED }}>Loading…</div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: BG, fontFamily: "Montserrat, system-ui", color: TEXT }}>
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(700px 350px at 15% 8%, rgba(228,106,46,0.14), transparent 55%)" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>

        {/* New account welcome banner */}
        {isNew && (
          <div style={{
            background: "rgba(228,106,46,0.10)", border: `1px solid rgba(228,106,46,0.3)`,
            borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "1.25rem",
            display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
          }}>
            <div style={{ fontSize: "1.8rem" }}>👋</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, color: ORANGE, marginBottom: ".2rem" }}>Welcome to Dux Bowling!</div>
              <div style={{ fontSize: ".85rem", color: MUTED }}>Set up your profile and build your avatar to get started.</div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontWeight: 900, fontSize: "1.5rem" }}>My Profile</h1>
            <div style={{ fontSize: ".78rem", color: MUTED, marginTop: ".2rem" }}>{email}</div>
          </div>
          <Link href="/avatar" style={{
            padding: ".55rem 1rem", borderRadius: 10,
            background: ORANGE_SOFT, border: `1px solid rgba(228,106,46,0.3)`,
            color: ORANGE, fontWeight: 900, fontSize: ".82rem", textDecoration: "none",
          }}>
            🎨 Edit Avatar
          </Link>
          <Link href="/bowlers/dashboard" style={{
            padding: ".55rem 1rem", borderRadius: 10,
            background: PANEL, border: `1px solid ${BORDER}`,
            color: TEXT, fontWeight: 900, fontSize: ".82rem", textDecoration: "none",
          }}>
            📊 My Stats
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem" }}>

          {/* ── Profile form ── */}
          <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "1.5rem", boxShadow: SHADOW }}>
            <div style={{ fontWeight: 900, color: ORANGE, fontSize: ".85rem", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: "1.1rem" }}>
              Personal Info
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
              <Field label="First Name">
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Andrew" style={inputStyle} />
              </Field>
              <Field label="Last Name">
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Boller" style={inputStyle} />
              </Field>
            </div>

            <Field label="Username">
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="@yourusername" maxLength={24} style={inputStyle} />
              <div style={{ fontSize: ".68rem", color: MUTED, marginTop: ".2rem" }}>Shown on leaderboards and across the app. Max 24 characters.</div>
            </Field>

            <Field label="Display Name">
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="How you appear on the lane screen" style={inputStyle} />
            </Field>

            <div style={{ fontWeight: 900, color: ORANGE, fontSize: ".85rem", letterSpacing: ".04em", textTransform: "uppercase", margin: "1.1rem 0 .85rem" }}>
              Bowling Info
            </div>

            <Field label="Handedness">
              <select value={handedness} onChange={e => setHandedness(e.target.value)} style={selectStyle}>
                <option value="">— Select —</option>
                <option value="right">Right-handed</option>
                <option value="left">Left-handed</option>
                <option value="ambidextrous">Ambidextrous</option>
              </select>
            </Field>

            <Field label="Home Alley">
              <select value={homeAlley} onChange={e => setHomeAlley(e.target.value)} style={selectStyle}>
                <option value="">— Select —</option>
                <option>Walkersville Bowling Center</option>
                <option>Mount Airy Bowling Lanes</option>
                <option>Other</option>
              </select>
            </Field>

            <Field label="NDBC Member ID (optional)">
              <input value={ndbcId} onChange={e => setNdbcId(e.target.value)} placeholder="Your NDBC number if you have one" style={inputStyle} />
            </Field>

            {saveErr && (
              <div style={{ color: RED, fontSize: ".82rem", marginBottom: ".75rem", padding: ".6rem .75rem", background: "rgba(248,113,113,0.08)", borderRadius: 8, border: "1px solid rgba(248,113,113,0.25)" }}>
                {saveErr}
              </div>
            )}
            {saveMsg && (
              <div style={{ color: GREEN, fontSize: ".82rem", marginBottom: ".75rem", padding: ".6rem .75rem", background: "rgba(74,222,128,0.08)", borderRadius: 8, border: "1px solid rgba(74,222,128,0.25)" }}>
                ✓ {saveMsg}
              </div>
            )}

            <button
              onClick={save}
              disabled={saving}
              style={{
                width: "100%", padding: ".8rem", borderRadius: 12,
                border: 0, background: ORANGE, color: "#fff",
                fontWeight: 900, fontSize: ".92rem",
                cursor: saving ? "default" : "pointer",
                opacity: saving ? 0.65 : 1,
                fontFamily: "Montserrat, system-ui",
              }}
            >
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </div>

          {/* ── Stats ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "1.5rem", boxShadow: SHADOW }}>
              <div style={{ fontWeight: 900, color: ORANGE, fontSize: ".85rem", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: "1rem" }}>
                Your Stats
              </div>
              {stats.games_played === 0 || !stats.games_played ? (
                <div style={{ textAlign: "center", padding: "1.5rem 0", color: MUTED }}>
                  <div style={{ fontSize: "1.8rem", marginBottom: ".5rem" }}>🎳</div>
                  <div style={{ fontWeight: 700, fontSize: ".9rem" }}>No games recorded yet</div>
                  <div style={{ fontSize: ".78rem", marginTop: ".3rem" }}>
                    <Link href="/game" style={{ color: ORANGE, fontWeight: 900 }}>Log your first game →</Link>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
                  <StatTile value={stats.games_played ?? 0} label="Games Played" />
                  <StatTile value={stats.average_score?.toFixed(1) ?? "—"} label="Average" />
                  <StatTile value={stats.highest_game ?? "—"} label="High Game" />
                  <StatTile value={stats.total_strikes ?? 0} label="Total Strikes" />
                </div>
              )}
            </div>

            {/* Avatar preview */}
            <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "1.5rem", boxShadow: SHADOW, textAlign: "center" }}>
              <div style={{ fontWeight: 900, color: ORANGE, fontSize: ".85rem", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: "1rem" }}>
                Your Avatar
              </div>
              <div style={{ color: MUTED, fontSize: ".85rem", marginBottom: "1rem" }}>
                Customize how you appear on lane screens and leaderboards.
              </div>
              <Link href="/avatar" style={{
                display: "inline-block", padding: ".7rem 1.25rem", borderRadius: 999,
                background: ORANGE, color: "#fff", fontWeight: 900,
                textDecoration: "none", fontSize: ".88rem",
              }}>
                🎨 Open Avatar Creator
              </Link>
            </div>

            {/* Account section */}
            <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "1.5rem", boxShadow: SHADOW }}>
              <div style={{ fontWeight: 900, color: ORANGE, fontSize: ".85rem", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: ".85rem" }}>
                Account
              </div>
              <div style={{ fontSize: ".82rem", color: MUTED, marginBottom: ".6rem" }}>Email: <span style={{ color: TEXT, fontWeight: 700 }}>{email}</span></div>
              <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
                <Link href="/" style={{ fontSize: ".8rem", color: MUTED, fontWeight: 700, textDecoration: "none" }}>Change Password</Link>
                <span style={{ color: BORDER }}>·</span>
                <Link href="/privacy" style={{ fontSize: ".8rem", color: MUTED, fontWeight: 700, textDecoration: "none" }}>Privacy Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
