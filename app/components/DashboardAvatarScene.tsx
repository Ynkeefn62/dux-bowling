"use client";
import React, { useEffect, useState } from "react";
import AvatarSVG, { type AvatarState } from "@/app/avatar/AvatarSVG";

// ─── Re-export AvatarState for callers that import the type from here ─────────
export type { AvatarState };

// ─── Confetti / glow particles ───────────────────────────────────────────────
function CelebrationParticles({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ["#ffd700", "#e46a2e", "#38d9f5", "#ff6b9d", "#a78bfa"];
  const items = Array.from({ length: 16 });
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {items.map((_, i) => {
        const left = (i * 13 + 7) % 100;
        const delay = (i * 0.13).toFixed(2) + "s";
        const dur = (3 + (i % 4) * 0.6).toFixed(2) + "s";
        const color = colors[i % colors.length];
        const size = 6 + (i % 4) * 2;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: "-20px",
              width: size,
              height: size,
              borderRadius: i % 2 === 0 ? "50%" : "2px",
              background: color,
              boxShadow: `0 0 ${size * 1.2}px ${color}80`,
              animation: `confetti-fall ${dur} linear ${delay} infinite`,
              transformOrigin: "center",
            }}
          />
        );
      })}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(420px) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Glow ring (mood-coloured) ───────────────────────────────────────────────
function MoodRing({ mood }: { mood: string }) {
  const color =
    mood === "celebrate" ? "#ffd700" :
    mood === "thinking"  ? "#38d9f5" :
                           "#e46a2e";
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        background: `radial-gradient(circle at 50% 50%, ${color}00 60%, ${color}55 75%, ${color}00 92%)`,
        animation: "mood-pulse 2.4s ease-in-out infinite",
        pointerEvents: "none",
      }}
    >
      <style>{`
        @keyframes mood-pulse {
          0%, 100% { opacity: 0.6; transform: scale(0.96); }
          50% { opacity: 1; transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
}

// ─── Subtle thinking dots ────────────────────────────────────────────────────
function ThinkingDots({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div
      style={{
        position: "absolute",
        right: "12%",
        top: "8%",
        display: "flex",
        gap: 6,
        background: "rgba(255,255,255,0.92)",
        padding: "8px 12px",
        borderRadius: 18,
        boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#38d9f5",
            animation: `think-bounce 1.2s ease-in-out ${i * 0.18}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes think-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// Wraps AvatarSVG with mood-aware effects (confetti, glow, etc.)
// ═══════════════════════════════════════════════════════════════════════════
export default function DashboardAvatarScene({
  state,
  mood = "idle",
}: {
  state: AvatarState;
  mood?: "celebrate" | "idle" | "thinking";
}) {
  // Defer rendering one tick to avoid SSR hydration mismatch on animations
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <MoodRing mood={mood}/>
      <div style={{ position: "relative", width: "92%", height: "92%" }}>
        <AvatarSVG
          state={state}
          showBackground={true}
          animated={mounted}
        />
      </div>
      <CelebrationParticles active={mood === "celebrate"} />
      <ThinkingDots active={mood === "thinking"} />
    </div>
  );
}
