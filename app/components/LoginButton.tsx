"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";

const ORANGE = "#e46a2e";

export default function LoginButton() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const disabled = useMemo(() => !email.trim(), [email]);

  // Close on Esc
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function sendMagicLink() {
    setLoading(true);
    setStatus(null);

    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      // For both login and signup with email magic link:
      // Supabase will create the user on first sign-in automatically (if enabled).
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo }
      });

      if (error) throw error;

      setStatus("Check your email for a sign-in link.");
    } catch (err: any) {
      setStatus(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Fixed button top-right */}
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
        {/* white silhouette icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
          />
        </svg>
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

            <div style={{ marginTop: "1rem" }}>
              <label style={{ display: "grid", gap: ".35rem", fontSize: ".9rem", color: "#333" }}>
                Email
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  style={{
                    padding: ".75rem",
                    borderRadius: 12,
                    border: "1px solid #ddd",
                    outline: "none"
                  }}
                />
              </label>

              <button
                onClick={sendMagicLink}
                disabled={disabled || loading}
                style={{
                  width: "100%",
                  marginTop: "1rem",
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
                {loading ? "Sending…" : mode === "login" ? "Send login link" : "Send sign-up link"}
              </button>

              <p style={{ marginTop: ".75rem", fontSize: ".85rem", color: "#666" }}>
                You’ll receive a link by email. No password needed.
              </p>

              {status && (
                <div
                  style={{
                    marginTop: ".75rem",
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

              {/* Placeholder for later */}
              <div
                style={{
                  marginTop: "1rem",
                  padding: ".75rem",
                  borderRadius: 12,
                  border: "1px dashed #ddd",
                  color: "#666",
                  fontSize: ".9rem"
                }}
              >
                Sign-In Currently Unavailable (Social login coming soon)
              </div>
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