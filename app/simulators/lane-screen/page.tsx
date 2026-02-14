"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type GameType = "Traditional Duckpin" | "Low Ball" | "No Tap";

type RollEvent = {
  fallenPins: number[];
  standingPins: number[];
};

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function makeSessionId() {
  return `lane-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

export default function LaneScreenSimulatorPage() {
  const [sessionId, setSessionId] = useState("");
  const [game, setGame] = useState<GameType>("Traditional Duckpin");
  const [status, setStatus] = useState("Waiting for pinsetter events...");
  const [frames, setFrames] = useState<number[]>(Array(10).fill(0));
  const [frameIndex, setFrameIndex] = useState(0);
  const [rollsThisFrame, setRollsThisFrame] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incoming = params.get("session");
    setSessionId(incoming || makeSessionId());
  }, []);

  const loginQr = useMemo(() => {
    if (!sessionId || typeof window === "undefined") return "";
    const authUrl = `${window.location.origin}/auth/login?laneSession=${encodeURIComponent(sessionId)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(authUrl)}`;
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatus("Supabase env vars missing. Real-time sync unavailable in this environment.");
      return;
    }

    const channel = supabase.channel(`pinsetter-${sessionId}`, {
      config: { broadcast: { self: true } }
    });

    channel
      .on("broadcast", { event: "pins:fallen" }, ({ payload }: { payload: RollEvent }) => {
        const pinsHit = payload.fallenPins.length;

        setFrames((prev) => {
          const next = [...prev];
          const nextFrameScore = (next[frameIndex] || 0) + pinsHit;
          next[frameIndex] = nextFrameScore;

          const nextRollCount = rollsThisFrame + 1;
          const doneWithFrame = nextRollCount >= 3 || nextFrameScore >= 10;

          if (doneWithFrame) {
            setFrameIndex((value) => Math.min(value + 1, 9));
            setRollsThisFrame(0);
            setStatus("Requesting pin reset for next frame...");
            channel.send({ type: "broadcast", event: "lane:reset-request", payload: {} });
          } else {
            setRollsThisFrame(nextRollCount);
            setStatus(`Frame ${frameIndex + 1}: ${pinsHit} pins knocked down.`);
          }

          return next;
        });
      })
      .on("broadcast", { event: "pins:reset" }, () => {
        setStatus("Pins reset by pinsetter.");
      })
      .subscribe(async () => {
        await channel.send({ type: "broadcast", event: "lane:hello", payload: { sessionId } });
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [frameIndex, rollsThisFrame, sessionId]);

  return (
    <main style={{ minHeight: "100vh", padding: "2rem", fontFamily: "Montserrat, system-ui", background: "#161616", color: "#f5f5f5" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Link href="/simulators" style={{ color: "#f2f2f2" }}>← Back to simulators</Link>
        <h1 style={{ marginBottom: ".3rem" }}>Lane Screen Simulator</h1>
        <p style={{ opacity: 0.8 }}>Select game type, pair bowlers via QR code, and receive pinsetter events in real-time.</p>

        <section style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "1rem", alignItems: "start" }}>
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", padding: "1rem" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: ".5rem" }}>Game Type</label>
            <select
              value={game}
              onChange={(e) => setGame(e.target.value as GameType)}
              style={{ background: "#232323", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: ".6rem", minWidth: 220 }}
            >
              <option>Traditional Duckpin</option>
              <option>Low Ball</option>
              <option>No Tap</option>
            </select>

            <h3>Scoreboard</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(10, minmax(60px, 1fr))", gap: ".5rem" }}>
              {frames.map((score, idx) => (
                <div key={idx} style={{ padding: ".6rem", borderRadius: 10, border: `1px solid ${idx === frameIndex ? "#e46a2e" : "rgba(255,255,255,0.15)"}`, background: idx === frameIndex ? "rgba(228,106,46,0.17)" : "transparent", textAlign: "center" }}>
                  <div style={{ fontSize: ".75rem", opacity: 0.75 }}>Frame {idx + 1}</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{score}</div>
                </div>
              ))}
            </div>

            <p style={{ marginTop: "1rem", color: "#f4e6c6" }}>{status}</p>
            <p style={{ fontSize: ".85rem", opacity: 0.8 }}>Session: {sessionId}</p>
          </div>

          <aside style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", padding: "1rem", textAlign: "center" }}>
            <h3 style={{ marginTop: 0 }}>Bowler Login QR</h3>
            {loginQr ? <img src={loginQr} alt="QR code for bowler login" width={220} height={220} style={{ borderRadius: 8, background: "#fff", padding: 8 }} /> : null}
            <p style={{ fontSize: ".82rem", opacity: 0.8 }}>Bowlers scan this code to sign in on their own device.</p>
          </aside>
        </section>
      </div>
    </main>
  );
}
