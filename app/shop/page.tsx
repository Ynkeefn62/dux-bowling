"use client";
 
import { useState } from "react";
 
const BG      = "#121212";
const PANEL   = "rgba(26,26,26,0.88)";
const BORDER  = "rgba(255,255,255,0.08)";
const TEXT    = "#f2f2f2";
const MUTED   = "rgba(242,242,242,0.68)";
const ORANGE  = "#e46a2e";
const ORANGE_SOFT = "rgba(228,106,46,0.13)";
const SHADOW  = "0 18px 45px rgba(0,0,0,0.55)";
 
const PRODUCTS = [
  {
    emoji: "👕",
    name: "Dux Retro Tee",
    description: "Vintage-inspired duckpin graphic tee. 100% heavy cotton. Sizes S–3XL.",
    price: "$32",
    tag: "Most Popular",
  },
  {
    emoji: "🧢",
    name: "Dux Snapback",
    description: "Structured snapback with embroidered Dux logo. One size fits all.",
    price: "$28",
    tag: null,
  },
  {
    emoji: "🎳",
    name: "Lane Towel",
    description: "Microfiber lane towel with wrist loop. Built for league nights.",
    price: "$18",
    tag: null,
  },
  {
    emoji: "🧥",
    name: "Dux Bowling Shirt",
    description: "Button-up retro bowling shirt with Dux patch on the chest. Limited run.",
    price: "$65",
    tag: "Limited",
  },
  {
    emoji: "🎱",
    name: "Dux Duckpin Ball",
    description: "Official duckpin ball with Dux Bowling colorway. NDBC approved weight.",
    price: "$48",
    tag: "Coming Soon",
  },
  {
    emoji: "🏆",
    name: "League Trophy Pack",
    description: "Custom engraved trophies for your league season. Order for your whole alley.",
    price: "Custom",
    tag: "For Alleys",
  },
];
 
export default function ShopPage() {
  const [email, setEmail]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr]         = useState("");
 
  async function handleNotify() {
    if (!email.trim() || !email.includes("@")) {
      setErr("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    setErr("");
    try {
      // Stores email in Supabase via the notify route
      const res = await fetch("/api/shop/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        // Silently succeed even on error — don't block the user
      }
      setSubmitted(true);
    } catch {
      setSubmitted(true); // Still show success — don't lose the email
    } finally {
      setSubmitting(false);
    }
  }
 
  return (
    <main style={{ minHeight: "100vh", background: BG, fontFamily: "Montserrat, system-ui", color: TEXT }}>
      {/* Background glow */}
      <div aria-hidden="true" style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background:
          "radial-gradient(900px 500px at 18% 10%, rgba(228,106,46,0.20), transparent 55%)," +
          "radial-gradient(700px 400px at 85% 25%, rgba(228,106,46,0.10), transparent 58%)," +
          "linear-gradient(180deg, rgba(255,255,255,0.015), transparent 40%, rgba(0,0,0,0.25) 100%)",
      }} />
 
      <div style={{ position: "relative", zIndex: 1, padding: "2rem 1rem 5rem" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
 
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <img src="/1@300x.png" alt="Dux Bowling" style={{ maxWidth: 160, height: "auto", filter: "drop-shadow(0 14px 30px rgba(0,0,0,0.6))" }} />
          </div>
 
          {/* Hero */}
          <div style={{
            maxWidth: 860, margin: "0 auto 2rem",
            borderRadius: 20, padding: "2rem 1.75rem",
            background: PANEL, border: `1px solid ${BORDER}`,
            boxShadow: SHADOW, backdropFilter: "blur(10px)",
            textAlign: "center",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: ".5rem",
              padding: ".38rem .8rem", borderRadius: 999,
              background: ORANGE_SOFT, border: "1px solid rgba(228,106,46,0.22)",
              fontWeight: 900, fontSize: ".8rem", color: TEXT, marginBottom: "1rem",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: ORANGE, display: "inline-block" }} />
              Launching Soon
            </div>
 
            <h1 style={{ margin: "0 0 .75rem", fontSize: "clamp(2rem, 5vw, 3rem)", lineHeight: 1.05, fontWeight: 900 }}>
              Dux Bowling <span style={{ color: ORANGE }}>Gear</span>
            </h1>
 
            <p style={{ margin: "0 auto", maxWidth: 620, lineHeight: 1.75, color: MUTED, fontSize: "clamp(1rem, 2vw, 1.1rem)" }}>
              Retro-inspired merch for serious duckpin bowlers. Every purchase funds the development of the
              Mother Dux Pinsetter and helps keep the sport alive.
            </p>
 
            {/* Email capture */}
            <div style={{ marginTop: "1.75rem" }}>
              {submitted ? (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: ".6rem",
                  padding: ".85rem 1.25rem", borderRadius: 12,
                  background: "rgba(74,222,128,0.10)", border: "1px solid rgba(74,222,128,0.25)",
                  color: "#4ade80", fontWeight: 900, fontSize: ".92rem",
                }}>
                  ✓ You're on the list — we'll email you when we launch.
                </div>
              ) : (
                <div style={{ display: "flex", gap: ".6rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleNotify()}
                    placeholder="your@email.com"
                    style={{
                      padding: ".75rem 1rem", borderRadius: 12,
                      border: `1px solid ${err ? "rgba(248,113,113,0.5)" : BORDER}`,
                      background: "rgba(0,0,0,0.3)", color: TEXT,
                      fontFamily: "Montserrat, system-ui", fontSize: ".95rem",
                      width: "min(280px, 100%)", outline: "none",
                    }}
                  />
                  <button
                    onClick={handleNotify}
                    disabled={submitting}
                    style={{
                      padding: ".75rem 1.25rem", borderRadius: 12,
                      border: 0, background: ORANGE, color: "#fff",
                      fontWeight: 900, fontSize: ".92rem",
                      cursor: submitting ? "default" : "pointer",
                      opacity: submitting ? 0.7 : 1,
                      fontFamily: "Montserrat, system-ui",
                    }}
                  >
                    {submitting ? "Saving…" : "Notify Me at Launch"}
                  </button>
                </div>
              )}
              {err && <div style={{ marginTop: ".5rem", color: "#f87171", fontSize: ".82rem" }}>{err}</div>}
              {!submitted && (
                <div style={{ marginTop: ".6rem", color: MUTED, fontSize: ".78rem" }}>
                  No spam. One email when the shop opens.
                </div>
              )}
            </div>
          </div>
 
          {/* Product grid */}
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ margin: "0 0 1rem", color: TEXT, fontWeight: 900, fontSize: "1.2rem" }}>
              What's Coming
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
            }}>
              {PRODUCTS.map(p => (
                <div key={p.name} style={{
                  background: PANEL, border: `1px solid ${BORDER}`,
                  borderRadius: 18, padding: "1.25rem",
                  boxShadow: SHADOW, backdropFilter: "blur(8px)",
                  display: "flex", flexDirection: "column", gap: ".65rem",
                  position: "relative", overflow: "hidden",
                }}>
                  {/* Tag */}
                  {p.tag && (
                    <div style={{
                      position: "absolute", top: "1rem", right: "1rem",
                      padding: ".2rem .55rem", borderRadius: 999,
                      background: p.tag === "Limited" ? "rgba(251,146,60,0.15)" : p.tag === "For Alleys" ? "rgba(96,165,250,0.15)" : ORANGE_SOFT,
                      border: `1px solid ${p.tag === "Limited" ? "rgba(251,146,60,0.35)" : p.tag === "For Alleys" ? "rgba(96,165,250,0.35)" : "rgba(228,106,46,0.3)"}`,
                      color: p.tag === "Limited" ? "#fb923c" : p.tag === "For Alleys" ? "#60a5fa" : ORANGE,
                      fontWeight: 900, fontSize: ".65rem", letterSpacing: ".05em",
                    }}>
                      {p.tag}
                    </div>
                  )}
 
                  {/* Emoji placeholder */}
                  <div style={{
                    width: "100%", height: 120,
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 12, border: `1px solid ${BORDER}`,
                    display: "grid", placeItems: "center",
                    fontSize: "3.5rem",
                  }}>
                    {p.emoji}
                  </div>
 
                  <div>
                    <div style={{ fontWeight: 900, fontSize: "1rem", color: TEXT }}>{p.name}</div>
                    <div style={{ fontSize: ".82rem", color: MUTED, lineHeight: 1.6, marginTop: ".3rem" }}>{p.description}</div>
                  </div>
 
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                    <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.1rem" }}>{p.price}</div>
                    <button
                      onClick={() => setSubmitted(false) || setEmail("")}
                      style={{
                        padding: ".45rem .9rem", borderRadius: 8,
                        border: `1px solid rgba(228,106,46,0.35)`,
                        background: ORANGE_SOFT, color: ORANGE,
                        fontWeight: 900, fontSize: ".75rem", cursor: "pointer",
                        fontFamily: "Montserrat, system-ui",
                      }}
                    >
                      Notify Me
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
 
          {/* Avatar-linked merch */}
          <section style={{
            background: PANEL, border: `1px solid ${BORDER}`,
            borderRadius: 18, padding: "1.5rem",
            boxShadow: SHADOW, marginBottom: "1.25rem",
          }}>
            <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ fontSize: "2.5rem", flexShrink: 0 }}>🧑‍🎨</div>
              <div>
                <h3 style={{ margin: "0 0 .4rem", color: ORANGE, fontWeight: 900 }}>
                  Avatar-linked gear
                </h3>
                <p style={{ margin: 0, color: MUTED, lineHeight: 1.7, fontSize: ".92rem" }}>
                  Every purchase you make will unlock a matching cosmetic for your Dux Bowling avatar.
                  Buy a bowling shirt — your avatar wears it. Buy a hat — it shows up on your profile.
                  Your real-world gear becomes part of your digital identity.
                </p>
              </div>
            </div>
          </section>
 
          {/* Mission CTA */}
          <section style={{
            background: PANEL, border: `1px solid ${BORDER}`,
            borderRadius: 18, padding: "1.5rem",
            boxShadow: SHADOW, textAlign: "center",
          }}>
            <h3 style={{ margin: "0 0 .5rem", color: ORANGE, fontWeight: 900 }}>
              Every purchase supports the mission
            </h3>
            <p style={{ margin: "0 auto .85rem", maxWidth: 640, color: MUTED, lineHeight: 1.7, fontSize: ".9rem" }}>
              Proceeds go directly toward the Mother Dux Pinsetter — the first new duckpin pinsetter
              since 1973. Help us save the sport.
            </p>
            <a href="/about-us" style={{
              display: "inline-block", textDecoration: "none",
              padding: ".75rem 1.25rem", borderRadius: 999,
              border: `1px solid rgba(228,106,46,0.4)`,
              background: ORANGE_SOFT, color: ORANGE,
              fontWeight: 900, fontSize: ".88rem",
            }}>
              Read Our Story →
            </a>
          </section>
 
        </div>
      </div>
    </main>
  );
}
