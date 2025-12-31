"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const ORANGE = "#e46a2e";

type Mode = "login" | "signup";

export default function LoginButton() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // If you want to temporarily disable real auth UI and show "Unavailable",
  // flip this to true.
  const SIGNIN_UNAVAILABLE = false;

  const title = useMemo(() => (mode === "login" ? "Log in" : "Sign up"), [mode]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function submit() {
    setMsg(null);

    if (SIGNIN_UNAVAILABLE) {
      setMsg("Sign-In Currently Unavailable");
      return;
    }

    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      setMsg("Please enter a valid email.");
      return;
    }

    setBusy(true);
    try {
      // Email magic link (works for both "login" and "signup" flows)
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          // make sure this is allowed in Supabase Redirect URLs
          emailRedirectTo: "https://www.duxbowling.com"
        }
      });

      if (error) throw error;

      setMsg("Check your email for a sign-in link.");
    } catch (e: any) {
      setMsg(e?.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Fixed top-right button */}
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
          boxShadow: "0 10px 22px rgba(0,0,0,0.16)",
          display: "grid",
          placeItems: "center",
          zIndex: 60,
          cursor: "pointer"
        }}
      >
        {/* simple white user silhouette icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="white"
            d="M12 12c2.76 0 5-2.24 5-5S14.76 2 12 2 7 4.24 7 7s2.24 5 5 5zm0 2c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5z"
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
            zIndex: 80,
            display: "grid",
            placeItems: "center",
            padding: "1rem"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(420px, 92vw)",
              borderRadius: 16,
              background: "#fff",
              boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
              overflow: "hidden"
            }}
          >
            <div style={{ padding: "1rem 1rem 0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.1rem" }}>
                  {title}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  style={{ border: "none", background: "transparent", fontSize: "1.25rem", cursor: "pointer" }}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <TabButton active={mode === "login"} onClick={() => { setMode("login"); setMsg(null); }}>
                  Log in
                </TabButton>
                <TabButton active={mode === "signup"} onClick={() => { setMode("signup"); setMsg(null); }}>
                  Sign up
                </TabButton>
              </div>
            </div>

            <div style={{ padding: "1rem" }}>
              {SIGNIN_UNAVAILABLE ? (
                <div
                  style={{
                    padding: "1rem",
                    borderRadius: 12,
                    background: "#fff7f2",
                    border: `1px solid rgba(228,106,46,0.35)`,
                    color: "#7a4a2b",
                    lineHeight: 1.4
                  }}
                >
                  <strong>Sign-In Currently Unavailable</strong>
                  <div style={{ marginTop: 6, fontSize: ".95rem" }}>
                    We’re still wiring up authentication. Check back soon.
                  </div>
                </div>
              ) : (
                <>
                  <label style={{ display: "grid", gap: 6, fontSize: ".9rem", color: "#6a4a34" }}>
                    Email
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      inputMode="email"
                      autoComplete="email"
                      style={{
                        padding: "0.75rem",
                        borderRadius: 12,
                        border: "1px solid #ddd",
                        outline: "none"
                      }}
                    />
                  </label>

                  <button
                    onClick={submit}
                    disabled={busy}
                    style={{
                      marginTop: 12,
                      width: "100%",
                      padding: "0.85rem",
                      borderRadius: 14,
                      border: "none",
                      background: ORANGE,
                      color: "#fff",
                      fontWeight: 900,
                      cursor: busy ? "default" : "pointer",
                      opacity: busy ? 0.7 : 1
                    }}
                  >
                    {busy ? "Sending…" : "Send sign-in link"}
                  </button>

                  <div style={{ marginTop: 10, fontSize: ".85rem", color: "#7a5a45" }}>
                    We’ll email you a magic link — no password needed.
                  </div>
                </>
              )}

              {msg && (
                <div
                  style={{
                    marginTop: 12,
                    padding: "0.75rem",
                    borderRadius: 12,
                    background: "#f8f8f8",
                    border: "1px solid #eee",
                    color: "#333"
                  }}
                >
                  {msg}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "0.6rem 0.75rem",
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        fontWeight: 800,
        background: active ? "#e46a2e" : "#f2f2f2",
        color: active ? "#fff" : "#333"
      }}
    >
      {children}
    </button>
  );
}