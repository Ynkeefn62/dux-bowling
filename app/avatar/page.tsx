"use client";

import { useEffect, useMemo, useState } from "react";

const CREAM = "#f5f0e6";
const ORANGE = "#e46a2e";
const TEXT_ORANGE = "#c75a1d";

type HairId = "pompadour" | "bob";
type OutfitId = "letterman" | "bowling-shirt";

type AvatarState = {
  skinTone: "light" | "tan" | "deep";
  hair: HairId;
  outfit: OutfitId;
  glasses: boolean;
};

function canUseDOM() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function setCookie(name: string, value: string, days = 365) {
  if (!canUseDOM()) return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}
function getCookie(name: string) {
  if (!canUseDOM()) return null;
  const key = encodeURIComponent(name) + "=";
  const parts = document.cookie.split(";").map(s => s.trim());
  for (const p of parts) {
    if (p.startsWith(key)) return decodeURIComponent(p.slice(key.length));
  }
  return null;
}

const DEFAULTS: AvatarState = {
  skinTone: "tan",
  hair: "pompadour",
  outfit: "bowling-shirt",
  glasses: false
};

function loadAvatarFromCookies(): AvatarState {
  const skinTone = (getCookie("avatar_skinTone") as AvatarState["skinTone"]) ?? DEFAULTS.skinTone;
  const hair = (getCookie("avatar_hair") as HairId) ?? DEFAULTS.hair;
  const outfit = (getCookie("avatar_outfit") as OutfitId) ?? DEFAULTS.outfit;
  const glasses = (getCookie("avatar_glasses") ?? (DEFAULTS.glasses ? "1" : "0")) === "1";

  // sanitize values
  const safeSkin: AvatarState["skinTone"] = ["light", "tan", "deep"].includes(skinTone) ? skinTone : DEFAULTS.skinTone;
  const safeHair: HairId = ["pompadour", "bob"].includes(hair) ? hair : DEFAULTS.hair;
  const safeOutfit: OutfitId = ["letterman", "bowling-shirt"].includes(outfit) ? outfit : DEFAULTS.outfit;

  return { skinTone: safeSkin, hair: safeHair, outfit: safeOutfit, glasses };
}

export default function AvatarPage() {
  const [state, setState] = useState<AvatarState>(DEFAULTS);

  // Load once on mount (avoids document access during prerender/build)
  useEffect(() => {
    setState(loadAvatarFromCookies());
  }, []);

  // Persist
  useEffect(() => {
    setCookie("avatar_skinTone", state.skinTone);
    setCookie("avatar_hair", state.hair);
    setCookie("avatar_outfit", state.outfit);
    setCookie("avatar_glasses", state.glasses ? "1" : "0");
  }, [state]);

  const skinFilter = useMemo(() => {
    // Simple tint via CSS filters so you can ship without multiple base SVGs.
    // Later you can swap base.svg fill colors instead.
    if (state.skinTone === "light") return "brightness(1.05) saturate(0.95)";
    if (state.skinTone === "tan") return "brightness(1.0) saturate(1.0)";
    return "brightness(0.90) saturate(1.05)";
  }, [state.skinTone]);

  const hairSrc = state.hair === "pompadour"
    ? "/avatars/retro/hair-pompadour.svg"
    : "/avatars/retro/hair-bob.svg";

  const outfitSrc = state.outfit === "letterman"
    ? "/avatars/retro/outfit-letterman.svg"
    : "/avatars/retro/outfit-bowling-shirt.svg";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: CREAM,
        fontFamily: "Montserrat, system-ui",
        padding: "2rem 1rem 3rem",
        color: TEXT_ORANGE
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
        <img src="/1@300x.png" alt="Dux Bowling" style={{ maxWidth: 160, width: "100%" }} />
      </div>

      <h1 style={{ textAlign: "center", color: ORANGE, marginBottom: ".5rem" }}>
        Create Your Avatar
      </h1>
      <p style={{ textAlign: "center", margin: "0 auto 1.25rem", maxWidth: 720 }}>
        Retro-futurist, 1950s cartoon style (original artwork).
      </p>

      {/* Avatar Preview */}
      <section
        style={{
          maxWidth: 720,
          margin: "0 auto 1rem",
          background: "#fff",
          borderRadius: 16,
          padding: "1rem",
          boxShadow: "0 12px 30px rgba(0,0,0,0.08)"
        }}
      >
        <div
          style={{
            width: 280,
            height: 330,
            margin: "0 auto",
            position: "relative"
          }}
        >
          {/* Base */}
          <img
            src="/avatars/retro/base.svg"
            alt="Avatar base"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              filter: skinFilter
            }}
          />

          {/* Outfit */}
          <img
            src={outfitSrc}
            alt="Outfit"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain"
            }}
          />

          {/* Hair */}
          <img
            src={hairSrc}
            alt="Hair"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain"
            }}
          />

          {/* Glasses */}
          {state.glasses && (
            <img
              src="/avatars/retro/accessory-glasses.svg"
              alt="Glasses"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain"
              }}
            />
          )}
        </div>
      </section>

      {/* Controls */}
      <section
        style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 16,
          padding: "1rem",
          boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
          display: "grid",
          gap: ".9rem"
        }}
      >
        <div style={{ display: "grid", gap: ".35rem" }}>
          <label style={{ fontWeight: 800, color: ORANGE }}>Skin Tone</label>
          <div style={{ display: "flex", gap: ".6rem" }}>
            {(["light", "tan", "deep"] as const).map(t => (
              <button
                key={t}
                onClick={() => setState(s => ({ ...s, skinTone: t }))}
                style={{
                  flex: 1,
                  padding: ".75rem",
                  borderRadius: 12,
                  border: `2px solid ${state.skinTone === t ? ORANGE : "#ddd"}`,
                  background: state.skinTone === t ? "#fff7f1" : "#fff",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: ".35rem" }}>
          <label style={{ fontWeight: 800, color: ORANGE }}>Hair</label>
          <div style={{ display: "flex", gap: ".6rem" }}>
            <button
              onClick={() => setState(s => ({ ...s, hair: "pompadour" }))}
              style={pill(state.hair === "pompadour")}
            >
              Pompadour
            </button>
            <button
              onClick={() => setState(s => ({ ...s, hair: "bob" }))}
              style={pill(state.hair === "bob")}
            >
              Bob
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: ".35rem" }}>
          <label style={{ fontWeight: 800, color: ORANGE }}>Outfit</label>
          <div style={{ display: "flex", gap: ".6rem" }}>
            <button
              onClick={() => setState(s => ({ ...s, outfit: "bowling-shirt" }))}
              style={pill(state.outfit === "bowling-shirt")}
            >
              Bowling Shirt
            </button>
            <button
              onClick={() => setState(s => ({ ...s, outfit: "letterman" }))}
              style={pill(state.outfit === "letterman")}
            >
              Letterman
            </button>
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
          <input
            type="checkbox"
            checked={state.glasses}
            onChange={(e) => setState(s => ({ ...s, glasses: e.target.checked }))}
          />
          <span style={{ fontWeight: 800, color: ORANGE }}>Glasses</span>
        </label>
      </section>
    </main>
  );
}

function pill(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: ".75rem",
    borderRadius: 12,
    border: `2px solid ${active ? "#e46a2e" : "#ddd"}`,
    background: active ? "#fff7f1" : "#fff",
    fontWeight: 800,
    cursor: "pointer"
  };
}