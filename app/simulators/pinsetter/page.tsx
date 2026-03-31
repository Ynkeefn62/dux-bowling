"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";

type PinState = "missing" | "standing";

const PIN_LAYOUT = [
  [7],
  [8, 9],
  [4, 5, 6],
  [1, 2, 3, 10]
];

const PIN_TOTAL = 10;

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function makeSessionId() {
  return `lane-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

export default function PinsetterSimulatorPage() {
  const [sessionId, setSessionId] = useState("");
  const [pins, setPins] = useState<PinState[]>(Array(PIN_TOTAL).fill("standing"));
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState("Waiting for a lane screen to connect...");
  const [configRequest, setConfigRequest] = useState<number[]|null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incoming = params.get("session");
    const value = incoming || makeSessionId();
    setSessionId(value);
  }, []);

  const laneConnectUrl = useMemo(() => {
    if (!sessionId || typeof window === "undefined") return "";
    return `${window.location.origin}/simulators/lane-screen?session=${encodeURIComponent(sessionId)}`;
  }, [sessionId]);

  const qrSrc = useMemo(() => {
    if (!laneConnectUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(laneConnectUrl)}`;
  }, [laneConnectUrl]);

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
      .on("broadcast", { event: "lane:hello" }, () => {
        setStatus("Lane screen connected.");
      })
      .on("broadcast", { event: "lane:reset-request" }, () => {
        setPins(Array(PIN_TOTAL).fill("standing"));
        setSelected(new Set());
        setConfigRequest(null);
        setStatus("Lane requested a reset. Rack restored.");
      })
      .on("broadcast", { event: "lane:set-config" }, ({ payload }: { payload: { pinsToSet: number[] } }) => {
        const { pinsToSet } = payload;
        // Automatically update pin display to reflect next required configuration
        setPins(Array(PIN_TOTAL).fill(null).map((_, i) => {
          const pin = i + 1;
          return pinsToSet.includes(pin) ? "standing" : "missing";
        }));
        setSelected(new Set());
        setConfigRequest(pinsToSet);
        setStatus(`Next config: stand pins [${pinsToSet.join(", ")}]`);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  function togglePin(pin: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pin)) next.delete(pin);
      else next.add(pin);
      return next;
    });
  }

  async function submitFallenPins() {
    const fallenPins = Array.from(selected).sort((a, b) => a - b);

    setPins((prev) =>
      prev.map((state, index) => {
        const pin = index + 1;
        if (fallenPins.includes(pin)) return "missing";
        return state;
      })
    );
    setSelected(new Set());

    await channelRef.current?.send({
      type: "broadcast",
      event: "pins:fallen",
      payload: {
        fallenPins,
        standingPins: Array.from({ length: PIN_TOTAL }, (_, i) => i + 1).filter(
          (pin) => !fallenPins.includes(pin) && pins[pin - 1] === "standing"
        )
      }
    });
    setStatus(`Sent fallen pins: ${fallenPins.join(", ") || "none"}. Waiting for next roll...`);
  }

  async function resetPins() {
    setPins(Array(PIN_TOTAL).fill("standing"));
    setSelected(new Set());
    setStatus("Pins reset.");
    await channelRef.current?.send({ type: "broadcast", event: "pins:reset", payload: {} });
  }

  return (
    <main style={{ minHeight: "100vh", padding: "2rem", fontFamily: "Montserrat, system-ui", background: "#121212", color: "#f2f2f2" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Link href="/simulators" style={{ color: "#f2f2f2" }}>← Back to simulators</Link>
        <h1 style={{ marginBottom: ".3rem" }}>Pinsetter Simulator</h1>
        <p style={{ opacity: 0.8 }}>Tap pins to mark as fallen, then submit. The lane screen controls which pins to set up next.</p>

        {configRequest !== null && (
          <div style={{
            marginBottom: "1rem", padding: ".75rem 1rem",
            background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.35)",
            borderRadius: 10, fontSize: ".84rem", color: "#22d3ee", fontWeight: 700,
          }}>
            ⟳ Next rack: stand pins [{configRequest.join(", ")}]
            {configRequest.length === 10 ? " — full reset" : configRequest.length === 6 ? " — dice mode (6 pins)" : ""}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1fr) 280px", gap: "1.5rem", alignItems: "start" }}>
          <section style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, padding: "1rem" }}>
            {PIN_LAYOUT.map((row, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "center", gap: "1rem", margin: "1rem 0" }}>
                {row.map((pin) => {
                  const state = pins[pin - 1];
                  const isSelected = selected.has(pin);
                  const background = state === "missing" ? "transparent" : isSelected ? "#e46a2e" : "#f4e6c6";
                  const border = state === "missing" ? "2px dashed rgba(255,255,255,0.35)" : "2px solid rgba(255,255,255,0.12)";
                  return (
                    <button
                      key={pin}
                      disabled={state === "missing"}
                      onClick={() => togglePin(pin)}
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: "50%",
                        border,
                        background,
                        color: "#121212",
                        fontWeight: 700,
                        cursor: state === "missing" ? "not-allowed" : "pointer"
                      }}
                      aria-label={`Pin ${pin}`}
                    >
                      {pin}
                    </button>
                  );
                })}
              </div>
            ))}

            <div style={{ display: "flex", gap: ".75rem", justifyContent: "center", marginTop: "1rem" }}>
              <button onClick={submitFallenPins} style={{ padding: ".7rem 1.1rem", borderRadius: 10, border: 0, background: "#e46a2e", color: "#fff", fontWeight: 700 }}>
                Submit Fallen Pins
              </button>
              <button onClick={resetPins} style={{ padding: ".7rem 1.1rem", borderRadius: 10, border: "1px solid rgba(255,255,255,.2)", background: "transparent", color: "#fff" }}>
                Reset Rack
              </button>
            </div>
          </section>

          <aside style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, padding: "1rem", textAlign: "center" }}>
            <h3 style={{ marginTop: 0 }}>Connect Lane Screen</h3>
            {qrSrc ? <img src={qrSrc} alt="QR code to open lane screen simulator" width={220} height={220} style={{ borderRadius: 8, background: "white", padding: 8 }} /> : null}
            <p style={{ fontSize: ".8rem", opacity: 0.8, wordBreak: "break-all" }}>{laneConnectUrl}</p>
            <p style={{ fontSize: ".9rem", color: "#f4e6c6" }}>{status}</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
