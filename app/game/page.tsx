"use client";

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

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function safeUUID() {
  // Works in modern browsers; fallback for older environments
  const g: any = globalThis as any;
  if (g?.crypto?.randomUUID) return g.crypto.randomUUID();
  return `game_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function setCookie(name: string, value: string, days = 30) {
  if (!isBrowser()) return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string) {
  if (!isBrowser()) return null;
  const key = encodeURIComponent(name) + "=";
  const parts = document.cookie.split(";").map((s) => s.trim());
  for (const p of parts) {
    if (p.startsWith(key)) return decodeURIComponent(p.slice(key.length));
  }
  return null;
}

function deleteCookie(name: string) {
  if (!isBrowser()) return;
  document.cookie = `${encodeURIComponent(
    name
  )}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function emptyFrames(): FrameState[] {
  return Array.from({ length: 10 }, () => ({
    lane: null,
    r1: null,
    r2: null,
    r3: null
  }));
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
    if (r1 === 10) return true; // strike ends frame 1–9
    if (r2 === null) return false;
    if (r1 + r2 === 10) return true; // spare-in-2 ends frame 1–9
    return r3 !== null; // otherwise needs third
  }

  // 10th frame: always exactly 3 rolls entered (per your rules, no extra rolls)
  return r1 !== null && r2 !== null && r3 !== null;
}

function firstIncompleteFrame(frames: FrameState[]) {
  for (let i = 0; i < 10; i++) {
    if (!frameComplete(frames[i], i + 1)) return i;
  }
  return 9;
}

/**
 * Duckpin scoring per your rules:
 * - Strike bonus = next 2 rolls
 * - Spare bonus ONLY if 10 in 2 rolls (not if 10 in 3)
 * - 10th frame: no bonuses beyond frame, max 3 rolls
 */
function computeCumulative(frames: FrameState[]) {
  const cum: (number | null)[] = Array(10).fill(null);

  // Build the chronological roll stream for frames 1-9 (as thrown),
  // plus the 10th if complete (no bonus beyond).
  const rollStream: number[] = [];

  // frames 1-9
  for (let i = 0; i < 9; i++) {
    const f = frames[i];
    if (f.r1 === null) break;

    if (f.r1 === 10) {
      rollStream.push(10);
      continue;
    }

    if (f.r2 === null) break;
    rollStream.push(f.r1, f.r2);

    // if spare-in-2 ends frame, do not require r3
    if (f.r1 + f.r2 === 10) continue;

    if (f.r3 === null) break;
    rollStream.push(f.r3);
  }

  // 10th frame: include only if complete
  const t = frames[9];
  const tenthComplete = t.r1 !== null && t.r2 !== null && t.r3 !== null;
  if (tenthComplete) {
    rollStream.push(t.r1!, t.r2!, t.r3!);
  }

  let total = 0;
  let rollIndex = 0;

  for (let frame = 0; frame < 10; frame++) {
    const fnum = frame + 1;
    const f = frames[frame];

    if (!frameComplete(f, fnum)) break;

    // 10th frame: no bonuses beyond, just sum 3
    if (fnum === 10) {
      total += (f.r1 ?? 0) + (f.r2 ?? 0) + (f.r3 ?? 0);
      cum[frame] = total;
      break;
    }

    // frames 1-9 scoring using rollStream for bonus rolls
    if (f.r1 === 10) {
      const b1 = rollStream[rollIndex + 1] ?? 0;
      const b2 = rollStream[rollIndex + 2] ?? 0;
      total += 10 + b1 + b2;
      cum[frame] = total;
      rollIndex += 1;
      continue;
    }

    const two = (f.r1 ?? 0) + (f.r2 ?? 0);

    // Spare only if 10 in 2 (NOT 3)
    if (two === 10) {
      const bonus = rollStream[rollIndex + 2] ?? 0;
      total += 10 + bonus;
      cum[frame] = total;
      rollIndex += 2;
      continue;
    }

    // Open OR 10-in-3 (NO spare bonus)
    total += (f.r1 ?? 0) + (f.r2 ?? 0) + (f.r3 ?? 0);
    cum[frame] = total;
    rollIndex += 3;
  }

  return cum;
}

function isStrike(frame: FrameState) {
  return frame.r1 === 10;
}

function isSpareInTwo(frame: FrameState) {
  if (frame.r1 === null || frame.r2 === null) return false;
  return frame.r1 !== 10 && frame.r1 + frame.r2 === 10;
}

function range(min: number, max: number) {
  const out: number[] = [];
  for (let i = min; i <= max; i++) out.push(i);
  return out;
}

// 10th frame dropdown options per your rules
function optionsForRoll10th(r1: number | null, r2: number | null, roll: 1 | 2 | 3) {
  if (roll === 1) return range(0, 10);
  if (r1 === null) return [];

  if (roll === 2) {
    if (r1 === 10) return range(0, 10); // reset rack after strike
    return range(0, Math.max(0, 10 - r1)); // remaining pins
  }

  // roll 3:
  if (r2 === null) return [];

  // if first was strike => second is its own rack
  if (r1 === 10) {
    if (r2 === 10) return range(0, 10); // reset again
    return range(0, Math.max(0, 10 - r2)); // remaining from second rack
  }

  // first not strike:
  // if spare in 2, reset rack for roll 3
  if (r1 + r2 === 10) return range(0, 10);

  // otherwise only remaining pins
  return range(0, Math.max(0, 10 - r1 - r2));
}

// frames 1-9 options
function optionsForRollStandard(r1: number | null, r2: number | null, roll: 1 | 2 | 3) {
  if (roll === 1) return range(0, 10);
  if (r1 === null) return [];

  if (roll === 2) {
    if (r1 === 10) return []; // strike ends 1-9
    return range(0, Math.max(0, 10 - r1));
  }

  // roll 3:
  if (r2 === null) return [];
  if (r1 === 10) return [];
  if (r1 + r2 === 10) return []; // spare-in-2 ends 1-9
  return range(0, Math.max(0, 10 - r1 - r2));
}

export default function GamePage() {
  // Keep initial render server-safe: do NOT read cookies here.
  const [mounted, setMounted] = useState(false);

  // meta
  const [gameId, setGameId] = useState<string>("");
  const [gameDate, setGameDate] = useState<string>(todayISO());
  const [location, setLocation] = useState<string>(LOCATIONS[0]);
  const [gameType, setGameType] = useState<string>(GAME_TYPES[0]);
  const [gameNumber, setGameNumber] = useState<number>(1);

  // frames
  const [frames, setFrames] = useState<FrameState[]>(emptyFrames());

  // UI
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // arrows aligned to card center
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [arrowTop, setArrowTop] = useState<number>(200);

  // Hydrate from cookies on client only
  useEffect(() => {
    setMounted(true);

    // game id
    const existingId = getCookie("game_id");
    const id = existingId ?? safeUUID();
    setGameId(id);
    setCookie("game_id", id);

    // meta cookies
    const cDate = getCookie("game_date") ?? todayISO();
    const cLoc = getCookie("game_location") ?? LOCATIONS[0];
    const cType = getCookie("game_type") ?? GAME_TYPES[0];
    const cNum = Number(getCookie("game_number") ?? "1");

    setGameDate(cDate);
    setLocation(cLoc);
    setGameType(cType);
    setGameNumber(Number.isFinite(cNum) ? cNum : 1);

    // frames
    const loadedFrames = initFramesFromCookies();
    setFrames(loadedFrames);

    // start on first incomplete
    setIndex(firstIncompleteFrame(loadedFrames));
  }, []);

  // Persist meta cookies when changed (client only)
  useEffect(() => {
    if (!mounted) return;
    setCookie("game_date", gameDate);
    setCookie("game_location", location);
    setCookie("game_type", gameType);
    setCookie("game_number", String(gameNumber));
  }, [mounted, gameDate, location, gameType, gameNumber]);

  // Arrow vertical alignment
  useEffect(() => {
    if (!mounted) return;

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
  }, [mounted]);

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
    setIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    if (isLast) return;
    setFlipped(false);
    setIndex((i) => Math.min(9, i + 1));
  }

  function setFrameValue(frameIdx: number, patch: Partial<FrameState>) {
    setFrames((prev) => {
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
    // reset ALL cookies for this frame (lane + rolls) and force re-entry from roll 1
    resetFrameCookies(currentFrameNumber);
    setFrameValue(index, { lane: null, r1: null, r2: null, r3: null });
  }

  function rollOptions(roll: 1 | 2 | 3) {
    const { r1, r2 } = currentFrame;
    if (currentFrameNumber === 10) return optionsForRoll10th(r1, r2, roll);
    return optionsForRollStandard(r1, r2, roll);
  }

  function rollEnabled(roll: 1 | 2 | 3) {
    if (!canEditThisFrame || isFutureFrame) return false;

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

    // 10th: roll3 allowed once roll2 exists (options may be limited)
    return true;
  }

  function onRollChange(roll: 1 | 2 | 3, val: number | null) {
    if (roll === 1) {
      setFrameValue(index, { r1: val, r2: null, r3: null });
      return;
    }
    if (roll === 2) {
      setFrameValue(index, { r2: val, r3: null });
      return;
    }
    setFrameValue(index, { r3: val });
  }

  function submitFrameConfirm() {
    setFlipped(false);

    // If this is the current incomplete frame and it’s now complete, advance to next frame
    const nowAllowed = firstIncompleteFrame(frames);
    if (index === nowAllowed && frameComplete(frames[index], currentFrameNumber) && index < 9) {
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

    const id = safeUUID();
    setGameId(id);
    setCookie("game_id", id);

    setGameDate(todayISO());
    setLocation(LOCATIONS[0]);
    setGameType(GAME_TYPES[0]);
    setGameNumber(1);

    setFrames(emptyFrames());
    setIndex(0);
    setFlipped(false);
  }

  function submitScore() {
    if (!allComplete) return;
    // For now: just clear + reset
    clearAllGameCookies();
    alert("Score submitted!");
    newGame();
  }

  // Scorecard front display
  const strike = isStrike(currentFrame);
  const spare2 = isSpareInTwo(currentFrame);
  const cumScore = cumulative[index];

  const r1Text = strike ? "X" : currentFrame.r1 !== null ? String(currentFrame.r1) : "";
  const r2Text = spare2 ? "/" : currentFrame.r2 !== null ? String(currentFrame.r2) : "";
  const r3Text = currentFrame.r3 !== null ? String(currentFrame.r3) : "";

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
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
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
              {GAME_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
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
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Arrows (fixed left/right like menu/login), vertically aligned to card */}
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
          onClick={() => {
            if (isFutureFrame) return;
            setFlipped((v) => !v);
          }}
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
            {/* FRONT */}
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
                <div style={{ fontWeight: 700, color: ORANGE }}>Frame {currentFrameNumber}</div>
                <div style={{ fontSize: ".9rem", color: "#7a5a45" }}>
                  Game ID: {gameId ? gameId.slice(0, 8) : "—"}
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
                {/* top row roll boxes */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    borderBottom: `2px solid ${ORANGE}`
                  }}
                >
                  {/* Roll 1 */}
                  <div
                    style={{
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
                <div>Tap to enter/edit</div>
              </div>
            </div>

            {/* BACK */}
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
                    opacity: !canEditThisFrame || isFutureFrame ? 0.5 : 1,
                    cursor: !canEditThisFrame || isFutureFrame ? "default" : "pointer"
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
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
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
                      style={{
                        padding: ".55rem",
                        borderRadius: 10,
                        border: "none",
                        opacity: rollEnabled(1) ? 1 : 0.6
                      }}
                    >
                      <option value="">—</option>
                      {rollOptions(1).map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: "grid", gap: ".25rem", fontSize: ".85rem" }}>
                    Roll 2
                    <select
                      value={currentFrame.r2 ?? ""}
                      disabled={!rollEnabled(2)}
                      onChange={(e) => onRollChange(2, e.target.value === "" ? null : Number(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: ".55rem",
                        borderRadius: 10,
                        border: "none",
                        opacity: rollEnabled(2) ? 1 : 0.6
                      }}
                    >
                      <option value="">—</option>
                      {rollOptions(2).map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: "grid", gap: ".25rem", fontSize: ".85rem" }}>
                    Roll 3
                    <select
                      value={currentFrame.r3 ?? ""}
                      disabled={!rollEnabled(3)}
                      onChange={(e) => onRollChange(3, e.target.value === "" ? null : Number(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: ".55rem",
                        borderRadius: 10,
                        border: "none",
                        opacity: rollEnabled(3) ? 1 : 0.6
                      }}
                    >
                      <option value="">—</option>
                      {rollOptions(3).map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  submitFrameConfirm();
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
                  opacity: !frameComplete(currentFrame, currentFrameNumber) || isFutureFrame ? 0.6 : 1,
                  cursor: !frameComplete(currentFrame, currentFrameNumber) || isFutureFrame ? "default" : "pointer"
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