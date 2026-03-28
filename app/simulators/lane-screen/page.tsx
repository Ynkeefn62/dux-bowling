“use client”;

import Link from “next/link”;
import { useEffect, useMemo, useRef, useState } from “react”;
import { createClient, RealtimeChannel } from “@supabase/supabase-js”;

// ── Design tokens ─────────────────────────────────────────────
const ORANGE = “#e46a2e”;
const BG     = “#0e0e0e”;
const PANEL  = “rgba(255,255,255,0.055)”;
const BORDER = “rgba(255,255,255,0.10)”;
const TEXT   = “#f2f2f2”;
const MUTED  = “rgba(242,242,242,0.60)”;

// ── Pin diagram layout ────────────────────────────────────────
const PIN_ROWS = [[7, 8, 9], [4, 5, 6], [1, 2, 3], [10]];

// ── Types ─────────────────────────────────────────────────────
type Mark = “strike” | “spare” | “open” | null;

type Frame = {
r1: number | null;
r2: number | null;
r3: number | null;
mark: Mark;
frameScore: number | null;
runningTotal: number | null;
};

type Player = {
id: string;
name: string;
userId: string | null;   // Supabase auth UUID if logged in, null for guest
gameId: string | null;   // dux_games.id once first frame is written
frames: Frame[];
currentFrame: number;    // 0-indexed
ballInFrame: number;     // 1, 2, or 3
pinsStanding: number[];
done: boolean;
dbError: string | null;  // last DB write error, shown in UI
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

// ── Database write (lane screen → API) ───────────────────────
async function writFrameToDb(
player: Player,
frameNumber: number,    // 1-indexed
laneNumber: number | null,
locationName: string,
): Promise<{ gameId: string } | { error: string }> {
const frame = player.frames[frameNumber - 1];

const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Note: we use the Supabase service role key for lane-sync.
// In production this would be a dedicated lane device credential.
// For the simulator we pass it via a separate env var.
const laneKey = (process.env.NEXT_PUBLIC_LANE_DEVICE_KEY
|| process.env.SUPABASE_SERVICE_ROLE_KEY
|| “”);

try {
const res = await fetch(”/api/game/lane-sync”, {
method: “POST”,
headers: {
“Content-Type”: “application/json”,
Authorization: `Bearer ${laneKey}`,
},
body: JSON.stringify({
user_id:        player.userId ?? null,
game_id:        player.gameId ?? null,
frame_number:   frameNumber,
lane_number:    laneNumber,
location_name:  locationName || null,
event_type_name: “Scrimmage”,
game_number:    1,
r1: frame.r1,
r2: frame.r2,
r3: frame.r3,
}),
});

```
const data = await res.json().catch(() => null);

if (!res.ok || !data?.ok) {
  return { error: data?.error ?? `HTTP ${res.status}` };
}

return { gameId: data.game_id as string };
```

} catch (err: any) {
return { error: err?.message ?? “Network error” };
}
}

// ── Duckpin scoring ────────────────────────────────────────────
function emptyFrame(): Frame {
return { r1: null, r2: null, r3: null, mark: null, frameScore: null, runningTotal: null };
}

function emptyPlayer(id: string, name: string, userId: string | null = null): Player {
return {
id,
name,
userId,
gameId: null,
frames: Array.from({ length: 10 }, emptyFrame),
currentFrame: 0,
ballInFrame: 1,
pinsStanding: [1,2,3,4,5,6,7,8,9,10],
done: false,
dbError: null,
};
}

function computeScores(frames: Frame[]): Frame[] {
const rolls: (number | null)[] = [];
for (let i = 0; i < 10; i++) {
const f = frames[i];
if (i < 9) {
rolls.push(f.r1);
if (f.r1 !== 10) {
rolls.push(f.r2);
if (f.r1 !== null && f.r2 !== null && f.r1 + f.r2 < 10) rolls.push(f.r3);
}
} else {
rolls.push(f.r1, f.r2, f.r3);
}
}

const result = frames.map(f => ({ …f }));
let rollIdx = 0;
let running = 0;

for (let i = 0; i < 10; i++) {
const f = result[i];
if (i < 9) {
if (f.r1 === 10) {
const b1 = rolls[rollIdx + 1] ?? null;
const b2 = rolls[rollIdx + 2] ?? null;
if (b1 !== null && b2 !== null) {
f.frameScore = 10 + b1 + b2;
running += f.frameScore;
f.runningTotal = running;
}
rollIdx += 1;
} else if (f.r1 !== null && f.r2 !== null && f.r1 + f.r2 === 10) {
const b1 = rolls[rollIdx + 2] ?? null;
if (b1 !== null) {
f.frameScore = 10 + b1;
running += f.frameScore;
f.runningTotal = running;
}
rollIdx += 2;
} else if (f.r1 !== null && f.r2 !== null && f.r3 !== null) {
if (f.r1 + f.r2 + f.r3 === 10) {
const b1 = rolls[rollIdx + 3] ?? null;
if (b1 !== null) {
f.frameScore = 10 + b1;
running += f.frameScore;
f.runningTotal = running;
}
rollIdx += 3;
} else {
f.frameScore = f.r1 + f.r2 + f.r3;
running += f.frameScore;
f.runningTotal = running;
rollIdx += 3;
}
} else { break; }
} else {
if (f.r1 !== null && f.r2 !== null && f.r3 !== null) {
f.frameScore = f.r1 + f.r2 + f.r3;
running += f.frameScore;
f.runningTotal = running;
}
}
}
return result;
}

// Returns { updated player, frameDone, completedFrameIndex (0-indexed) }
function applyRoll(player: Player, fallenCount: number): {
player: Player;
frameDone: boolean;
completedFrameIndex: number;
} {
const p: Player = {
…player,
frames: player.frames.map(f => ({ …f })),
pinsStanding: […player.pinsStanding],
};

const fi   = p.currentFrame;
const ball = p.ballInFrame;
const f    = p.frames[fi];
const is10th = fi === 9;

if (ball === 1) f.r1 = fallenCount;
else if (ball === 2) f.r2 = fallenCount;
else f.r3 = fallenCount;

const r1 = f.r1 ?? 0;
const r2 = f.r2 ?? 0;

let frameDone = false;

if (!is10th) {
if (ball === 1 && r1 === 10) {
f.mark = “strike”;
frameDone = true;
} else if (ball === 2 && r1 + r2 === 10) {
f.mark = “spare”;
frameDone = true;
} else if (ball === 3) {
f.mark = (r1 + r2 + (f.r3 ?? 0) === 10) ? “spare” : “open”;
frameDone = true;
} else {
p.pinsStanding = p.pinsStanding.slice(fallenCount);
}
} else {
if (ball === 1) {
if (r1 === 10) p.pinsStanding = [1,2,3,4,5,6,7,8,9,10];
} else if (ball === 2) {
const r2v = f.r2 ?? 0;
if (r1 === 10 && r2v === 10) p.pinsStanding = [1,2,3,4,5,6,7,8,9,10];
else if (r1 === 10) p.pinsStanding = p.pinsStanding.slice(r2v);
else if (r1 + r2v === 10) p.pinsStanding = [1,2,3,4,5,6,7,8,9,10];
} else {
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
}
} else {
p.ballInFrame = ball + 1;
}

return { player: p, frameDone, completedFrameIndex: fi };
}

// ── Ball display helper ───────────────────────────────────────
function ballDisplay(val: number | null, isFirst: boolean, r1: number | null): string {
if (val === null) return “”;
if (val === 10 && isFirst) return “X”;
if (!isFirst && r1 !== null && r1 + val === 10) return “/”;
if (val === 0) return “-”;
return String(val);
}

// ── Pin Diagram ───────────────────────────────────────────────
function PinDiagram({ standing, size = 56 }: { standing: number[]; size?: number }) {
const standingSet = new Set(standing);
return (
<div style={{ display: “inline-block” }}>
{PIN_ROWS.map((row, ri) => (
<div key={ri} style={{ display: “flex”, justifyContent: “center”, gap: size * 0.22, marginBottom: size * 0.1 }}>
{row.map(pin => {
const up = standingSet.has(pin);
return (
<div key={pin} style={{
width: size * 0.48, height: size * 0.48,
borderRadius: “50%”,
background: up ? ORANGE : “rgba(255,255,255,0.10)”,
border: `2px solid ${up ? "rgba(255,200,150,0.5)" : "rgba(255,255,255,0.06)"}`,
display: “grid”, placeItems: “center”,
fontSize: size * 0.16, fontWeight: 900,
color: up ? “#fff” : “rgba(255,255,255,0.2)”,
transition: “background 250ms, border 250ms”,
flexShrink: 0,
}}>
{pin}
</div>
);
})}
</div>
))}
</div>
);
}

// ── Scoreboard row ────────────────────────────────────────────
function BallCell({ val, isStrike = false, isSpare = false }: { val: string; isStrike?: boolean; isSpare?: boolean }) {
if (!val) return null;
return (
<span style={{
fontWeight: 900, fontSize: “.72rem”,
color: isStrike || isSpare ? ORANGE : TEXT,
minWidth: 12, textAlign: “center”,
}}>
{val}
</span>
);
}

function ScoreRow({ player, isActive }: { player: Player; isActive: boolean }) {
return (
<div style={{ marginBottom: “1rem” }}>
<div style={{ display: “flex”, alignItems: “center”, gap: “.5rem”, marginBottom: “.35rem” }}>
<div style={{
width: 28, height: 28, borderRadius: “50%”,
background: isActive ? ORANGE : “rgba(255,255,255,0.15)”,
display: “grid”, placeItems: “center”,
fontWeight: 900, fontSize: “.7rem”, color: “#fff”, flexShrink: 0,
}}>
{player.name.charAt(0).toUpperCase()}
</div>
<span style={{ fontWeight: 900, color: isActive ? ORANGE : TEXT, fontSize: “.92rem” }}>
{player.name}
</span>
{player.userId && (
<span style={{ fontSize: “.68rem”, color: “#4ade80”, marginLeft: “.25rem” }}>● logged in</span>
)}
{player.dbError && (
<span style={{ fontSize: “.68rem”, color: “#f87171”, marginLeft: “.25rem” }} title={player.dbError}>
⚠ sync error
</span>
)}
{player.done && (
<span style={{ marginLeft: “auto”, fontWeight: 900, color: ORANGE, fontSize: “1rem” }}>
{player.frames[9].runningTotal ?? “—”}
</span>
)}
</div>

```
  <div style={{ display: "flex", gap: 3 }}>
    {player.frames.map((f, fi) => {
      const isCurrentFrame = fi === player.currentFrame && !player.done;
      const is10th = fi === 9;
      const b1 = ballDisplay(f.r1, true, null);
      const b2 = ballDisplay(f.r2, false, f.r1);
      const b3 = is10th
        ? (f.r3 === 10 ? "X"
          : f.r3 !== null && f.r2 !== null && f.r3 + f.r2 === 10 ? "/"
          : f.r3 !== null ? String(f.r3) : "")
        : "";

      return (
        <div key={fi} style={{
          flex: is10th ? 1.4 : 1, minWidth: 0,
          border: `1px solid ${isCurrentFrame ? ORANGE : BORDER}`,
          borderRadius: 8,
          background: isCurrentFrame ? "rgba(228,106,46,0.12)" : PANEL,
          overflow: "hidden",
        }}>
          <div style={{
            display: "flex", justifyContent: "flex-end", gap: 2,
            padding: "3px 5px 2px",
            borderBottom: `1px solid ${BORDER}`, minHeight: 20,
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
          <div style={{
            textAlign: "center", fontWeight: 900, fontSize: ".85rem",
            padding: "4px 2px",
            color: f.runningTotal !== null ? TEXT : MUTED,
            minHeight: 24,
          }}>
            {f.runningTotal ?? (isCurrentFrame ? "·" : "")}
          </div>
          <div style={{
            textAlign: "center", fontSize: ".6rem", color: MUTED,
            paddingBottom: 3, letterSpacing: ".04em",
          }}>
            {fi + 1}
          </div>
        </div>
      );
    })}
  </div>
</div>
```

);
}

// ── Add Player Modal ──────────────────────────────────────────
function AddPlayerModal({ onAdd, onClose }: {
onAdd: (name: string, userId: string | null) => void;
onClose: () => void;
}) {
const [name, setName]     = useState(””);
const [email, setEmail]   = useState(””);
const [looking, setLooking] = useState(false);
const [found, setFound]   = useState<{ id: string; displayName: string } | null>(null);
const [lookupErr, setLookupErr] = useState(””);

async function lookupUser() {
if (!email.trim()) return;
setLooking(true);
setLookupErr(””);
setFound(null);
try {
const res = await fetch(`/api/auth/me`, { cache: “no-store” });
// We can’t look up arbitrary users by email from the client.
// Instead, for the simulator we just take name + optional userId from URL param.
// Real hardware flow: bowler scans QR → logs in → their userId is pushed to the lane via Realtime.
setLookupErr(“Use the QR code below to link a logged-in account to this lane.”);
} catch {
setLookupErr(“Lookup failed.”);
} finally {
setLooking(false);
}
}

function submit() {
const trimmed = name.trim();
if (!trimmed) return;
onAdd(trimmed, found?.id ?? null);
onClose();
}

return (
<div style={{
position: “fixed”, inset: 0, background: “rgba(0,0,0,0.65)”,
display: “grid”, placeItems: “center”, zIndex: 100,
}} onClick={onClose}>
<div onClick={e => e.stopPropagation()} style={{
background: “#1a1a1a”, border: `1px solid ${BORDER}`,
borderRadius: 16, padding: “1.5rem”,
width: “min(380px, 92vw)”,
fontFamily: “Montserrat, system-ui”,
}}>
<h3 style={{ margin: “0 0 1rem”, color: ORANGE }}>Add Bowler</h3>

```
    <label style={{ display: "block", fontSize: ".82rem", color: MUTED, marginBottom: ".3rem" }}>
      Display name
    </label>
    <input
      autoFocus
      value={name}
      onChange={e => setName(e.target.value)}
      onKeyDown={e => { if (e.key === "Enter") submit(); }}
      placeholder="e.g. Andrew B."
      style={{
        width: "100%", boxSizing: "border-box",
        padding: ".75rem", borderRadius: 10,
        border: `1px solid ${BORDER}`,
        background: "#111", color: TEXT,
        fontFamily: "Montserrat, system-ui", fontSize: "1rem",
      }}
    />

    <div style={{ marginTop: ".75rem", fontSize: ".78rem", color: MUTED, lineHeight: 1.6 }}>
      To link a Dux Bowling account, the bowler should scan the "Score Tracker QR" code on this screen
      after being added. Their game will be saved to their profile automatically.
    </div>

    <div style={{ display: "flex", gap: ".75rem", marginTop: "1rem" }}>
      <button
        onClick={submit}
        disabled={!name.trim()}
        style={{
          flex: 1, padding: ".8rem", borderRadius: 10,
          border: 0, background: ORANGE, color: "#fff",
          fontWeight: 900, cursor: name.trim() ? "pointer" : "default",
          opacity: name.trim() ? 1 : 0.5,
        }}
      >
        Add Bowler
      </button>
      <button onClick={onClose} style={{
        padding: ".8rem 1rem", borderRadius: 10,
        border: `1px solid ${BORDER}`, background: "transparent",
        color: TEXT, cursor: "pointer",
      }}>
        Cancel
      </button>
    </div>
  </div>
</div>
```

);
}

// ── Main page ─────────────────────────────────────────────────
export default function LaneScreenSimulatorPage() {
const [sessionId, setSessionId]     = useState(””);
const [players, setPlayers]         = useState<Player[]>([]);
const [activeIdx, setActiveIdx]     = useState(0);
const [lastRoll, setLastRoll]       = useState<{ count: number; speed?: number } | null>(null);
const [status, setStatus]           = useState(“Waiting for pinsetter to connect…”);
const [connected, setConnected]     = useState(false);
const [showAddPlayer, setShowAddPlayer] = useState(false);
const [laneNum, setLaneNum]         = useState(“4”);
const [locationName, setLocationName] = useState(“Walkersville Bowling Center”);
const [showReset, setShowReset]     = useState(false);
const [dbSyncEnabled, setDbSyncEnabled] = useState(true);

const channelRef   = useRef<RealtimeChannel | null>(null);
const playersRef   = useRef(players);
const activeIdxRef = useRef(activeIdx);
const laneNumRef   = useRef(laneNum);
const locationRef  = useRef(locationName);
const dbSyncRef    = useRef(dbSyncEnabled);

useEffect(() => { playersRef.current   = players; },      [players]);
useEffect(() => { activeIdxRef.current = activeIdx; },    [activeIdx]);
useEffect(() => { laneNumRef.current   = laneNum; },      [laneNum]);
useEffect(() => { locationRef.current  = locationName; }, [locationName]);
useEffect(() => { dbSyncRef.current    = dbSyncEnabled; }, [dbSyncEnabled]);

// Session ID from URL
useEffect(() => {
const params = new URLSearchParams(window.location.search);
setSessionId(params.get(“session”) || makeSessionId());
}, []);

// Realtime — stable connection for the life of the game
useEffect(() => {
if (!sessionId) return;
const supabase = getSupabaseClient();
if (!supabase) {
setStatus(“⚠ Supabase env vars missing — real-time unavailable.”);
return;
}

```
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
  // Bowler login via QR — phone sends userId to the lane
  .on("broadcast", { event: "bowler:checkin" }, ({ payload }: { payload: { userId: string; name: string; playerSlot?: number } }) => {
    const { userId, name, playerSlot } = payload;
    setPlayers(prev => {
      const updated = [...prev];
      const slot = playerSlot !== undefined && playerSlot < updated.length
        ? playerSlot
        : activeIdxRef.current;
      if (updated[slot]) {
        updated[slot] = { ...updated[slot], userId, name: name || updated[slot].name };
      }
      return updated;
    });
    setStatus(`${name} linked their account to lane ${laneNumRef.current}.`);
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
    const { player: updated, frameDone, completedFrameIndex } = applyRoll(player, fallenCount);

    const newPlayers = current.map((p, i) => (i === idx ? updated : p));
    setPlayers(newPlayers);
    playersRef.current = newPlayers;

    // Write completed frame to database
    if (frameDone && dbSyncRef.current) {
      const frameNum   = completedFrameIndex + 1; // 1-indexed
      const laneNumber = Number(laneNumRef.current) || null;
      const location   = locationRef.current;

      writFrameToDb(updated, frameNum, laneNumber, location).then(result => {
        if ("error" in result) {
          // Mark the player row with the error but don't block the game
          setPlayers(prev => prev.map((p, i) =>
            i === idx ? { ...p, dbError: result.error } : p
          ));
          setStatus(`⚠ DB sync failed: ${result.error}`);
        } else {
          // Store the game_id for subsequent frames
          const gameId = result.gameId;
          setPlayers(prev => prev.map((p, i) =>
            i === idx ? { ...p, gameId, dbError: null } : p
          ));
          // Also update the ref immediately so next frame uses correct game_id
          playersRef.current = playersRef.current.map((p, i) =>
            i === idx ? { ...p, gameId, dbError: null } : p
          );
        }
      });
    }

    // Advance to next player when frame is done
    if (frameDone) {
      const allDone = newPlayers.every(p => p.done);
      if (!allDone) {
        let nextIdx = (idx + 1) % newPlayers.length;
        while (newPlayers[nextIdx].done) nextIdx = (nextIdx + 1) % newPlayers.length;
        setActiveIdx(nextIdx);
        activeIdxRef.current = nextIdx;
      }

      const isStrike = updated.frames[completedFrameIndex].mark === "strike";
      setStatus(updated.done
        ? `🎳 ${player.name} finished — score: ${updated.frames[9].runningTotal ?? "?"}`
        : `${player.name}: ${isStrike ? "STRIKE! 🎳" : "frame done"} — ${newPlayers[activeIdxRef.current]?.name}'s turn`
      );
      channel.send({ type: "broadcast", event: "lane:reset-request", payload: {} });
    } else {
      const isStrike = fallenCount === 10;
      setStatus(`${player.name}: knocked down ${fallenCount} pin${fallenCount !== 1 ? "s" : ""}${isStrike ? " — STRIKE! 🎳" : ""}`);
    }
  })
  .subscribe(async () => {
    await channel.send({ type: "broadcast", event: "lane:hello", payload: { sessionId } });
  });

channelRef.current = channel;
return () => { channelRef.current = null; supabase.removeChannel(channel); };
```

}, [sessionId]);

function addPlayer(name: string, userId: string | null) {
setPlayers(prev => […prev, emptyPlayer(`player-${Date.now()}`, name, userId)]);
}

function resetGame() {
setPlayers(prev => prev.map(p => emptyPlayer(p.id, p.name, p.userId)));
setActiveIdx(0);
setLastRoll(null);
setStatus(“New game started. Ready to bowl.”);
channelRef.current?.send({ type: “broadcast”, event: “lane:reset-request”, payload: {} });
setShowReset(false);
}

const activePlayer = players[activeIdx] ?? null;
const allDone = players.length > 0 && players.every(p => p.done);

// QR for score tracker
const scoreTrackerQr = useMemo(() => {
if (typeof window === “undefined”) return “”;
const url = `${window.location.origin}/game`;
return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}`;
}, []);

return (
<main style={{
minHeight: “100vh”, background: BG,
fontFamily: “Montserrat, system-ui”, color: TEXT, padding: “1.25rem”,
}}>
{showAddPlayer && (
<AddPlayerModal onAdd={addPlayer} onClose={() => setShowAddPlayer(false)} />
)}

```
  <div style={{ maxWidth: 1100, margin: "0 auto" }}>

    {/* Header */}
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
      <Link href="/simulators" style={{ color: MUTED, fontSize: ".85rem", textDecoration: "none" }}>
        ← Simulators
      </Link>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 900, fontSize: "1.15rem" }}>
          Lane Screen
          <span style={{ marginLeft: ".6rem", fontSize: ".82rem", color: MUTED, fontWeight: 600 }}>
            Lane {laneNum} · {locationName}
          </span>
        </div>
        <div style={{ marginTop: ".2rem", display: "flex", alignItems: "center", gap: ".75rem", flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", fontSize: ".78rem", color: connected ? "#4ade80" : MUTED }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: connected ? "#4ade80" : "rgba(255,255,255,0.25)", display: "inline-block" }} />
            {connected ? "Pinsetter connected" : "Waiting for pinsetter…"}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", fontSize: ".78rem", color: dbSyncEnabled ? "#4ade80" : MUTED }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: dbSyncEnabled ? "#4ade80" : "rgba(255,255,255,0.25)", display: "inline-block" }} />
            {dbSyncEnabled ? "DB sync on" : "DB sync off (display only)"}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", gap: ".5rem" }}>
        <button onClick={() => setShowAddPlayer(true)} style={{
          padding: ".55rem .9rem", borderRadius: 10, border: 0,
          background: ORANGE, color: "#fff", fontWeight: 900, fontSize: ".82rem", cursor: "pointer",
        }}>
          + Bowler
        </button>
        {players.length > 0 && (
          <button onClick={() => setShowReset(true)} style={{
            padding: ".55rem .9rem", borderRadius: 10,
            border: `1px solid ${BORDER}`, background: "transparent",
            color: MUTED, fontSize: ".82rem", cursor: "pointer",
          }}>
            New Game
          </button>
        )}
      </div>
    </div>

    {/* Reset confirm */}
    {showReset && (
      <div style={{
        background: "rgba(228,106,46,0.10)", border: `1px solid ${ORANGE}`,
        borderRadius: 12, padding: "1rem", marginBottom: "1rem",
        display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
      }}>
        <span style={{ flex: 1, fontWeight: 700 }}>Reset and start a new game? Current scores will be lost.</span>
        <button onClick={resetGame} style={{ padding: ".55rem 1rem", borderRadius: 8, border: 0, background: ORANGE, color: "#fff", fontWeight: 900, cursor: "pointer" }}>Reset</button>
        <button onClick={() => setShowReset(false)} style={{ padding: ".55rem 1rem", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT, cursor: "pointer" }}>Cancel</button>
      </div>
    )}

    <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "1rem", alignItems: "start" }}>

      {/* Left: scoreboard */}
      <div>
        {/* Status */}
        <div style={{
          background: PANEL, border: `1px solid ${BORDER}`,
          borderRadius: 12, padding: ".7rem 1rem", marginBottom: "1rem",
          display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, fontWeight: 700, color: ORANGE, fontSize: ".9rem" }}>{status}</div>
          {lastRoll && (
            <div style={{ fontSize: ".82rem", color: MUTED }}>
              {lastRoll.count === 10 ? "🎳 STRIKE" : `${lastRoll.count} pins`}
              {lastRoll.speed ? ` · ${lastRoll.speed.toFixed(1)} mph` : ""}
            </div>
          )}
        </div>

        {/* Active player + pin diagram */}
        {activePlayer && !allDone && (
          <div style={{
            background: "rgba(228,106,46,0.08)", border: `1px solid rgba(228,106,46,0.28)`,
            borderRadius: 12, padding: ".75rem 1rem", marginBottom: "1rem",
            display: "flex", alignItems: "center", gap: "1rem",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: ORANGE, display: "grid", placeItems: "center",
              fontWeight: 900, color: "#fff", flexShrink: 0, fontSize: "1rem",
            }}>
              {activePlayer.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, color: ORANGE }}>{activePlayer.name}</div>
              <div style={{ fontSize: ".78rem", color: MUTED }}>
                Frame {activePlayer.currentFrame + 1} · Ball {activePlayer.ballInFrame}
                {activePlayer.gameId && (
                  <span style={{ marginLeft: ".5rem", color: "#4ade80" }}>· saved to DB</span>
                )}
              </div>
            </div>
            <PinDiagram standing={activePlayer.pinsStanding} size={76} />
          </div>
        )}

        {/* Game complete */}
        {allDone && (
          <div style={{
            background: "rgba(228,106,46,0.08)", border: `1px solid ${ORANGE}`,
            borderRadius: 12, padding: "1rem", marginBottom: "1rem", textAlign: "center",
          }}>
            <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.1rem", marginBottom: ".75rem" }}>
              🎳 Game Complete!
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap" }}>
              {[...players]
                .sort((a, b) => (b.frames[9].runningTotal ?? 0) - (a.frames[9].runningTotal ?? 0))
                .map((p, i) => (
                  <div key={p.id} style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 900, color: i === 0 ? ORANGE : TEXT }}>{p.name}</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: 900, color: i === 0 ? ORANGE : TEXT }}>
                      {p.frames[9].runningTotal ?? "—"}
                    </div>
                    {i === 0 && <div style={{ fontSize: ".75rem", color: MUTED }}>Winner 🏆</div>}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Scoreboard */}
        {players.length > 0 ? (
          <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "1rem" }}>
            <div style={{ fontWeight: 900, fontSize: ".75rem", color: MUTED, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: ".75rem" }}>
              Scoreboard
            </div>
            {players.map((p, i) => (
              <ScoreRow key={p.id} player={p} isActive={i === activeIdx && !allDone} />
            ))}
          </div>
        ) : (
          <div style={{
            background: PANEL, border: `1px solid ${BORDER}`,
            borderRadius: 14, padding: "2.5rem", textAlign: "center", color: MUTED,
          }}>
            <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>🎳</div>
            <div style={{ fontWeight: 700 }}>No bowlers yet</div>
            <div style={{ fontSize: ".85rem", marginTop: ".35rem" }}>Click "+ Bowler" to get started</div>
          </div>
        )}
      </div>

      {/* Right: controls */}
      <div style={{ display: "grid", gap: "1rem" }}>

        {/* Pinsetter link */}
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "1rem", textAlign: "center" }}>
          <div style={{ fontWeight: 900, fontSize: ".75rem", color: MUTED, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: ".6rem" }}>
            Pinsetter Simulator
          </div>
          <Link
            href={`/simulators/pinsetter?session=${encodeURIComponent(sessionId)}`}
            target="_blank"
            style={{
              display: "block", padding: ".7rem", borderRadius: 10,
              background: ORANGE, color: "#fff", fontWeight: 900,
              fontSize: ".85rem", textDecoration: "none",
            }}
          >
            Open Pinsetter →
          </Link>
          <div style={{ fontSize: ".72rem", color: MUTED, marginTop: ".5rem" }}>
            Opens in a new tab with the same session
          </div>
        </div>

        {/* Score tracker QR */}
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "1rem", textAlign: "center" }}>
          <div style={{ fontWeight: 900, fontSize: ".75rem", color: MUTED, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: ".6rem" }}>
            Score Tracker
          </div>
          {scoreTrackerQr && (
            <img src={scoreTrackerQr} alt="QR to score tracker" width={140} height={140}
              style={{ borderRadius: 8, background: "#fff", padding: 6 }} />
          )}
          <div style={{ fontSize: ".72rem", color: MUTED, marginTop: ".5rem" }}>
            Bowlers scan this to log scores on their own device
          </div>
        </div>

        {/* Lane settings */}
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "1rem" }}>
          <div style={{ fontWeight: 900, fontSize: ".75rem", color: MUTED, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: ".75rem" }}>
            Lane Settings
          </div>

          <label style={{ display: "block", fontSize: ".8rem", color: MUTED, marginBottom: ".25rem" }}>Lane #</label>
          <input value={laneNum} onChange={e => setLaneNum(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", padding: ".5rem .65rem", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#111", color: TEXT, fontFamily: "Montserrat, system-ui", fontSize: ".9rem", marginBottom: ".75rem" }} />

          <label style={{ display: "block", fontSize: ".8rem", color: MUTED, marginBottom: ".25rem" }}>Location</label>
          <select value={locationName} onChange={e => setLocationName(e.target.value)}
            style={{ width: "100%", padding: ".5rem .65rem", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#111", color: TEXT, fontFamily: "Montserrat, system-ui", fontSize: ".82rem", marginBottom: ".75rem" }}>
            <option>Walkersville Bowling Center</option>
            <option>Mount Airy Bowling Lanes</option>
            <option>Other</option>
          </select>

          <label style={{ display: "flex", alignItems: "center", gap: ".5rem", cursor: "pointer", fontSize: ".82rem", color: MUTED }}>
            <input type="checkbox" checked={dbSyncEnabled} onChange={e => setDbSyncEnabled(e.target.checked)}
              style={{ width: 16, height: 16 }} />
            Save frames to database
          </label>

          <div style={{ marginTop: ".75rem", fontSize: ".68rem", color: MUTED }}>
            Session: <span style={{ color: TEXT }}>{sessionId.slice(0, 14)}…</span>
          </div>
        </div>

      </div>
    </div>
  </div>
</main>
```

);
}