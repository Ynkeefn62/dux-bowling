"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const ORANGE = "#e46a2e";
const BORDER = "rgba(0,0,0,0.08)";
const RED    = "#dc2626";
const GREEN  = "#16a34a";

type MeResponse = {
  ok: boolean;
  user: { id: string; email: string | null } | null;
  profile: {
    first_name?: string | null;
    last_name?:  string | null;
    username?:   string | null;
    user_type?:  "bowler" | "alley" | "admin" | null;
  } | null;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res  = await fetch(url, { ...init, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.error || "Request failed"), { status: res.status });
  return data;
}

function initials(first?: string | null, last?: string | null, email?: string | null) {
  const a = (first?.trim()?.[0] ?? "").toUpperCase();
  const b = (last?.trim()?.[0] ?? "").toUpperCase();
  if (a || b) return `${a}${b}` || "U";
  return (email?.trim()?.[0] ?? "U").toUpperCase();
}

function dashFor(userType?: string | null) {
  if (userType === "alley") return "/alleys/dashboard";
  if (userType === "admin") return "/admin/dashboard";
  return "/bowlers/dashboard";
}

// ── Password strength ──────────────────────────────────────────
function strengthLabel(pw: string): { label: string; color: string; pct: number } {
  if (pw.length === 0) return { label: "", color: "transparent", pct: 0 };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw))    score++;
  if (/[0-9]/.test(pw))    score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Weak",   color: RED,    pct: 25  };
  if (score <= 2) return { label: "Fair",   color: "#f59e0b", pct: 50  };
  if (score <= 3) return { label: "Good",   color: "#84cc16", pct: 75  };
  return            { label: "Strong", color: GREEN,  pct: 100 };
}

// ── Field wrapper ─────────────────────────────────────────────
function Field({
  label, type = "text", value, onChange, placeholder, maxLength, error, autoFocus,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  maxLength?: number; error?: string; autoFocus?: boolean;
}) {
  return (
    <div style={{ display: "grid", gap: ".28rem" }}>
      <label style={{ fontSize: ".78rem", fontWeight: 700, color: "#555" }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength} autoFocus={autoFocus}
        style={{
          padding: ".72rem .8rem", borderRadius: 10,
          border: `1.5px solid ${error ? RED : "#e0d8cf"}`,
          fontFamily: "Montserrat, system-ui", fontSize: ".9rem",
          outline: "none", color: "#1a1a1a", background: "#fff",
          transition: "border-color 150ms",
          boxShadow: error ? `0 0 0 3px ${RED}18` : "none",
        }}
        onFocus={e => { if (!error) e.target.style.borderColor = ORANGE; }}
        onBlur={e => { if (!error) e.target.style.borderColor = "#e0d8cf"; }}
      />
      {error && <span style={{ fontSize: ".72rem", color: RED, fontWeight: 700 }}>{error}</span>}
    </div>
  );
}

// ── Primary button ────────────────────────────────────────────
function PrimaryBtn({
  label, loading, disabled, onClick,
}: { label: string; loading?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        width: "100%", padding: ".82rem",
        borderRadius: 12, border: 0,
        background: loading || disabled ? "#ccc" : ORANGE,
        color: "#fff", fontWeight: 900, fontSize: ".92rem",
        cursor: loading || disabled ? "default" : "pointer",
        fontFamily: "Montserrat, system-ui",
        transition: "background 150ms",
      }}
    >
      {loading ? "…" : label}
    </button>
  );
}

// ── Alert ─────────────────────────────────────────────────────
function Alert({ msg, type }: { msg: string; type: "error" | "info" | "success" }) {
  const colors = {
    error:   { bg: `${RED}12`,   border: `${RED}35`,   text: "#b91c1c" },
    info:    { bg: "#f0f9ff",     border: "#bae6fd",    text: "#0369a1" },
    success: { bg: `${GREEN}12`, border: `${GREEN}35`, text: "#166534" },
  }[type];
  return (
    <div style={{
      padding: ".65rem .85rem", borderRadius: 10,
      background: colors.bg, border: `1px solid ${colors.border}`,
      color: colors.text, fontSize: ".82rem", fontWeight: 700, lineHeight: 1.5,
    }}>
      {msg}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
export default function LoginButton() {
  const router = useRouter();
  const [open, setOpen]   = useState(false);
  const [mode, setMode]   = useState<"login" | "signup">("login");
  const [me, setMe]       = useState<MeResponse | null>(null);
  const loggedIn = Boolean(me?.user?.id);

  // Shared fields
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  // Signup-only fields
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [username,  setUsername]  = useState("");

  // Account panel
  const [showChange,   setShowChange]   = useState(false);
  const [newPassword,  setNewPassword]  = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  // Status
  const [loading,  setLoading]  = useState(false);
  const [alert,    setAlert]    = useState<{ msg: string; type: "error"|"info"|"success" } | null>(null);
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});

  // Field-level error helpers
  function fe(key: string) { return fieldErr[key]; }
  function setFe(key: string, msg: string) { setFieldErr(prev => ({ ...prev, [key]: msg })); }
  function clearErrors() { setFieldErr({}); setAlert(null); }

  // Refresh session on mount + auto-refresh timer
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  async function refreshMe() {
    try {
      const data = await api<MeResponse>("/api/auth/me");
      setMe(data);
    } catch {
      setMe({ ok: true, user: null, profile: null });
    }
  }

  async function silentRefresh() {
    try {
      await api("/api/auth/refresh", { method: "POST" });
      await refreshMe();
    } catch { /* token expired — user will see logged-out state */ }
  }

  useEffect(() => {
    refreshMe();
    // Auto-refresh access token every 6 hours (token valid for 7 days, we refresh proactively)
    refreshTimer.current = setInterval(silentRefresh, 6 * 60 * 60 * 1000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Clear state when modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setEmail(""); setPassword(""); setFirstName(""); setLastName("");
        setUsername(""); setNewPassword(""); setNewPassword2("");
        setShowChange(false); clearErrors();
      }, 200);
    }
  }, [open]);

  // ── Login ──────────────────────────────────────────────────
  async function handleLogin() {
    clearErrors();
    let hasErr = false;
    if (!email.trim())    { setFe("email",    "Email is required.");    hasErr = true; }
    if (!password.trim()) { setFe("password", "Password is required."); hasErr = true; }
    if (hasErr) return;

    setLoading(true);
    try {
      await api("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      await refreshMe();
      setOpen(false);
    } catch (e: any) {
      const msg = e?.message ?? "";
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("credentials")) {
        setAlert({ msg: "Incorrect email or password. Please try again.", type: "error" });
      } else if (msg.toLowerCase().includes("confirm")) {
        setAlert({ msg: "Please check your email and confirm your account before logging in.", type: "info" });
      } else if (msg.toLowerCase().includes("jwt") || e?.status === 401) {
        // Try refresh once
        try {
          await api("/api/auth/refresh", { method: "POST" });
          await refreshMe();
          setOpen(false);
        } catch {
          setAlert({ msg: "Your session expired. Please log in again.", type: "error" });
        }
      } else {
        setAlert({ msg: msg || "Login failed. Please try again.", type: "error" });
      }
    } finally { setLoading(false); }
  }

  // ── Sign up ────────────────────────────────────────────────
  async function handleSignup() {
    clearErrors();
    let hasErr = false;
    if (!firstName.trim()) { setFe("firstName", "First name is required."); hasErr = true; }
    if (!lastName.trim())  { setFe("lastName",  "Last name is required.");  hasErr = true; }
    if (!username.trim())  { setFe("username",  "Username is required.");   hasErr = true; }
    else if (username.trim().length < 3) { setFe("username", "Username must be at least 3 characters."); hasErr = true; }
    else if (username.trim().length > 24) { setFe("username", "Username must be 24 characters or fewer."); hasErr = true; }
    else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) { setFe("username", "Username can only contain letters, numbers, and underscores."); hasErr = true; }
    if (!email.trim())     { setFe("email",    "Email is required.");    hasErr = true; }
    else if (!email.includes("@")) { setFe("email", "Please enter a valid email address."); hasErr = true; }
    if (!password.trim())  { setFe("password", "Password is required."); hasErr = true; }
    else if (password.length < 8) { setFe("password", "Password must be at least 8 characters."); hasErr = true; }
    if (hasErr) return;

    setLoading(true);
    try {
      const out: any = await api("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, first_name: firstName.trim(), last_name: lastName.trim(), username: username.trim() }),
      });

      if (out?.needs_email_confirm) {
        setAlert({ msg: "Account created! Check your email to confirm your account, then come back and log in.", type: "success" });
        return;
      }

      // Auto-login after signup
      await api("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember: true }),
      });

      await refreshMe();
      setOpen(false);
      // Redirect new users to profile setup
      router.push("/profile");
    } catch (e: any) {
      const msg = e?.message ?? "";
      if (msg.toLowerCase().includes("username")) {
        setFe("username", "That username is already taken. Please choose another.");
      } else if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("already")) {
        setFe("email", "An account with this email already exists. Try logging in instead.");
      } else {
        setAlert({ msg: msg || "Sign up failed. Please try again.", type: "error" });
      }
    } finally { setLoading(false); }
  }

  // ── Change password ────────────────────────────────────────
  async function handleChangePassword() {
    clearErrors();
    if (newPassword.length < 8) { setFe("newPw", "Password must be at least 8 characters."); return; }
    if (newPassword !== newPassword2) { setFe("newPw2", "Passwords don't match."); return; }
    setLoading(true);
    try {
      await api("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: newPassword }),
      });
      await refreshMe();
      setOpen(false);
      setAlert({ msg: "Password updated. Please log in again.", type: "success" });
    } catch (e: any) {
      setAlert({ msg: e?.message || "Password change failed.", type: "error" });
    } finally { setLoading(false); }
  }

  // ── Logout ─────────────────────────────────────────────────
  async function handleLogout() {
    setLoading(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
      await refreshMe();
      setOpen(false);
      router.push("/");
    } catch { /* still close */ setOpen(false); }
    finally { setLoading(false); }
  }

  const strength = strengthLabel(password);
  const displayInitials = initials(me?.profile?.first_name, me?.profile?.last_name, me?.user?.email);
  const dashboardHref   = dashFor(me?.profile?.user_type);

  return (
    <>
      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen(true)}
        aria-label={loggedIn ? "Account menu" : "Log in or sign up"}
        style={{
          position: "fixed", top: 14, right: 14,
          width: 44, height: 44, borderRadius: "50%",
          border: "none", background: ORANGE, color: "#fff",
          display: "grid", placeItems: "center",
          zIndex: 1000, boxShadow: "0 8px 22px rgba(228,106,46,0.45)",
          cursor: "pointer", fontWeight: 900, fontSize: ".9rem",
          fontFamily: "Montserrat, system-ui",
        }}
      >
        {loggedIn ? displayInitials : (
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
          </svg>
        )}
      </button>

      {/* ── Modal ── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1100, display: "grid",
            placeItems: "center", padding: "1rem",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "min(440px, 94vw)",
              background: "#fff", borderRadius: 20,
              padding: "1.5rem",
              boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
              fontFamily: "Montserrat, system-ui",
              maxHeight: "90vh", overflowY: "auto",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.1rem" }}>
              <h2 style={{ margin: 0, color: ORANGE, fontWeight: 900, fontSize: "1.15rem" }}>
                {loggedIn ? "My Account" : mode === "login" ? "Welcome back" : "Create account"}
              </h2>
              <button onClick={() => setOpen(false)} aria-label="Close" style={{ border: 0, background: "transparent", fontSize: "1.4rem", cursor: "pointer", color: "#888", lineHeight: 1 }}>×</button>
            </div>

            {/* ── Logged in ── */}
            {loggedIn ? (
              <div style={{ display: "grid", gap: ".75rem" }}>
                <a href="/profile" style={{ display: "block", padding: ".9rem 1rem", borderRadius: 12, background: "#f8f0e8", border: `1.5px solid #f0dfc8`, color: "#5a2e10", fontWeight: 900, textDecoration: "none", fontSize: ".92rem" }}>
                  👤 My Profile
                </a>
                <a href={dashboardHref} style={{ display: "block", padding: ".9rem 1rem", borderRadius: 12, background: "#f8f0e8", border: `1.5px solid #f0dfc8`, color: "#5a2e10", fontWeight: 900, textDecoration: "none", fontSize: ".92rem" }}>
                  📊 My Dashboard
                </a>
                <a href="/avatar" style={{ display: "block", padding: ".9rem 1rem", borderRadius: 12, background: "#f8f0e8", border: `1.5px solid #f0dfc8`, color: "#5a2e10", fontWeight: 900, textDecoration: "none", fontSize: ".92rem" }}>
                  🎨 Edit Avatar
                </a>

                <button onClick={() => setShowChange(v => !v)} style={{ width: "100%", padding: ".9rem", borderRadius: 12, border: `1.5px solid ${BORDER}`, background: "#fff", fontWeight: 900, cursor: "pointer", fontFamily: "Montserrat, system-ui", fontSize: ".88rem", color: "#333" }}>
                  🔑 Change Password
                </button>

                {showChange && (
                  <div style={{ display: "grid", gap: ".6rem", padding: "1rem", background: "#fafafa", borderRadius: 12, border: `1px solid ${BORDER}` }}>
                    <Field label="New Password" type="password" value={newPassword} onChange={setNewPassword} placeholder="Min 8 characters" error={fe("newPw")} />
                    {newPassword.length > 0 && (
                      <div>
                        <div style={{ height: 4, borderRadius: 999, background: "#eee", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${strength.pct}%`, background: strength.color, borderRadius: 999, transition: "width 200ms" }} />
                        </div>
                        {strength.label && <div style={{ fontSize: ".68rem", color: strength.color, fontWeight: 700, marginTop: ".2rem" }}>{strength.label} password</div>}
                      </div>
                    )}
                    <Field label="Confirm New Password" type="password" value={newPassword2} onChange={setNewPassword2} placeholder="Repeat password" error={fe("newPw2")} />
                    {alert && <Alert msg={alert.msg} type={alert.type} />}
                    <PrimaryBtn label="Update Password" loading={loading} onClick={handleChangePassword} />
                  </div>
                )}

                <button onClick={handleLogout} disabled={loading} style={{ width: "100%", padding: ".9rem", borderRadius: 12, border: 0, background: ORANGE, color: "#fff", fontWeight: 900, cursor: "pointer", fontFamily: "Montserrat, system-ui", fontSize: ".92rem", opacity: loading ? 0.65 : 1 }}>
                  {loading ? "Signing out…" : "Sign Out"}
                </button>
              </div>
            ) : (
              <>
                {/* ── Mode toggle ── */}
                <div style={{ display: "flex", gap: ".4rem", marginBottom: "1.1rem", background: "#f3ede6", borderRadius: 12, padding: ".3rem" }}>
                  {(["login","signup"] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => { setMode(m); clearErrors(); }}
                      style={{
                        flex: 1, padding: ".55rem",
                        borderRadius: 9, border: 0,
                        background: mode === m ? "#fff" : "transparent",
                        color: mode === m ? ORANGE : "#888",
                        fontWeight: 900, fontSize: ".85rem", cursor: "pointer",
                        fontFamily: "Montserrat, system-ui",
                        boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                        transition: "all 150ms",
                      }}
                    >
                      {m === "login" ? "Log In" : "Sign Up"}
                    </button>
                  ))}
                </div>

                <div style={{ display: "grid", gap: ".72rem" }}>
                  {/* ── Sign up fields ── */}
                  {mode === "signup" && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".6rem" }}>
                        <Field label="First Name" value={firstName} onChange={setFirstName} placeholder="Andrew" error={fe("firstName")} autoFocus />
                        <Field label="Last Name"  value={lastName}  onChange={setLastName}  placeholder="Boller"  error={fe("lastName")} />
                      </div>
                      <Field label="Username" value={username} onChange={setUsername} placeholder="yourname (letters, numbers, _)" maxLength={24} error={fe("username")} />
                    </>
                  )}

                  <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@email.com" error={fe("email")} autoFocus={mode === "login"} />

                  <div>
                    <Field label="Password" type="password" value={password} onChange={setPassword} placeholder={mode === "signup" ? "Min 8 characters" : "Your password"} error={fe("password")} />
                    {mode === "signup" && password.length > 0 && (
                      <div style={{ marginTop: ".35rem" }}>
                        <div style={{ height: 4, borderRadius: 999, background: "#eee", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${strength.pct}%`, background: strength.color, borderRadius: 999, transition: "width 200ms" }} />
                        </div>
                        <div style={{ fontSize: ".68rem", color: strength.color, fontWeight: 700, marginTop: ".2rem" }}>{strength.label} password</div>
                      </div>
                    )}
                  </div>

                  {/* Remember me (login only) */}
                  {mode === "login" && (
                    <label style={{ display: "flex", alignItems: "center", gap: ".5rem", cursor: "pointer", fontSize: ".82rem", color: "#555", fontWeight: 600 }}>
                      <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ width: 16, height: 16, accentColor: ORANGE }} />
                      Keep me logged in for 30 days
                    </label>
                  )}

                  {alert && <Alert msg={alert.msg} type={alert.type} />}

                  <PrimaryBtn
                    label={mode === "login" ? "Log In" : "Create Account"}
                    loading={loading}
                    onClick={mode === "login" ? handleLogin : handleSignup}
                  />

                  {mode === "signup" && (
                    <p style={{ margin: 0, fontSize: ".72rem", color: "#999", textAlign: "center", lineHeight: 1.5 }}>
                      By creating an account you agree to our{" "}
                      <a href="/terms" target="_blank" style={{ color: ORANGE }}>Terms of Service</a>
                      {" "}and{" "}
                      <a href="/privacy" target="_blank" style={{ color: ORANGE }}>Privacy Policy</a>.
                    </p>
                  )}

                  {mode === "login" && (
                    <button
                      onClick={() => { setMode("signup"); clearErrors(); }}
                      style={{ background: "none", border: 0, color: "#888", fontSize: ".8rem", cursor: "pointer", fontFamily: "Montserrat, system-ui" }}
                    >
                      No account yet? <span style={{ color: ORANGE, fontWeight: 900 }}>Sign up for free →</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
