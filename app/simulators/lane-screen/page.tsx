"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";

// ── Design tokens ─────────────────────────────────────────────
const ORANGE  = "#e46a2e";
const BG      = "#0e0e0e";
const PANEL   = "rgba(255,255,255,0.055)";
const BORDER  = "rgba(255,255,255,0.10)";
const TEXT    = "#f2f2f2";
const MUTED   = "rgba(242,242,242,0.60)";

// ── Pin layout (duckpin triangle: back row first = pins 7,8,9,4,5,6,1,2,3,10) ──
// Displayed in bowling convention — pin 7 top-left, pin 10 top-right
//   7    8    9
//  4    5    6
//    1  2  3
//       10
// We store pins as 1-indexed numbers.
const PIN_ROWS = [[7, 8, 9], [4, 5, 6], [1, 2, 3], [10]];

// ── Types ─────────────────────────────────────────────────────
type Mark = "strike" | "spare" | "open" | null;

// Per-frame state for one player
type Frame = {
  r1: number | null;
  r2: number | null;
  r3: number | null;        // only used in 10th frame
  mark: Mark;
  frameScore: number | null;
  runningTotal: number | null;
};

type Player = {
  id: string;
  name: string;
  frames: Frame[];
  currentFrame: number;  // 0-indexed, 0-9
  ballInFrame: number;   // 1, 2, or 3
  pinsStanding: number[]; // which pins are still up for this player
  done: boolean;
};

type RollEvent = {
  fallenPins: number[];
  standingPins: number[];
  speedMph?: number;
};

// ── Supabase ──────────────────────────────────────────────────
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function makeSessionId() {
  return `lane-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

// ── Duckpin scoring engine ─────────────────────────────────────
function emptyFrame(): Frame {
  return { r1: null, r2: null, r3: null, mark: null, frameScore: null, runningTotal: null };
}

function emptyPlayer(id: string, name: string): Player {
  return {
    id,
    name,
    frames: Array.from({ length: 10 }, emptyFrame),
    currentFrame: 0,
    ballInFrame: 1,
    pinsStanding: [1,2,3,4,5,6,7,8,9,10],
    done: false,
  };
}

// Compute frame scores and running totals for all 10 frames.
// Returns new frames array with frameScore and runningTotal filled where calculable.
function computeScores(frames: Frame[]): Frame[] {
  // Build roll stream for bonus lookups
  const rolls: (number | null)[] = [];
  for (let i = 0; i < 10; i++) {
    const f = frames[i];
    if (i < 9) {
      rolls.push(f.r1);
      if (f.r1 !== 10) {
        rolls.push(f.r2);
        if (f.r1 !== null && f.r2 !== null && f.r1 + f.r2 !== 10) rolls.push(f.r3);
      }
    } else {
      // 10th: always push all 3
      rolls.push(f.r1, f.r2, f.r3);
    }
  }

  const result = frames.map(f => ({ ...f }));
  let rollIdx = 0;
  let running = 0;

  for (let i = 0; i < 10; i++) {
    const f = result[i];

    if (i < 9) {
      if (f.r1 === 10) {
        // Strike — bonus = next 2 rolls
        const b1 = rolls[rollIdx + 1] ?? null;
        const b2 = rolls[rollIdx + 2] ?? null;
        if (b1 !== null && b2 !== null) {
          f.frameScore = 10 + b1 + b2;
          running += f.frameScore;
          f.runningTotal = running;
        }
        rollIdx += 1;
      } else if (f.r1 !== null && f.r2 !== null && f.r1 + f.r2 === 10) {
        // Spare (2-ball) — bonus = next 1 roll
        const b1 = rolls[rollIdx + 2] ?? null;
        if (b1 !== null) {
          f.frameScore = 10 + b1;
          running += f.frameScore;
          f.runningTotal = running;
        }
        rollIdx += 2;
      } else if (f.r1 !== null && f.r2 !== null) {
        // Open frame
        const r3 = (f.r1 + f.r2 < 10 && f.r3 !== null) ? f.r3 : 0;
        // In duckpins frames 1-9: if spare in 3, count 10 + next ball
        if (f.r1 + f.r2 + (f.r3 ?? 0) === 10 && f.r3 !== null) {
          const b1 = rolls[rollIdx + 3] ?? null;
          if (b1 !== null) {
            f.frameScore = 10 + b1;
            running += f.frameScore;
            f.runningTotal = running;
          }
          rollIdx += 3;
        } else if (f.r3 !== null) {
          f.frameScore = f.r1 + f.r2 + f.r3;
          running += f.frameScore;
          f.runningTotal = running;
          rollIdx += 3;
        } else {
          rollIdx += 2;
        }
      } else {
        break; // frame not complete yet — stop calculating
      }
    } else {
      // 10th frame — no bonuses beyond the 3 rolls
      if (f.r1 !== null && f.r2 !== null && f.r3 !== null) {
        f.frameScore = f.r1 + f.r2 + f.r3;
        running += f.frameScore;
        f.runningTotal = running;
      }
    }
  }

  return result;
}

// Apply a roll to a player — returns updated player state
function applyRoll(player: Player, fallenCount: number): Player {
  const p = {
    ...player,
    frames: player.frames.map(f => ({ ...f })),
    pinsStanding: [...player.pinsStanding],
  };

  const fi   = p.currentFrame;
  const ball = p.ballInFrame;
  const f    = p.frames[fi];
  const is10th = fi === 9;

  // Record the roll
  if (ball === 1) f.r1 = fallenCount;
  else if (ball === 2) f.r2 = fallenCount;
  else f.r3 = fallenCount;

  // Remove fallen pins from standing
  // (pinsetter sends fallenPins array but we track count per ball)
  // For display we rebuild from counts
  // Reset pinsStanding logic:
  const r1 = f.r1 ?? 0;
  const r2 = f.r2 ?? 0;

  // Determine if frame is done and what to do next
  let frameDone = false;

  if (!is10th) {
    if (ball === 1 && r1 === 10) {
      // Strike
      f.mark = "strike";
      frameDone = true;
    } else if (ball === 2 && r1 + r2 === 10) {
      // Spare in 2
      f.mark = "spare";
      frameDone = true;
    } else if (ball === 3) {
      // Open frame (3-ball)
      const r3 = f.r3 ?? 0;
      if (r1 + r2 + r3 === 10) f.mark = "spare";
      else f.mark = "open";
      frameDone = true;
    } else {
      f.mark = null;
      // Continue to next ball — update pins standing
      p.pinsStanding = p.pinsStanding.slice(fallenCount);
    }
  } else {
    // 10th frame
    if (ball === 1) {
      if (r1 === 10) {
        // Strike on ball 1 — fresh rack for ball 2
        p.pinsStanding = [1,2,3,4,5,6,7,8,9,10];
      }
    } else if (ball === 2) {
      const r2v = f.r2 ?? 0;
      if (r1 === 10 && r2v === 10) {
        // Two strikes — fresh rack again
        p.pinsStanding = [1,2,3,4,5,6,7,8,9,10];
      } else if (r1 === 10) {
        // Strike then open — remaining from ball 2
        p.pinsStanding = p.pinsStanding.slice(r2v);
      } else if (r1 + r2v === 10) {
        // Spare — fresh rack
        p.pinsStanding = [1,2,3,4,5,6,7,8,9,10];
      }
    } else if (ball === 3) {
      frameDone = true;
    }
  }

  if (frameDone) {
    p.frames = computeScores(p.frames);
    if (fi < 9) {
      p.currentFrame = fi + 1;
      p.ballInFrame  = 1;
      p.pinsStanding = [1,2,3,4,5,6,7,8,9,10];
    } else {
      p.done = true;
      p.ballInFrame = 3;
    }
  } else {
    p.ballInFrame = ball + 1;
  }

  return p;
}

// ── Scoreboard cell display ───────────────────────────────────
function ballDisplay(val: number | null, isFirst: boolean, r1: number | null): string {
  if (val === null) return "";
  if (val === 10 && isFirst) return "X";
  if (!isFirst && r1 !== null && r1 + val === 10) return "/";
  if (val === 0) return "-";
  return String(val);
}

// ── Pin diagram component ──────────────────────────────────────
function PinDiagram({ standing, size = 56 }: { standing: number[]; size?: number }) {
  const standingSet = new Set(standing);
  return (
    <div style={{ display: "inline-block" }}>
      {PIN_ROWS.map((row, ri) => (
        <div key={ri} style={{ display: "flex", justifyContent: "center", gap: size * 0.22, marginBottom: size * 0.1 }}>
          {row.map(pin => {
            const up = standingSet.has(pin);
            return (
              <div
                key={pin}
                title={`Pin ${pin}`}
                style={{
                  width:  size * 0.48,
                  height: size * 0.48,
                  borderRadius: "50%",
                  background: up ? ORANGE : "rgba(255,255,255,0.12)",
                  border: `2px solid ${up ? "rgba(255,200,150,0.5)" : "rgba(255,255,255,0.08)"}`,
                  display: "grid",
                  placeItems: "center",
                  fontSize: size * 0.16,
                  fontWeight: 900,
                  color: up ? "#fff" : "rgba(255,255,255,0.25)",
                  transition: "background 300ms, border 300ms",
                  flexShrink: 0,
                }}
              >
                {pin}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Scoreboard row for one player ─────────────────────────────
function ScoreRow({ player, isActive }: { player: Player; isActive: boolean }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      {/* Player name */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: ".5rem",
        marginBottom: ".35rem",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: isActive ? ORANGE : "rgba(255,255,255,0.15)",
          display: "grid", placeItems: "center",
          fontWeight: 900, fontSize: ".7rem", color: "#fff", flexShrink: 0,
        }}>
          {player.name.charAt(0).toUpperCase()}
        </div>
        <span style={{ fontWeight: 900, color: isActive ? ORANGE : TEXT, fontSize: ".92rem" }}>
          {player.name}
        </span>
        {player.done && (
          <span style={{ marginLeft: "auto", fontWeight: 900, color: ORANGE, fontSize: "1rem" }}>
            {player.frames[9].runningTotal ?? "—"}
          </span>
        )}
      </div>

      {/* Frame cells */}
      <div style={{ display: "flex", gap: 3 }}>
        {player.frames.map((f, fi) => {
          const isCurrentFrame = fi === player.currentFrame && !player.done;
          const is10th = fi === 9;

          // Ball display strings
          const b1 = ballDisplay(f.r1, true, null);
          const b2 = ballDisplay(f.r2, false, f.r1);
          const b3 = is10th
            ? (f.r3 === 10 ? "X" : f.r3 !== null && f.r2 !== null && f.r3 + f.r2 === 10 ? "/" : f.r3 !== null ? String(f.r3) : "")
            : "";

          return (
            <div
              key={fi}
              style={{
                flex: is10th ? 1.4 : 1,
                minWidth: 0,
                border: `1px solid ${isCurrentFrame ? ORANGE : BORDER}`,
                borderRadius: 8,
                background: isCurrentFrame ? "rgba(228,106,46,0.12)" : PANEL,
                overflow: "hidden",
              }}
            >
              {/* Ball markers */}
              <div style={{
                display: "flex",
                justifyContent: is10th ? "flex-end" : "flex-end",
                gap: 2,
                padding: "3px 5px 2px",
                borderBottom: `1px solid ${BORDER}`,
                minHeight: 20,
              }}>
                {is10th ? (
                  <>
                    <BallCell val={b1} isStrike={f.r1 === 10} />
                    <BallCell val={b2} isSpare={b2 === "/"} isStrike={f.r1 === 10 && f.r2 === 10} />
                    <BallCell val={b3} isSpare={b3 === "/"} isStrike={b3 === "X"} />
                  </>
                ) : f.r1 === 10 ? (
                  <BallCell val="X" isStrike />
                ) : (
                  <>
                    <BallCell val={b1} />
                    <BallCell val={b2} isSpare={b2 === "/"} />
                  </>
                )}
              </div>

              {/* Running total */}
              <div style={{
                textAlign: "center",
                fontWeight: 900,
                fontSize: ".85rem",
                padding: "4px 2px",
                color: f.runningTotal !== null ? TEXT : MUTED,
                minHeight: 24,
              }}>
                {f.runningTotal ?? (isCurrentFrame ? "·" : "")}
              </div>

              {/* Frame number */}
              <div style={{
                textAlign: "center",
                fontSize: ".6rem",
                color: MUTED,
                paddingBottom: 3,
                letterSpacing: ".04em",
              }}>
                {fi + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BallCell({ val, isStrike = false, isSpare = false }: { val: string; isStrike?: boolean; isSpare?: boolean }) {
  if (!val) return null;
  return (
    <span style={{
      fontWeight: 900,
      fontSize: ".72rem",
      color: isStrike || isSpare ? ORANGE : TEXT,
      minWidth: 12,
      textAlign: "center",
    }}>
      {val}
    </span>
  );
}

// ── Add player modal ──────────────────────────────────────────
function AddPlayerModal({ onAdd, onClose }: { onAdd: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.6)",
      display: "grid", placeItems: "center",
      zIndex: 100,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#1a1a1a", border: `1px solid ${BORDER}`,
        borderRadius: 16, padding: "1.5rem",
        width: "min(380px, 90vw)",
        fontFamily: "Montserrat, system-ui",
      }}>
        <h3 style={{ margin: "0 0 1rem", color: ORANGE }}>Add Bowler</h3>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && name.trim()) { onAdd(name.trim()); onClose(); }}}
          placeholder="Bowler name"
          style={{
            width: "100%", boxSizing: "border-box",
            padding: ".75rem", borderRadius: 10,
            border: `1px solid ${BORDER}`,
            background: "#111", color: TEXT,
            fontFamily: "Montserrat, system-ui",
            fontSize: "1rem",
          }}
        />
        <div style={{ display: "flex", gap: ".75rem", marginTop: "1rem" }}>
          <button
            onClick={() => { if (name.trim()) { onAdd(name.trim()); onClose(); }}}
            style={{
              flex: 1, padding: ".8rem", borderRadius: 10,
              border: 0, background: ORANGE, color: "#fff",
              fontWeight: 900, cursor: "pointer",
            }}
          >
            Add Bowler
          </button>
          <button
            onClick={onClose}
            style={{
              padding: ".8rem 1rem", borderRadius: 10,
              border: `1px solid ${BORDER}`, background: "transparent",
              color: TEXT, cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function LaneScreenSimulatorPage() {
  const [sessionId, setSessionId]   = useState("");
  const [players, setPlayers]       = useState<Player[]>([]);
  const [activeIdx, setActiveIdx]   = useState(0);
  const [lastRoll, setLastRoll]     = useState<{ count: number; speed?: number } | null>(null);
  const [status, setStatus]         = useState("Waiting for pinsetter to connect…");
  const [connected, setConnected]   = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [laneNum, setLaneNum]       = useState("4");
  const [showReset, setShowReset]   = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);

  // Stable references for Realtime callback
  const playersRef  = useRef(players);
  const activeIdxRef = useRef(activeIdx);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { activeIdxRef.current = activeIdx; }, [activeIdx]);

  // Session ID from URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get("session") || makeSessionId());
  }, []);

  // QR codes
  const loginQr = useMemo(() => {
    if (!sessionId || typeof window === "undefined") return "";
    const url = `${window.location.origin}/game`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
  }, [sessionId]);

  // Realtime channel — stable, never reconnects mid-game
  useEffect(() => {
    if (!sessionId) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatus("⚠ Supabase env vars missing — real-time unavailable.");
      return;
    }

    const channel = supabase.channel(`pinsetter-${sessionId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "lane:hello" }, () => {
        setConnected(true);
        setStatus("Pinsetter connected. Ready to bowl.");
      })
      .on("broadcast", { event: "pins:reset" }, () => {
        setStatus("Pins reset.");
        setLastRoll(null);
      })
      .on("broadcast", { event: "pins:fallen" }, ({ payload }: { payload: RollEvent }) => {
        const current = playersRef.current;
        const idx     = activeIdxRef.current;

        if (!current.length) {
          setStatus("⚠ Add bowlers before recording rolls.");
          return;
        }

        const fallenCount = payload.fallenPins.length;
        const speed       = payload.speedMph;

        setLastRoll({ count: fallenCount, speed });

        const player = current[idx];
        const updated = applyRoll(player, fallenCount);

        const newPlayers = current.map((p, i) => (i === idx ? updated : p));
        setPlayers(newPlayers);
        playersRef.current = newPlayers;

        // Advance to next player when frame is done
        if (updated.done || (updated.currentFrame > player.currentFrame && updated.ballInFrame === 1)) {
          // Frame complete — find next active player
          const allDone = newPlayers.every(p => p.done);
          if (!allDone) {
            let nextIdx = (idx + 1) % newPlayers.length;
            while (newPlayers[nextIdx].done) nextIdx = (nextIdx + 1) % newPlayers.length;
            setActiveIdx(nextIdx);
            activeIdxRef.current = nextIdx;
          }
          setStatus(updated.done
            ? `${player.name} finished — final score: ${updated.frames[9].runningTotal ?? "?"}`
            : `${player.name} — frame complete. Next bowler: ${newPlayers[activeIdxRef.current].name}`
          );
          // Tell pinsetter to reset
          channel.send({ type: "broadcast", event: "lane:reset-request", payload: {} });
        } else {
          const mark = fallenCount === 10 ? " — STRIKE! 🎳" : "";
          setStatus(`${player.name}: knocked down ${fallenCount} pin${fallenCount !== 1 ? "s" : ""}${mark}`);
        }
      })
      .subscribe(async () => {
        await channel.send({ type: "broadcast", event: "lane:hello", payload: { sessionId } });
      });

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [sessionId]); // ← only sessionId — never reconnects mid-game

  function addPlayer(name: string) {
    const id = `player-${Date.now()}`;
    setPlayers(prev => [...prev, emptyPlayer(id, name)]);
  }

  function resetGame() {
    setPlayers(prev => prev.map(p => emptyPlayer(p.id, p.name)));
    setActiveIdx(0);
    setLastRoll(null);
    setStatus("Game reset. Ready to bowl.");
    channelRef.current?.send({ type: "broadcast", event: "lane:reset-request", payload: {} });
    setShowReset(false);
  }

  const activePlayer = players[activeIdx] ?? null;
  const allDone = players.length > 0 && players.every(p => p.done);

  return (
    <main style={{
      minHeight: "100vh",
      background: BG,
      fontFamily: "Montserrat, system-ui",
      color: TEXT,
      padding: "1.25rem",
    }}>
      {showAddPlayer && (
        <AddPlayerModal
          onAdd={addPlayer}
          onClose={() => setShowAddPlayer(false)}
        />
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <Link href="/simulators" style={{ color: MUTED, fontSize: ".85rem", textDecoration: "none" }}>
            ← Simulators
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: "1.15rem" }}>
              Lane Screen Simulator
              <span style={{ marginLeft: ".75rem", fontSize: ".8rem", color: MUTED, fontWeight: 600 }}>
                Lane {laneNum}
              </span>
            </div>
            <div style={{
              marginTop: ".2rem",
              display: "inline-flex", alignItems: "center", gap: ".4rem",
              fontSize: ".78rem",
              color: connected ? "#4ade80" : MUTED,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: connected ? "#4ade80" : "rgba(255,255,255,0.25)",
                display: "inline-block",
              }} />
              {connected ? "Pinsetter connected" : "Waiting for pinsetter…"}
            </div>
          </div>

          <div style={{ display: "flex", gap: ".5rem" }}>
            <button
              onClick={() => setShowAddPlayer(true)}
              style={{
                padding: ".55rem .9rem", borderRadius: 10,
                border: 0, background: ORANGE, color: "#fff",
                fontWeight: 900, fontSize: ".82rem", cursor: "pointer",
              }}
            >
              + Add Bowler
            </button>
            {players.length > 0 && (
              <button
                onClick={() => setShowReset(true)}
                style={{
                  padding: ".55rem .9rem", borderRadius: 10,
                  border: `1px solid ${BORDER}`, background: "transparent",
                  color: MUTED, fontSize: ".82rem", cursor: "pointer",
                }}
              >
                New Game
              </button>
            )}
          </div>
        </div>

        {/* Reset confirm */}
        {showReset && (
          <div style={{
            background: "rgba(228,106,46,0.12)", border: `1px solid ${ORANGE}`,
            borderRadius: 12, padding: "1rem", marginBottom: "1rem",
            display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
          }}>
            <span style={{ flex: 1, fontWeight: 700 }}>Reset and start a new game? Current scores will be lost.</span>
            <button onClick={resetGame} style={{ padding: ".55rem 1rem", borderRadius: 8, border: 0, background: ORANGE, color: "#fff", fontWeight: 900, cursor: "pointer" }}>
              Reset
            </button>
            <button onClick={() => setShowReset(false)} style={{ padding: ".55rem 1rem", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "1rem", alignItems: "start" }}>

          {/* ── LEFT: scoreboard + live info ── */}
          <div>
            {/* Status bar */}
            <div style={{
              background: PANEL, border: `1px solid ${BORDER}`,
              borderRadius: 12, padding: ".7rem 1rem",
              marginBottom: "1rem",
              display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
            }}>
              <div style={{ flex: 1, fontWeight: 700, color: ORANGE, fontSize: ".9rem" }}>
                {status}
              </div>
              {lastRoll && (
                <div style={{ fontSize: ".82rem", color: MUTED }}>
                  {lastRoll.count === 10 ? "🎳 STRIKE" : `${lastRoll.count} pins`}
                  {lastRoll.speed ? ` · ${lastRoll.speed.toFixed(1)} mph` : ""}
                </div>
              )}
            </div>

            {/* Current player highlight */}
            {activePlayer && !allDone && (
              <div style={{
                background: "rgba(228,106,46,0.10)", border: `1px solid rgba(228,106,46,0.3)`,
                borderRadius: 12, padding: ".65rem 1rem",
                marginBottom: "1rem",
                display: "flex", alignItems: "center", gap: "1rem",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: ORANGE, display: "grid", placeItems: "center",
                  fontWeight: 900, color: "#fff", flexShrink: 0,
                }}>
                  {activePlayer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 900, color: ORANGE }}>{activePlayer.name}</div>
                  <div style={{ fontSize: ".78rem", color: MUTED }}>
                    Frame {activePlayer.currentFrame + 1} · Ball {activePlayer.ballInFrame}
                    {activePlayer.frames[activePlayer.currentFrame].runningTotal !== null
                      ? ` · Running: ${activePlayer.frames[activePlayer.currentFrame - 1]?.runningTotal ?? 0}`
                      : ""}
                  </div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <PinDiagram standing={activePlayer.pinsStanding} size={72} />
                </div>
              </div>
            )}

            {/* All done summary */}
            {allDone && (
              <div style={{
                background: "rgba(228,106,46,0.10)", border: `1px solid ${ORANGE}`,
                borderRadius: 12, padding: "1rem",
                marginBottom: "1rem", textAlign: "center",
              }}>
                <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.1rem", marginBottom: ".5rem" }}>
                  🎳 Game Complete!
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap" }}>
                  {[...players]
                    .sort((a, b) => (b.frames[9].runningTotal ?? 0) - (a.frames[9].runningTotal ?? 0))
                    .map((p, i) => (
                      <div key={p.id} style={{ textAlign: "center" }}>
                        <div style={{ fontWeight: 900, color: i === 0 ? ORANGE : TEXT }}>{p.name}</div>
                        <div style={{ fontSize: "1.6rem", fontWeight: 900, color: i === 0 ? ORANGE : TEXT }}>
                          {p.frames[9].runningTotal ?? "—"}
                        </div>
                        {i === 0 && <div style={{ fontSize: ".75rem", color: MUTED }}>Winner</div>}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Scoreboard */}
            {players.length > 0 ? (
              <div style={{
                background: PANEL, border: `1px solid ${BORDER}`,
                borderRadius: 14, padding: "1rem",
              }}>
                <div style={{ fontWeight: 900, fontSize: ".78rem", color: MUTED, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: ".75rem" }}>
                  Scoreboard
                </div>
                {players.map((p, i) => (
                  <ScoreRow key={p.id} player={p} isActive={i === activeIdx && !allDone} />
                ))}
              </div>
            ) : (
              <div style={{
                background: PANEL, border: `1px solid ${BORDER}`,
                borderRadius: 14, padding: "2rem",
                textAlign: "center", color: MUTED,
              }}>
                <div style={{ fontSize: "1.5rem", marginBottom: ".5rem" }}>🎳</div>
                <div style={{ fontWeight: 700 }}>No bowlers yet</div>
                <div style={{ fontSize: ".85rem", marginTop: ".35rem" }}>
                  Click "Add Bowler" to get started
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: connection info ── */}
          <div style={{ display: "grid", gap: "1rem" }}>

            {/* Pinsetter link */}
            <div style={{
              background: PANEL, border: `1px solid ${BORDER}`,
              borderRadius: 14, padding: "1rem", textAlign: "center",
            }}>
              <div style={{ fontWeight: 900, fontSize: ".78rem", color: MUTED, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: ".6rem" }}>
                Pinsetter Simulator
              </div>
              <Link
                href={`/simulators/pinsetter?session=${encodeURIComponent(sessionId)}`}
                target="_blank"
                style={{
                  display: "block", padding: ".7rem",
                  borderRadius: 10, background: ORANGE,
                  color: "#fff", fontWeight: 900,
                  fontSize: ".85rem", textDecoration: "none",
                }}
              >
                Open Pinsetter →
              </Link>
              <div style={{ fontSize: ".72rem", color: MUTED, marginTop: ".5rem" }}>
                Opens in a new tab — use on second device or split screen
              </div>
            </div>

            {/* Score tracker QR */}
            <div style={{
              background: PANEL, border: `1px solid ${BORDER}`,
              borderRadius: 14, padding: "1rem", textAlign: "center",
            }}>
              <div style={{ fontWeight: 900, fontSize: ".78rem", color: MUTED, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: ".6rem" }}>
                Score Tracker QR
              </div>
              {loginQr && (
                <img
                  src={loginQr}
                  alt="QR to score tracker"
                  width={160} height={160}
                  style={{ borderRadius: 8, background: "#fff", padding: 6 }}
                />
              )}
              <div style={{ fontSize: ".72rem", color: MUTED, marginTop: ".5rem" }}>
                Bowlers scan this to log their own scores
              </div>
            </div>

            {/* Lane settings */}
            <div style={{
              background: PANEL, border: `1px solid ${BORDER}`,
              borderRadius: 14, padding: "1rem",
            }}>
              <div style={{ fontWeight: 900, fontSize: ".78rem", color: MUTED, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: ".6rem" }}>
                Lane Settings
              </div>
              <label style={{ display: "block", fontSize: ".82rem", color: MUTED, marginBottom: ".3rem" }}>Lane Number</label>
              <input
                value={laneNum}
                onChange={e => setLaneNum(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: ".55rem .7rem", borderRadius: 8,
                  border: `1px solid ${BORDER}`, background: "#111",
                  color: TEXT, fontFamily: "Montserrat, system-ui",
                  fontSize: ".9rem",
                }}
              />
              <div style={{ fontSize: ".72rem", color: MUTED, marginTop: ".5rem" }}>
                Session: <span style={{ color: TEXT, fontWeight: 700 }}>{sessionId.slice(0, 12)}…</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}