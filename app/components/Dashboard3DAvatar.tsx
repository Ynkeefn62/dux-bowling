"use client";
import React, { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { AvatarState } from "@/app/avatar/AvatarSVG";
import BowlerCharacter3D from "@/app/avatar/BowlerCharacter3D";
import BowlingLane from "@/app/avatar/BowlingLane";

type Mood = "celebrate" | "idle" | "thinking";

/* ── Confetti particles (celebrate mood) ─────────────────────── */
function CelebrationParticles({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ["#ffd700", "#e46a2e", "#38d9f5", "#ff6b9d", "#a78bfa"];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 3 }}>
      {Array.from({ length: 18 }).map((_, i) => {
        const left  = (i * 13 + 7) % 100;
        const delay = (i * 0.13).toFixed(2) + "s";
        const dur   = (3 + (i % 4) * 0.6).toFixed(2) + "s";
        const color = colors[i % colors.length];
        const size  = 6 + (i % 4) * 2;
        return (
          <span key={i} style={{
            position: "absolute", left: `${left}%`, top: "-20px",
            width: size, height: size,
            borderRadius: i % 2 === 0 ? "50%" : "2px",
            background: color,
            boxShadow: `0 0 ${size * 1.2}px ${color}80`,
            animation: `dba-confetti ${dur} linear ${delay} infinite`,
          }} />
        );
      })}
      <style>{`
        @keyframes dba-confetti {
          0%   { transform: translateY(0)    rotate(0deg);   opacity: 0; }
          12%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(420px) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ── Glow ring around the canvas (mood colour) ───────────────── */
function MoodRing({ mood }: { mood: Mood }) {
  const color =
    mood === "celebrate" ? "#ffd700" :
    mood === "thinking"  ? "#38d9f5" : "#e46a2e";
  return (
    <div aria-hidden style={{
      position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
      borderRadius: "inherit",
      background: `radial-gradient(circle at 50% 50%, ${color}00 55%, ${color}44 72%, ${color}00 90%)`,
      animation: "dba-pulse 2.4s ease-in-out infinite",
    }}>
      <style>{`
        @keyframes dba-pulse {
          0%,100% { opacity: 0.55; transform: scale(0.97); }
          50%      { opacity: 1;    transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
}

/* ── Thinking dots (thinking mood) ──────────────────────────── */
function ThinkingDots({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div style={{
      position: "absolute", right: "10%", top: "10%", zIndex: 4,
      display: "flex", gap: 6,
      background: "rgba(255,255,255,0.90)",
      padding: "8px 12px", borderRadius: 18,
      boxShadow: "0 4px 14px rgba(0,0,0,0.14)",
    }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%", background: "#38d9f5",
          animation: `dba-think 1.2s ease-in-out ${i * 0.18}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes dba-think {
          0%,80%,100% { transform: translateY(0);    opacity: 0.5; }
          40%          { transform: translateY(-5px); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   Drop-in replacement for DashboardAvatarScene — renders the
   full 3D bowler with bowling lane, mood effects, and orbit.
   ══════════════════════════════════════════════════════════════ */
export default function Dashboard3DAvatar({
  state,
  mood = "idle",
}: {
  state: AvatarState;
  mood?: Mood;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <MoodRing mood={mood} />

      {mounted && (
        <Canvas
          style={{ width: "100%", height: "100%", display: "block" }}
          gl={{ alpha: true, antialias: true }}
          camera={{ position: [0, 0.30, 2.9], fov: 42 }}
          shadows
        >
          {/* lighting rig */}
          <ambientLight intensity={0.45} />
          {/* @ts-ignore — hemisphereLight args */}
          <hemisphereLight args={["#fff5e0", "#3a4a6a", 0.50]} />
          <directionalLight
            position={[2.5, 4.5, 3.5]}
            intensity={1.5}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight position={[-2, 1.5, -2]} intensity={0.30} color="#b8d4ff" />
          <pointLight position={[0, 1.6, 1.0]} intensity={0.20} color="#ffe8c0" />

          <Suspense fallback={null}>
            <BowlingLane />
            <BowlerCharacter3D state={state} />
          </Suspense>

          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={1.3}
            maxDistance={6.5}
            minPolarAngle={Math.PI * 0.20}
            maxPolarAngle={Math.PI * 0.62}
            target={[0, 0.10, 0]}
          />
        </Canvas>
      )}

      <CelebrationParticles active={mood === "celebrate"} />
      <ThinkingDots active={mood === "thinking"} />
    </div>
  );
}
