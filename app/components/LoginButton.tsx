"use client";

import { useEffect, useMemo, useState } from "react";

const ORANGE = "#e46a2e";

type MeResponse = {
  ok: boolean;
  user: { id: string; email: string | null } | null;
  profile: {
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
    user_type?: "bowler" | "alley" | "admin" | null;
  } | null;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data;
}

function initials(first?: string | null, last?: string | null, email?: string | null) {
  const a = (first?.trim()?.[0] ?? "").toUpperCase();
  const b = (last?.trim()?.[0] ?? "").toUpperCase();
  if (a || b) return `${a}${b}` || "U";
  const e = (email?.trim()?.[0] ?? "U").toUpperCase();
  return e;
}

function dashFor(userType?: string | null) {
  if (userType === "alley") return "/alleys/dashboard";
  if (userType === "admin") return "/admin/dashboard";
  return "/bowlers/dashboard";
}

export default function LoginButton() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [me, setMe] = useState<MeResponse | null>(null);
  const loggedIn = Boolean(me?.user?.id);

  // login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // signup form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");

  // change password
  const [showChange, setShowChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const disabledLogin = useMemo(() => !email.trim() || !password.trim(), [email, password]);

  const disabledSignup = useMemo(() => {
    if (!email.trim() || !password.trim()) return true;
    if (!firstName.trim() || !lastName.trim() || !username.trim()) return true;
    if (username.trim().length > 24) return true;
    if (password.trim().length < 8) return true;
    return false;
  }, [email, password, firstName, lastName, username]);

  // initial load
  useEffect(() => {
    (async () => {
      try {
        const data = await api<MeResponse>("/api/auth/me");
        setMe(data);
      } catch {
        setMe({ ok: true, user: null, profile: null });
      }
    })();
  }, []);

  // close on esc
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function refreshMe() {
    const data = await api<MeResponse>("/api/auth/me");
    setMe(data);
  }

  async function handleLogin() {
    setLoading(true);
    setStatus(null);
    try {
      await api("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      await refreshMe();
      setOpen(false);
      setPassword("");
    } catch (e: any) {
      // If token expired or needs refresh, try refresh once
      if (String(e?.message ?? "").toLowerCase().includes("jwt")) {
        try {
          await api("/api/auth/refresh", { method: "POST" });
          await refreshMe();
          setOpen(false);
          setPassword("");
        } catch {
          setStatus(e?.message ?? "Login failed.");
        }
      } else {
        setStatus(e?.message ?? "Login failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup() {
    setLoading(true);
    setStatus(null);
    try {
      const out: any = await api("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          username
        })
      });

      if (out?.needs_email_confirm) {
        setStatus("Check your email to confirm your account, then come back and log in.");
        return;
      }

      // If Supabase is configured to return a session immediately (no email confirm),
      // user still needs to login cookie-wise via /api/auth/login.
      // So we log in right away:
      await api("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      await refreshMe();
      setOpen(false);
      setPassword("");
    } catch (e: any) {
      setStatus(e?.message ?? "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    setStatus(null);
    try {
      await api("/api/auth/logout", { method: "POST" });
      await refreshMe();
      setOpen(false);
      setShowChange(false);
    } catch (e: any) {
      setStatus(e?.message ?? "Logout failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    setLoading(true);
    setStatus(null);
    try {
      await api("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: newPassword })
      });

      // change-password route clears cookies to force re-login
      setNewPassword("");
      await refreshMe();
      setStatus("Password updated. Please log in again.");
      setShowChange(false);
    } catch (e: any) {
      setStatus(e?.message ?? "Password change failed.");
    } finally {
      setLoading(false);
    }
  }

  const displayInitials = initials(
    me?.profile?.first_name ?? null,
    me?.profile?.last_name ?? null,
    me?.user?.email ?? null
  );

  const dashboardHref = dashFor(me?.profile?.user_type ?? "bowler");

  return (
    <>
      {/* Fixed button top-right */}
      <button
        onClick={() => setOpen(true)}
        aria-label={loggedIn ? "Account menu" : "Login"}
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          width: 46,
          height: 46,
          borderRadius: "50%",
          border: "none",
          background: ORANGE,
          color: "#fff",
          display: "grid",
          placeItems: "center",
          zIndex: 1000,
          boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
          cursor: "pointer",
          fontWeight: 900
        }}
      >
        {loggedIn ? (
          <span style={{ fontSize: "0.95rem", letterSpacing: "0.03em" }}>{displayInitials}</span>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
            />
          </svg>
        )}
      </button>

      {/* Modal */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 1100,
            display: "grid",
            placeItems: "center",
            padding: "1rem"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(440px, 92vw)",
              background: "#fff",
              borderRadius: 16,
              padding: "1.25rem",
              boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
              fontFamily: "Montserrat, system-ui"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, color: ORANGE }}>
                {loggedIn ? "Account" : mode === "login" ? "Log in" : "Sign up"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "1.3rem",
                  cursor: "pointer",
                  color: "#444"
                }}
              >
                ×
              </button>
            </div>

            {/* Logged-in menu */}
            {loggedIn ? (
              <div style={{ marginTop: "1rem", display: "grid", gap: ".75rem" }}>
                <a
                  href={dashboardHref}
                  style={{
                    textDecoration: "none",
                    padding: ".9rem",
                    borderRadius: 12,
                    background: "#f5f0e6",
                    color: "#3b2a20",
                    fontWeight: 900,
                    border: "1px solid #eadfcd"
                  }}
                >
                  Visit Dashboard
                </a>

                <button
                  onClick={() => setShowChange(v => !v)}
                  style={{
                    width: "100%",
                    padding: ".9rem",
                    borderRadius: 12,
                    border: "1px solid #ddd",
                    background: "#fff",
                    fontWeight: 900,
                    cursor: "pointer"
                  }}
                >
                  Change Password
                </button>

                {showChange && (
                  <div style={{ display: "grid", gap: ".5rem" }}>
                    <input
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      type="password"
                      placeholder="New password (min 8 chars)"
                      style={{
                        padding: ".8rem",
                        borderRadius: 12,
                        border: "1px solid #ddd"
                      }}
                    />
                    <button
                      onClick={handleChangePassword}
                      disabled={loading || newPassword.trim().length < 8}
                      style={{
                        width: "100%",
                        padding: ".9rem",
                        borderRadius: 12,
                        border: "none",
                        background: ORANGE,
                        color: "#fff",
                        fontWeight: 900,
                        opacity: loading || newPassword.trim().length < 8 ? 0.6 : 1,
                        cursor: loading || newPassword.trim().length < 8 ? "default" : "pointer"
                      }}
                    >
                      {loading ? "Updating…" : "Update Password"}
                    </button>
                    <div style={{ fontSize: ".85rem", color: "#666" }}>
                      After updating, you’ll be asked to log in again.
                    </div>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: ".9rem",
                    borderRadius: 12,
                    border: "none",
                    background: ORANGE,
                    color: "#fff",
                    fontWeight: 900,
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? "default" : "pointer"
                  }}
                >
                  {loading ? "Logging out…" : "Log out"}
                </button>
              </div>
            ) : (
              <>
                {/* Toggle */}
                <div style={{ display: "flex", gap: ".5rem", marginTop: ".75rem" }}>
                  <button
                    onClick={() => {
                      setMode("login");
                      setStatus(null);
                    }}
                    style={pill(mode === "login")}
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => {
                      setMode("signup");
                      setStatus(null);
                    }}
                    style={pill(mode === "signup")}
                  >
                    Sign up
                  </button>
                </div>

                <div style={{ marginTop: "1rem", display: "grid", gap: ".75rem" }}>
                  {mode === "signup" && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".6rem" }}>
                        <input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First name"
                          style={{ padding: ".75rem", borderRadius: 12, border: "1px solid #ddd" }}
                        />
                        <input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last name"
                          style={{ padding: ".75rem", borderRadius: 12, border: "1px solid #ddd" }}
                        />
                      </div>

                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username (max 24 chars)"
                        maxLength={24}
                        style={{ padding: ".75rem", borderRadius: 12, border: "1px solid #ddd" }}
                      />
                    </>
                  )}

                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                    style={{ padding: ".75rem", borderRadius: 12, border: "1px solid #ddd" }}
                  />

                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "Password (min 8 chars)" : "Password"}
                    type="password"
                    style={{ padding: ".75rem", borderRadius: 12, border: "1px solid #ddd" }}
                  />

                  <button
                    onClick={mode === "login" ? handleLogin : handleSignup}
                    disabled={loading || (mode === "login" ? disabledLogin : disabledSignup)}
                    style={{
                      width: "100%",
                      padding: ".9rem",
                      borderRadius: 12,
                      border: "none",
                      background: ORANGE,
                      color: "#fff",
                      fontWeight: 900,
                      opacity: loading || (mode === "login" ? disabledLogin : disabledSignup) ? 0.6 : 1,
                      cursor: loading || (mode === "login" ? disabledLogin : disabledSignup) ? "default" : "pointer"
                    }}
                  >
                    {loading ? "Working…" : mode === "login" ? "Log in" : "Create account"}
                  </button>

                  {mode === "signup" && (
                    <div style={{ fontSize: ".85rem", color: "#666", lineHeight: 1.4 }}>
                      New accounts created here are assigned <strong>Bowler</strong> access by default.
                    </div>
                  )}

                  {status && (
                    <div
                      style={{
                        marginTop: ".25rem",
                        padding: ".75rem",
                        borderRadius: 12,
                        background: "#f5f0e6",
                        color: "#5b3b25",
                        fontSize: ".9rem"
                      }}
                    >
                      {status}
                    </div>
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

function pill(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: ".6rem",
    borderRadius: 999,
    border: "1px solid #ddd",
    background: active ? "#f5f0e6" : "#fff",
    color: "#333",
    fontWeight: 900,
    cursor: "pointer"
  };
}