"use client";

import { useEffect, useMemo, useState } from "react";

const ORANGE = "#e46a2e";

export default function LoginButton() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const disabled = useMemo(() => !email.trim() || !password.trim(), [email, password]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function submit() {
    setLoading(true);
    setStatus(null);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Request failed.");

      if (mode === "signup" && data?.needsEmailConfirmation) {
        setStatus("Account created. Please check your email to confirm, then log in.");
      } else {
        setStatus(mode === "login" ? "Logged in!" : "Signed up and logged in!");
      }
    } catch (err: any) {
      setStatus(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Logout failed.");
      setStatus("Logged out.");
    } catch (err: any) {
      setStatus(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Refresh failed.");
      setStatus("Session refreshed.");
    } catch (err: any) {
      setStatus(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Login"
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
          cursor: "pointer"
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
          />
        </svg>
      </button>

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
              width: "min(420px, 92vw)",
              background: "#fff",
              borderRadius: 16,
              padding: "1.25rem",
              boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
              fontFamily: "Montserrat, system-ui"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, color: ORANGE }}>
                {mode === "login" ? "Log in" : "Sign up"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{ border: "none", background: "transparent", fontSize: "1.3rem", cursor: "pointer", color: "#444" }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "flex", gap: ".5rem", marginTop: ".75rem" }}>
              <button onClick={() => setMode("login")} style={pill(mode === "login")}>Log in</button>
              <button onClick={() => setMode("signup")} style={pill(mode === "signup")}>Sign up</button>
            </div>

            <div style={{ marginTop: "1rem", display: "grid", gap: ".75rem" }}>
              <label style={{ display: "grid", gap: ".35rem", fontSize: ".9rem", color: "#333" }}>
                Email
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  style={{ padding: ".75rem", borderRadius: 12, border: "1px solid #ddd", outline: "none" }}
                />
              </label>

              <label style={{ display: "grid", gap: ".35rem", fontSize: ".9rem", color: "#333" }}>
                Password
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  type="password"
                  style={{ padding: ".75rem", borderRadius: 12, border: "1px solid #ddd", outline: "none" }}
                />
              </label>

              <button
                onClick={submit}
                disabled={disabled || loading}
                style={{
                  width: "100%",
                  padding: ".9rem",
                  borderRadius: 12,
                  border: "none",
                  background: ORANGE,
                  color: "#fff",
                  fontWeight: 900,
                  opacity: disabled || loading ? 0.6 : 1,
                  cursor: disabled || loading ? "default" : "pointer"
                }}
              >
                {loading ? "Working…" : mode === "login" ? "Log in" : "Create account"}
              </button>

              <div style={{ display: "flex", gap: ".5rem" }}>
                <button onClick={logout} disabled={loading} style={secondaryBtn()}>
                  Logout
                </button>
                <button onClick={refresh} disabled={loading} style={secondaryBtn()}>
                  Refresh session
                </button>
              </div>

              {status && (
                <div
                  style={{
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
    fontWeight: 800,
    cursor: "pointer"
  };
}

function secondaryBtn(): React.CSSProperties {
  return {
    flex: 1,
    padding: ".75rem",
    borderRadius: 12,
    border: "1px solid #ddd",
    background: "#fff",
    color: "#333",
    fontWeight: 800,
    cursor: "pointer"
  };
}