"use client";

export const dynamic = "force-dynamic";

const GameClient = dynamic(() => import("../components/GameClient"), { ssr: false });

export default function GameTestPage() {
  return <GameClient />;
}

import { useEffect, useMemo, useRef, useState } from "react";

type FrameState = {
  lane: number | null;
  r1: number | null;
  r2: number | null;
  r3: number | null;
};

const ORANGE = "#e46a2e";
const CREAM = "#f5f0e6";
const TEXT_ORANGE = "#c75a1d";

const LOCATIONS = ["Walkersville Bowling Center", "Mount Airy Bowling Lanes"] as const;
const GAME_TYPES = ["Scrimmage", "League", "Tournament"] as const;

function setCookie(name: string, value: string, days = 30) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}
function getCookie(name: string) {
  const key = encodeURIComponent(name) + "=";
  const parts = document.cookie.split(";").map(s => s.trim());
  for (const p of parts) {
    if (p.startsWith(key)) return decodeURIComponent(p.slice(key.length));
  }
  return null;
}
function deleteCookie(name: string) {
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function initFramesFromCookies(): FrameState[] {
  const frames: FrameState[] = [];
  for (let f = 1; f <= 10; f++) {
    const lane = getCookie(`frame${f}_lane`);
    const r1 = getCookie(`frame${f}_roll1`);
    const r2 = getCookie(`frame${f}_roll2`);
    const r3 = getCookie(`frame${f}_roll3`);
    frames.push({
      lane: lane ? Number(lane) : null,
      r1: r1 !== null ? Number(r1) : null,
      r2: r2 !== null ? Number(r2) : null,
      r3: r3 !== null ? Number(r3) : null
    });
  }
  return frames;
}

function clearAllGameCookies() {
  deleteCookie("game_id");
  deleteCookie("game_date");
  deleteCookie("game_location");
  deleteCookie("game_type");
  deleteCookie("game_number");

  for (let f = 1; f <= 10; f++) {
    deleteCookie(`frame${f}_lane`);
    deleteCookie(`frame${f}_roll1`);
    deleteCookie(`frame${f}_roll2`);
    deleteCookie(`frame${f}_roll3`);
  }
}

function resetFrameCookies(frameNumber: number) {
  deleteCookie(`frame${frameNumber}_lane`);
  deleteCookie(`frame${frameNumber}_roll1`);
  deleteCookie(`frame${frameNumber}_roll2`);
  deleteCookie(`frame${frameNumber}_roll3`);
}

function frameComplete(frame: FrameState, frameNumber: number) {
  const { r1, r2, r3 } = frame;
  if (frameNumber < 10) {
    if (r1 === null) return false;
    if (r1 === 10) return true; // strike ends frame (1–9)
    if (r2 === null) return false;
    if (r1 + r2 === 10) return true; // spare in 2
    return r3 !== null; // otherwise need 3rd roll
  }
  // 10th frame: always up to 3 rolls; completion requires all 3 entered
  return r1 !== null && r2 !== null && r3 !== null;
}

function firstIncompleteFrame(frames: FrameState[]) {
  for (let i = 0; i < 10; i++) {
    if (!frameComplete(frames[i], i + 1)) return i; // 0-based
  }
  return 9; // all complete → current is last
}

/**
 * Duckpin scoring per your rules:
 * - Strike bonus = next 2 rolls
 * - Spare bonus ONLY if 10 in 2 rolls (not if 10 in 3)
 * - 10th frame: no bonuses beyond frame, max 3 rolls
 */
function computeCumulative(frames: FrameState[]) {
  const cum: (number | null)[] = Array(10).fill(null);

  // Build "thrown rolls" stream and frame meta (how many rolls count for that frame)
  const rollStream: number[] = [];
  const frameRollCounts: number[] = [];

  for (let i = 0; i < 9; i++) {
    const f = frames[i];
    if (f.r1 === null) break;

    if (f.r1 === 10) {
      rollStream.push(10);
      frameRollCounts.push(1);
      continue;
    }

    if (f.r2 === null) break;

    const two = (f.r1 ?? 0) + (f.r2 ?? 0);
    if (two === 10) {
      // spare in 2
      rollStream.push(f.r1, f.r2);
      frameRollCounts.push(2);
      continue;
    }

    if (f.r3 === null) break;
    // open OR 10 in 3 (NO spare bonus)
    rollStream.push(f.r1, f.r2, f.r3);
    frameRollCounts.push(3);
  }

  // 10th frame rolls always counted (no bonus)
  const t = frames[9];
  if (t.r1 !== null && t.r2 !== null && t.r3 !== null) {
    rollStream.push(t.r1, t.r2, t.r3);
    // we’ll treat 10th as 3 for cumulative calc presence
  }

  let total = 0;
  let rollIndex = 0;

  for (let frame = 0; frame < 10; frame++) {
    const fnum = frame + 1;
    const f = frames[frame];

    if (!frameComplete(f, fnum)) break;

    if (fnum === 10) {
      total += (f.r1 ?? 0) + (f.r2 ?? 0) + (f.r3 ?? 0);
      cum[frame] = total;
      break;
    }

    // frames 1-9
    if (f.r1 === 10) {
      // strike: next 2 rolls from rollStream after this rollIndex
      const b1 = rollStream[rollIndex + 1] ?? 0;
      const b2 = rollStream[rollIndex + 2] ?? 0;
      total += 10 + b1 + b2;
      cum[frame] = total;
      rollIndex += 1;
      continue;
    }

    const two = (f.r1 ?? 0) + (f.r2 ?? 0);

    if (two === 10) {
      // spare in 2 only: next 1 roll bonus
      const bonus = rollStream[rollIndex + 2] ?? 0;
      total += 10 + bonus;
      cum[frame] = total;
      rollIndex += 2;
      continue;
    }

    // open OR 10-in-3 (NO spare bonus)
    total += (f.r1 ?? 0) + (f.r2 ?? 0) + (f.r3 ?? 0);
    cum[frame] = total;
    rollIndex += 3;
  }

  return cum;
}

function isStrike(frame: FrameState, frameNumber: number) {
  // strike recognition for display
  if (frame.r1 === 10) return true;
  return false;
}
function isSpareInTwo(frame: FrameState, frameNumber: number) {
  if (frame.r1 === null || frame.r2 === null) return false;
  return frame.r1 !== 10 && frame.r1 + frame.r2 === 10;
}

// 10th frame dropdown options per your rules
function optionsForRoll10th(r1: number | null, r2: number | null, roll: 1 | 2 | 3) {
  // Roll 1: 0-10
  if (roll === 1) return range(0, 10);

  if (r1 === null) return [];

  // If roll 2
  if (roll === 2) {
    if (r1 === 10) {
      // reset pins
      return range(0, 10);
    }
    // remaining
    return range(0, Math.max(0, 10 - r1));
  }

  // Roll 3
  if (r2 === null) return [];

  // If first was strike => second had its own rack
  if (r1 === 10) {
    // If second was strike => reset again
    if (r2 === 10) return range(0, 10);

    // second not strike => remaining from that rack
    return range(0, Math.max(0, 10 - r2));
  }

  // first not strike:
  const remainingAfter2 = Math.max(0, 10 - r1 - r2);

  // If cleared on second (spare-in-2), reset rack for third: 0-10
  if (r1 + r2 === 10) return range(0, 10);

  // Otherwise only remaining pins
  return range(0, remainingAfter2);
}

// frames 1-9 options (remaining pins, stop at strike/spare rules)
function optionsForRollStandard(r1: number | null, r2: number | null, roll: 1 | 2 | 3) {
  if (roll === 1) return range(0, 10);
  if (r1 === null) return [];
  if (roll === 2) {
    if (r1 === 10) return []; // strike ends (1-9)
    return range(0, Math.max(0, 10 - r1));
  }
  // roll 3
  if (r2 === null) return [];
  if (r1 === 10) return [];
  if (r1 + r2 === 10) return []; // spare-in-2 ends (1-9)
  return range(0, Math.max(0, 10 - r1 - r2));
}

function range(min: number, max: number) {
  const out: number[] = [];
  for (let i = min; i <= max; i++) out.push(i);
  return out;
}

export default function GameTestPage() {
  // game meta (cookie-backed)
  const [gameId, setGameId] = useState(() => {
    const existing = getCookie("game_id");
    if (existing) return existing;
    const id = crypto.randomUUID();
    setCookie("game_id", id);
    return id;
  });

  const [gameDate, setGameDate] = useState(() => getCookie("game_date") ?? todayISO());
  const [location, setLocation] = useState(() => getCookie("game_location") ?? LOCATIONS[0]);
  const [gameType, setGameType] = useState(() => getCookie("game_type") ?? GAME_TYPES[0]);
  const [gameNumber, setGameNumber] = useState(() => Number(getCookie("game_number") ?? "1"));

  // frames (cookie-backed)
  const [frames, setFrames] = useState<FrameState[]>(() => initFramesFromCookies());

  // UI state
  const [index, setIndex] = useState(() => {
    const fi = firstIncompleteFrame(initFramesFromCookies());
    return fi;
  });
  const [flipped, setFlipped] = useState(false);

  // arrow vertical alignment to card center
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [arrowTop, setArrowTop] = useState<number>(200);

  useEffect(() => {
    // persist meta cookies
    setCookie("game_date", gameDate);
    setCookie("game_location", location);
    setCookie("game_type", gameType);
    setCookie("game_number", String(gameNumber));
  }, [gameDate, location, gameType, gameNumber]);

  useEffect(() => {
    const update = () => {
      const el = cardRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setArrowTop(Math.max(80, r.top + r.height / 2));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const cumulative = useMemo(() => computeCumulative(frames), [frames]);

  const currentFrameNumber = index + 1;
  const currentFrame = frames[index];

  const isFirst = index === 0;
  const isLast = index === 9;

  const currentAllowedIndex = firstIncompleteFrame(frames);

  const canEditThisFrame = index <= currentAllowedIndex; // current or prior
  const isFutureFrame = index > currentAllowedIndex;

  function goPrev() {
    if (isFirst) return;
    setFlipped(false);
    setIndex(i => Math.max(0, i - 1));
  }
  function goNext() {
    if (isLast) return;
    setFlipped(false);
    setIndex(i => Math.min(9, i + 1));
  }

  function setFrameValue(frameIdx: number, patch: Partial<FrameState>) {
    setFrames(prev => {
      const copy = [...prev];
      copy[frameIdx] = { ...copy[frameIdx], ...patch };
      return copy;
    });

    // cookie updates
    const fnum = frameIdx + 1;
    if (patch.lane !== undefined) {
      if (patch.lane === null) deleteCookie(`frame${fnum}_lane`);
      else setCookie(`frame${fnum}_lane`, String(patch.lane));
    }
    if (patch.r1 !== undefined) {
      if (patch.r1 === null) deleteCookie(`frame${fnum}_roll1`);
      else setCookie(`frame${fnum}_roll1`, String(patch.r1));
    }
    if (patch.r2 !== undefined) {
      if (patch.r2 === null) deleteCookie(`frame${fnum}_roll2`);
      else setCookie(`frame${fnum}_roll2`, String(patch.r2));
    }
    if (patch.r3 !== undefined) {
      if (patch.r3 === null) deleteCookie(`frame${fnum}_roll3`);
      else setCookie(`frame${fnum}_roll3`, String(patch.r3));
    }
  }

  function startEditFrame() {
    // reset this frame completely (cookies + state) so they must re-enter r1->r2->r3
    resetFrameCookies(currentFrameNumber);
    setFrameValue(index, { lane: currentFrame.lane ?? null, r1: null, r2: null, r3: null });
  }

  function rollOptions(roll: 1 | 2 | 3) {
    const { r1, r2 } = currentFrame;
    if (currentFrameNumber === 10) return optionsForRoll10th(r1, r2, roll);
    return optionsForRollStandard(r1, r2, roll);
  }

  function rollEnabled(roll: 1 | 2 | 3) {
    if (!canEditThisFrame) return false;
    if (isFutureFrame) return false;

    const { r1, r2 } = currentFrame;

    if (roll === 1) return true;
    if (roll === 2) {
      if (r1 === null) return false;
      if (currentFrameNumber < 10 && r1 === 10) return false; // strike ends 1-9
      return true;
    }
    // roll 3
    if (r1 === null || r2 === null) return false;

    if (currentFrameNumber < 10) {
      if (r1 === 10) return false;
      if (r1 + r2 === 10) return false; // spare-in-2 ends 1-9
      return true;
    }
    // 10th always allows roll3 once roll2 exists
    return true;
  }

  function onRollChange(roll: 1 | 2 | 3, val: number | null) {
    if (roll === 1) {
      // changing roll1 resets roll2 & roll3
      setFrameValue(index, { r1: val, r2: null, r3: null });
      return;
    }
    if (roll === 2) {
      // changing roll2 resets roll3
      setFrameValue(index, { r2: val, r3: null });
      return;
    }
    setFrameValue(index, { r3: val });
  }

  function submitFrame() {
    // flip back to front
    setFlipped(false);

    // After submitting current frame, if it becomes complete and it was the current allowed frame, advance
    const updatedFrames = frames;
    const nowAllowed = firstIncompleteFrame(updatedFrames);

    if (index === nowAllowed && frameComplete(updatedFrames[index], currentFrameNumber) && index < 9) {
      setIndex(index + 1);
    }
  }

  const allComplete = useMemo(() => {
    for (let i = 0; i < 10; i++) {
      if (!frameComplete(frames[i], i + 1)) return false;
    }
    return true;
  }, [frames]);

  function newGame() {
    clearAllGameCookies();
    const id = crypto.randomUUID();
    setCookie("game_id", id);
    setGameId(id);

    setGameDate(todayISO());
    setLocation(LOCATIONS[0]);
    setGameType(GAME_TYPES[0]);
    setGameNumber(1);

    const empty: FrameState[] = Array.from({ length: 10 }, () => ({
      lane: null,
      r1: null,
      r2: null,
      r3: null
    }));
    setFrames(empty);
    setIndex(0);
    setFlipped(false);
  }

  function submitScore() {
    if (!allComplete) return;
    // For now just clear cookies and reset
    clearAllGameCookies();
    alert("Score submitted!");
    newGame();
  }

  // Display helpers for scorecard front
  const f = currentFrame;
  const strike = isStrike(f, currentFrameNumber);
  const spare2 = isSpareInTwo(f, currentFrameNumber);
  const cumScore = cumulative[index];

  // roll box strings
  const r1Text = strike ? "X" : f.r1 !== null ? String(f.r1) : "";
  const r2Text = spare2 ? "/" : f.r2 !== null ? String(f.r2) : "";
  const r3Text = f.r3 !== null ? String(f.r3) : "";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: CREAM,
        fontFamily: "Montserrat, system-ui",
        padding: "2rem 1rem 2.5rem",
        color: TEXT_ORANGE
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <img src="/1@300x.png" alt="Dux Bowling" style={{ maxWidth: 160, width: "100%" }} />
      </div>

      {/* Game meta inputs */}
      <section
        style={{
          maxWidth: 720,
          margin: "0 auto 1.25rem",
          background: "#fff",
          borderRadius: 14,
          padding: "1rem",
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)"
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
          <label style={{ display: "grid", gap: ".25rem", fontSize: ".9rem" }}>
            Date
            <input
              type="date"
              value={gameDate}
              max={todayISO()}
              onChange={(e) => setGameDate(e.target.value)}
              style={{ padding: ".6rem", borderRadius: 10, border: "1px solid #ddd" }}
            />
          </label>

          <label style={{ display: "grid", gap: ".25rem", fontSize: ".9rem" }}>
            Location
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ padding: ".6rem", borderRadius: 10, border: "1px solid #ddd" }}
            >
              {LOCATIONS.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: ".25rem", fontSize: ".9rem" }}>
            Game Type
            <select
              value={gameType}
              onChange={(e) => setGameType(e.target.value)}
              style={{ padding: ".6rem", borderRadius: 10, border: "1px solid #ddd" }}
            >
              {GAME_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: ".25rem", fontSize: ".9rem" }}>
            Game Number
            <select
              value={gameNumber}
              onChange={(e) => setGameNumber(Number(e.target.value))}
              style={{ padding: ".6rem", borderRadius: 10, border: "1px solid #ddd" }}
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Fixed arrows (left/right anchored like menu/login), vertically aligned to card */}
      <button
        onClick={goPrev}
        disabled={isFirst}
        aria-label="Previous frame"
        style={{
          position: "fixed",
          left: 16,
          top: arrowTop,
          transform: "translateY(-50%)",
          width: 46,
          height: 46,
          borderRadius: "50%",
          border: "none",
          background: ORANGE,
          color: "#fff",
          fontSize: "1.4rem",
          opacity: isFirst ? 0.5 : 1,
          cursor: isFirst ? "default" : "pointer",
          zIndex: 50
        }}
      >
        ‹
      </button>

      <button
        onClick={goNext}
        disabled={isLast}
        aria-label="Next frame"
        style={{
          position: "fixed",
          right: 16,
          top: arrowTop,
          transform: "translateY(-50%)",
          width: 46,
          height: 46,
          borderRadius: "50%",
          border: "none",
          background: ORANGE,
          color: "#fff",
          fontSize: "1.4rem",
          opacity: isLast ? 0.5 : 1,
          cursor: isLast ? "default" : "pointer",
          zIndex: 50
        }}
      >
        ›
      </button>

      {/* Card */}
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          display: "flex",
          justifyContent: "center"
        }}
      >
        <div
          ref={cardRef}
          onClick={() => setFlipped(v => !v)}
          style={{
            width: "min(520px, 92vw)",
            height: 280,
            perspective: 1100,
            cursor: isFutureFrame ? "not-allowed" : "pointer",
            opacity: isFutureFrame ? 0.6 : 1
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              transformStyle: "preserve-3d",
              transition: "transform 0.6s",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)"
            }}
          >
            {/* FRONT: classic-ish score sheet look */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#fff",
                borderRadius: 14,
                padding: "1rem",
                backfaceVisibility: "hidden",
                boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                display: "grid",
                gridTemplateRows: "auto 1fr auto",
                gap: ".75rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700, color: ORANGE }}>
                  Frame {currentFrameNumber}
                </div>
                <div style={{ fontSize: ".9rem", color: "#7a5a45" }}>
                  Game ID: {gameId.slice(0, 8)}
                </div>
              </div>

              {/* Score box */}
              <div
                style={{
                  border: `2px solid ${ORANGE}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  display: "grid",
                  gridTemplateRows: "72px 1fr"
                }}
              >
                {/* top row roll boxes (3 for duckpin) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `2px solid ${ORANGE}` }}>
                  {/* Roll 1 */}
                  <div
                    style={{
                      position: "relative",
                      borderRight: `2px solid ${ORANGE}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.3rem",
                      fontWeight: 800,
                      background: strike ? ORANGE : "transparent",
                      color: strike ? "#fff" : ORANGE
                    }}
                  >
                    {r1Text}
                  </div>

                  {/* Roll 2 */}
                  <div
                    style={{
                      position: "relative",
                      borderRight: `2px solid ${ORANGE}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.3rem",
                      fontWeight: 800,
                      color: ORANGE
                    }}
                  >
                    {/* spare triangle */}
                    {spare2 && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: `linear-gradient(135deg, transparent 50%, rgba(228,106,46,0.35) 50%)`
                        }}
                      />
                    )}
                    <span style={{ position: "relative" }}>{r2Text}</span>
                  </div>

                  {/* Roll 3 */}
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.3rem",
                      fontWeight: 800,
                      color: ORANGE
                    }}
                  >
                    {r3Text}
                  </div>
                </div>

                {/* bottom row cumulative */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: "2.1rem", fontWeight: 900, color: ORANGE }}>
                    {cumScore ?? "—"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".9rem", color: "#7a5a45" }}>
                <div>
                  Lane: <strong>{currentFrame.lane ?? "—"}</strong>
                </div>
                <div>
                  Tap to {flipped ? "view frame" : "enter/edit"}
                </div>
              </div>
            </div>

            {/* BACK: compact entry */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: ORANGE,
                color: "#fff",
                borderRadius: 14,
                padding: "1rem",
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                display: "grid",
                gridTemplateRows: "auto 1fr auto",
                gap: ".75rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 800 }}>Frame {currentFrameNumber}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canEditThisFrame || isFutureFrame) return;
                    startEditFrame();
                  }}
                  disabled={!canEditThisFrame || isFutureFrame}
                  style={{
                    border: "none",
                    borderRadius: 999,
                    padding: ".45rem .8rem",
                    background: "rgba(255,255,255,0.22)",
                    color: "#fff",
                    fontWeight: 700,
                    opacity: (!canEditThisFrame || isFutureFrame) ? 0.5 : 1,
                    cursor: (!canEditThisFrame || isFutureFrame) ? "default" : "pointer"
                  }}
                >
                  Reset frame
                </button>
              </div>

              <div style={{ display: "grid", gap: ".7rem" }}>
                {/* Lane */}
                <label style={{ display: "grid", gap: ".25rem", fontSize: ".9rem" }}>
                  Lane (optional)
                  <select
                    value={currentFrame.lane ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setFrameValue(index, { lane: val });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ padding: ".6rem", borderRadius: 10, border: "none" }}
                  >
                    <option value="">—</option>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </label>

                {/* Rolls */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: ".6rem" }}>
                  <label style={{ display: "grid", gap: ".25rem", fontSize: ".85rem" }}>
                    Roll 1
                    <select
                      value={currentFrame.r1 ?? ""}
                      disabled={!rollEnabled(1)}
                      onChange={(e) => onRollChange(1, e.target.value === "" ? null : Number(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      style={{ padding: ".55rem", borderRadius: 10, border: "none", opacity: rollEnabled(1) ? 1 : 0.6 }}
                    >
                      <option value="">—</option>
                      {rollOptions(1).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </label>

                  <label style={{ display: "grid", gap: ".25rem", fontSize: ".85rem" }}>
                    Roll 2
                    <select
                      value={currentFrame.r2 ?? ""}
                      disabled={!rollEnabled(2)}
                      onChange={(e) => onRollChange(2, e.target.value === "" ? null : Number(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      style={{ padding: ".55rem", borderRadius: 10, border: "none", opacity: rollEnabled(2) ? 1 : 0.6 }}
                    >
                      <option value="">—</option>
                      {rollOptions(2).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </label>

                  <label style={{ display: "grid", gap: ".25rem", fontSize: ".85rem" }}>
                    Roll 3
                    <select
                      value={currentFrame.r3 ?? ""}
                      disabled={!rollEnabled(3)}
                      onChange={(e) => onRollChange(3, e.target.value === "" ? null : Number(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      style={{ padding: ".55rem", borderRadius: 10, border: "none", opacity: rollEnabled(3) ? 1 : 0.6 }}
                    >
                      <option value="">—</option>
                      {rollOptions(3).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </label>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  submitFrame();
                }}
                disabled={!frameComplete(currentFrame, currentFrameNumber) || isFutureFrame}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: 12,
                  padding: ".85rem",
                  fontWeight: 900,
                  background: "#fff",
                  color: ORANGE,
                  opacity: (!frameComplete(currentFrame, currentFrameNumber) || isFutureFrame) ? 0.6 : 1,
                  cursor: (!frameComplete(currentFrame, currentFrameNumber) || isFutureFrame) ? "default" : "pointer"
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{ maxWidth: 720, margin: "1.25rem auto 0", display: "grid", gap: ".75rem" }}>
        <button
          onClick={submitScore}
          disabled={!allComplete}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 14,
            padding: "1rem",
            fontWeight: 900,
            background: ORANGE,
            color: "#fff",
            opacity: allComplete ? 1 : 0.6,
            cursor: allComplete ? "pointer" : "default"
          }}
        >
          Submit Score
        </button>

        <button
          onClick={newGame}
          style={{
            width: "100%",
            border: `2px solid ${ORANGE}`,
            borderRadius: 14,
            padding: "1rem",
            fontWeight: 900,
            background: "#fff",
            color: ORANGE
          }}
        >
          New Game
        </button>
      </div>
    </main>
  );
}