"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ChopSplit = "Chop" | "Split" | null;

type FrameState = {
  lane: number | null;
  r1: number | null;
  r2: number | null;
  r3: number | null;
  r1_cs: ChopSplit;
  r2_cs: ChopSplit;
  r3_cs: ChopSplit;
};

const ORANGE = "#e46a2e";
const BG = "#121212";
const PANEL = "rgba(26,26,26,0.88)";
const BORDER = "rgba(255,255,255,0.10)";
const TEXT = "#f2f2f2";
const MUTED = "rgba(242,242,242,0.75)";

const LOCATIONS = ["Walkersville Bowling Center", "Mount Airy Bowling Lanes"] as const;
const GAME_TYPES = ["Scrimmage", "League", "Tournament"] as const;

function isBrowser() {
  return typeof document !== "undefined";
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
    r3: null,
    r1_cs: null,
    r2_cs: null,
    r3_cs: null
  }));
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

    deleteCookie(`frame${f}_roll_1_chop_split`);
    deleteCookie(`frame${f}_roll_2_chop_split`);
    deleteCookie(`frame${f}_roll_3_chop_split`);
  }
}

function resetFrameCookies(frameNumber: number) {
  deleteCookie(`frame${frameNumber}_lane`);
  deleteCookie(`frame${frameNumber}_roll1`);
  deleteCookie(`frame${frameNumber}_roll2`);
  deleteCookie(`frame${frameNumber}_roll3`);

  deleteCookie(`frame${frameNumber}_roll_1_chop_split`);
  deleteCookie(`frame${frameNumber}_roll_2_chop_split`);
  deleteCookie(`frame${frameNumber}_roll_3_chop_split`);
}

function frameComplete(frame: FrameState, frameNumber: number) {
  const { r1, r2, r3 } = frame;
  if (frameNumber < 10) {
    if (r1 === null) return false;
    if (r1 === 10) return true;
    if (r2 === null) return false;
    if (r1 + r2 === 10) return true;
    return r3 !== null;
  }
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
  const rollStream: number[] = [];

  for (let i = 0; i < 9; i++) {
    const f = frames[i];
    if (f.r1 === null) break;

    if (f.r1 === 10) {
      rollStream.push(10);
      continue;
    }

    if (f.r2 === null) break;

    const two = (f.r1 ?? 0) + (f.r2 ?? 0);
    if (two === 10) {
      rollStream.push(f.r1, f.r2);
      continue;
    }

    if (f.r3 === null) break;
    rollStream.push(f.r1, f.r2, f.r3);
  }

  const t = frames[9];
  if (t.r1 !== null && t.r2 !== null && t.r3 !== null) {
    rollStream.push(t.r1, t.r2, t.r3);
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

    if (f.r1 === 10) {
      const b1 = rollStream[rollIndex + 1] ?? 0;
      const b2 = rollStream[rollIndex + 2] ?? 0;
      total += 10 + b1 + b2;
      cum[frame] = total;
      rollIndex += 1;
      continue;
    }

    const two = (f.r1 ?? 0) + (f.r2 ?? 0);

    if (two === 10) {
      const bonus = rollStream[rollIndex + 2] ?? 0;
      total += 10 + bonus;
      cum[frame] = total;
      rollIndex += 2;
      continue;
    }

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

function optionsForRoll10th(r1: number | null, r2: number | null, roll: 1 | 2 | 3) {
  if (roll === 1) return range(0, 10);
  if (r1 === null) return [];

  if (roll === 2) {
    if (r1 === 10) return range(0, 10);
    return range(0, Math.max(0, 10 - r1));
  }

  if (r2 === null) return [];

  if (r1 === 10) {
    if (r2 === 10) return range(0, 10);
    return range(0, Math.max(0, 10 - r2));
  }

  const remainingAfter2 = Math.max(0, 10 - r1 - r2);
  if (r1 + r2 === 10) return range(0, 10);
  return range(0, remainingAfter2);
}

function optionsForRollStandard(r1: number | null, r2: number | null, roll: 1 | 2 | 3) {
  if (roll === 1) return range(0, 10);
  if (r1 === null) return [];
  if (roll === 2) {
    if (r1 === 10) return [];
    return range(0, Math.max(0, 10 - r1));
  }
  if (r2 === null) return [];
  if (r1 === 10) return [];
  if (r1 + r2 === 10) return [];
  return range(0, Math.max(0, 10 - r1 - r2));
}

function csKey(frameNum: number, roll: 1 | 2 | 3) {
  return `frame${frameNum}_roll_${roll}_chop_split`;
}

export default function GamePage() {
  const [mounted, setMounted] = useState(false);

  const [gameId, setGameId] = useState<string>("");
  const [gameDate, setGameDate] = useState<string>(todayISO());
  const [location, setLocation] = useState<string>(LOCATIONS[0]);
  const [gameType, setGameType] = useState<string>(GAME_TYPES[0]);
  const [gameNumber, setGameNumber] = useState<number>(1);

  const [frames, setFrames] = useState<FrameState[]>(() => emptyFrames());
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const [arrowTop, setArrowTop] = useState<number>(200);

  // Load cookies on mount
  useEffect(() => {
    setMounted(true);

    const existingId = getCookie("game_id");
    const id = existingId || (typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now()));
    setCookie("game_id", id);
    setGameId(id);

    const gd = getCookie("game_date") ?? todayISO();
    const gl = getCookie("game_location") ?? LOCATIONS[0];
    const gt = getCookie("game_type") ?? GAME_TYPES[0];
    const gn = Number(getCookie("game_number") ?? "1");

    setGameDate(gd);
    setLocation(gl);
    setGameType(gt);
    setGameNumber(gn);

    const loaded = emptyFrames();
    for (let f = 1; f <= 10; f++) {
      const lane = getCookie(`frame${f}_lane`);
      const r1 = getCookie(`frame${f}_roll1`);
      const r2 = getCookie(`frame${f}_roll2`);
      const r3 = getCookie(`frame${f}_roll3`);

      const r1cs = getCookie(csKey(f, 1));
      const r2cs = getCookie(csKey(f, 2));
      const r3cs = getCookie(csKey(f, 3));

      loaded[f - 1] = {
        lane: lane ? Number(lane) : null,
        r1: r1 !== null ? Number(r1) : null,
        r2: r2 !== null ? Number(r2) : null,
        r3: r3 !== null ? Number(r3) : null,
        r1_cs: r1cs === "Chop" || r1cs === "Split" ? (r1cs as ChopSplit) : null,
        r2_cs: r2cs === "Chop" || r2cs === "Split" ? (r2cs as ChopSplit) : null,
        r3_cs: r3cs === "Chop" || r3cs === "Split" ? (r3cs as ChopSplit) : null
      };
    }

    setFrames(loaded);
    setIndex(firstIncompleteFrame(loaded));
  }, []);

  // Persist meta cookies
  useEffect(() => {
    if (!mounted) return;
    setCookie("game_date", gameDate);
    setCookie("game_location", location);
    setCookie("game_type", gameType);
    setCookie("game_number", String(gameNumber));
  }, [mounted, gameDate, location, gameType, gameNumber]);

  // Arrow vertical alignment to card center
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
    const t = window.setTimeout(update, 30);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.clearTimeout(t);
    };
  }, [mounted]);

  const cumulative = useMemo(() => computeCumulative(frames), [frames]);

  const currentFrameNumber = index + 1;
  const currentFrame = frames[index];

  const isFirst = index === 0;
  const isLast = index === 9;

  const currentAllowedIndex = firstIncompleteFrame(frames);
  const canEditThisFrame = index <= currentAllowedIndex;
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

    if (!mounted) return;

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

    if (patch.r1_cs !== undefined) {
      if (patch.r1_cs === null) deleteCookie(csKey(fnum, 1));
      else setCookie(csKey(fnum, 1), patch.r1_cs);
    }
    if (patch.r2_cs !== undefined) {
      if (patch.r2_cs === null) deleteCookie(csKey(fnum, 2));
      else setCookie(csKey(fnum, 2), patch.r2_cs);
    }
    if (patch.r3_cs !== undefined) {
      if (patch.r3_cs === null) deleteCookie(csKey(fnum, 3));
      else setCookie(csKey(fnum, 3), patch.r3_cs);
    }
  }

  function startEditFrame() {
    resetFrameCookies(currentFrameNumber);
    setFrameValue(index, {
      lane: currentFrame.lane ?? null,
      r1: null,
      r2: null,
      r3: null,
      r1_cs: null,
      r2_cs: null,
      r3_cs: null
    });
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
      if (currentFrameNumber < 10 && r1 === 10) return false;
      return true;
    }

    if (r1 === null || r2 === null) return false;

    if (currentFrameNumber < 10) {
      if (r1 === 10) return false;
      if (r1 + r2 === 10) return false;
      return true;
    }

    return true;
  }

  function onRollChange(roll: 1 | 2 | 3, val: number | null) {
    if (roll === 1) {
      setFrameValue(index, {
        r1: val,
        r2: null,
        r3: null,
        r1_cs: null,
        r2_cs: null,
        r3_cs: null
      });
      return;
    }
    if (roll === 2) {
      setFrameValue(index, { r2: val, r3: null, r2_cs: null, r3_cs: null });
      return;
    }
    setFrameValue(index, { r3: val, r3_cs: null });
  }

  function onChopSplitChange(roll: 1 | 2 | 3, val: ChopSplit) {
    if (roll === 1) setFrameValue(index, { r1_cs: val });
    if (roll === 2) setFrameValue(index, { r2_cs: val });
    if (roll === 3) setFrameValue(index, { r3_cs: val });
  }

  function submitFrame() {
    // ✅ ONLY place we flip back to front
    setFlipped(false);

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

    const id = typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now());
    setCookie("game_id", id);
    setGameId(id);

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
    clearAllGameCookies();
    alert("Score submitted!");
    newGame();
  }

  // Front display
  const strike = isStrike(currentFrame);
  const spare2 = isSpareInTwo(currentFrame);
  const cumScore = cumulative[index];

  const r1Text = strike ? "X" : currentFrame.r1 !== null ? String(currentFrame.r1) : "";
  const r2Text = spare2 ? "/" : currentFrame.r2 !== null ? String(currentFrame.r2) : "";
  const r3Text = currentFrame.r3 !== null ? String(currentFrame.r3) : "";

  const csBadge = (v: ChopSplit) => (v === "Chop" ? "C" : v === "Split" ? "S" : "");
  const r1Badge = csBadge(currentFrame.r1_cs);
  const r2Badge = csBadge(currentFrame.r2_cs);
  const r3Badge = csBadge(currentFrame.r3_cs);

  const cardWidth = "min(560px, 94vw)";

  function openBackIfAllowed() {
    if (isFutureFrame) return;
    if (!canEditThisFrame) return;
    setFlipped(true);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: BG,
        fontFamily: "Montserrat, system-ui",
        color: TEXT,
        padding: "2rem 1rem 2.75rem"
      }}
    >
      {/* Background glow */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background:
            "radial-gradient(900px 520px at 18% 10%, rgba(228,106,46,0.22), transparent 58%)," +
            "radial-gradient(900px 520px at 86% 28%, rgba(228,106,46,0.12), transparent 62%)," +
            "linear-gradient(180deg, rgba(255,255,255,0.02), transparent 35%, rgba(0,0,0,0.30) 100%)"
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          <img
            src="/1@300x.png"
            alt="Dux Bowling"
            style={{
              maxWidth: 160,
              height: "auto",
              filter: "drop-shadow(0 18px 40px rgba(0,0,0,0.6))"
            }}
          />
        </div>

        {/* Meta inputs */}
        <section
          style={{
            maxWidth: 820,
            margin: "0 auto 1rem",
            background: PANEL,
            borderRadius: 18,
            padding: "1rem",
            border: `1px solid ${BORDER}`,
            boxShadow: "0 22px 55px rgba(0,0,0,0.55)",
            backdropFilter: "blur(10px)"
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".85rem" }}>
            <Label text="Date">
              <input
                type="date"
                value={gameDate}
                max={todayISO()}
                onChange={(e) => setGameDate(e.target.value)}
                style={inputDark}
              />
            </Label>

            <Label text="Location">
              <select value={location} onChange={(e) => setLocation(e.target.value)} style={inputDark}>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </Label>

            <Label text="Game Type">
              <select value={gameType} onChange={(e) => setGameType(e.target.value)} style={inputDark}>
                {GAME_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Label>

            <Label text="Game Number">
              <select value={gameNumber} onChange={(e) => setGameNumber(Number(e.target.value))} style={inputDark}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </Label>
          </div>
        </section>

        {/* Fixed arrows */}
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
            zIndex: 50,
            boxShadow: "0 18px 40px rgba(0,0,0,0.45)"
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
            zIndex: 50,
            boxShadow: "0 18px 40px rgba(0,0,0,0.45)"
          }}
        >
          ›
        </button>

        {/* Card */}
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "center" }}>
          <div
            ref={cardRef}
            style={{
              width: cardWidth,
              height: 320,
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
              {/* FRONT (clicking front opens back; back never auto-closes) */}
              <div
                onClick={openBackIfAllowed}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: PANEL,
                  borderRadius: 18,
                  padding: "1rem",
                  backfaceVisibility: "hidden",
                  border: `1px solid ${BORDER}`,
                  boxShadow: "0 22px 55px rgba(0,0,0,0.55)",
                  display: "grid",
                  gridTemplateRows: "auto 1fr auto",
                  gap: ".85rem",
                  backdropFilter: "blur(10px)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: ".75rem" }}>
                  <div style={{ fontWeight: 900, color: ORANGE }}>Frame {currentFrameNumber}</div>
                  <div style={{ fontSize: ".88rem", color: MUTED }}>
                    Game ID:{" "}
                    <span style={{ color: TEXT, fontWeight: 800 }}>{gameId ? gameId.slice(0, 8) : "—"}</span>
                  </div>
                </div>

                <div
                  style={{
                    border: `2px solid ${ORANGE}`,
                    borderRadius: 14,
                    overflow: "hidden",
                    display: "grid",
                    gridTemplateRows: "72px 1fr",
                    background: "rgba(0,0,0,0.18)"
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `2px solid ${ORANGE}` }}>
                    {/* Roll 1 */}
                    <div
                      style={{
                        position: "relative",
                        borderRight: `2px solid ${ORANGE}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.35rem",
                        fontWeight: 900,
                        background: strike ? ORANGE : "transparent",
                        color: strike ? "#fff" : ORANGE
                      }}
                    >
                      {r1Text}
                      <div
                        style={{
                          position: "absolute",
                          left: 8,
                          bottom: 6,
                          fontSize: ".8rem",
                          fontWeight: 950,
                          color: strike ? "rgba(255,255,255,0.92)" : ORANGE,
                          opacity: r1Badge ? 1 : 0
                        }}
                        aria-hidden="true"
                      >
                        {r1Badge}
                      </div>
                    </div>

                    {/* Roll 2 */}
                    <div
                      style={{
                        position: "relative",
                        borderRight: `2px solid ${ORANGE}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.35rem",
                        fontWeight: 900,
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
                      <div
                        style={{
                          position: "absolute",
                          left: 8,
                          bottom: 6,
                          fontSize: ".8rem",
                          fontWeight: 950,
                          color: ORANGE,
                          opacity: r2Badge ? 1 : 0
                        }}
                        aria-hidden="true"
                      >
                        {r2Badge}
                      </div>
                    </div>

                    {/* Roll 3 */}
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.35rem",
                        fontWeight: 900,
                        color: ORANGE
                      }}
                    >
                      {r3Text}
                      <div
                        style={{
                          position: "absolute",
                          left: 8,
                          bottom: 6,
                          fontSize: ".8rem",
                          fontWeight: 950,
                          color: ORANGE,
                          opacity: r3Badge ? 1 : 0
                        }}
                        aria-hidden="true"
                      >
                        {r3Badge}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ fontSize: "2.2rem", fontWeight: 950, color: TEXT }}>{cumScore ?? "—"}</div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".9rem", color: MUTED }}>
                  <div>
                    Lane: <strong style={{ color: TEXT }}>{currentFrame.lane ?? "—"}</strong>
                  </div>
                  <div>{isFutureFrame ? "Complete prior frames first" : "Tap to enter/edit"}</div>
                </div>
              </div>

              {/* BACK (does NOT close on click; only Confirm closes it) */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: PANEL,
                  color: TEXT,
                  borderRadius: 18,
                  padding: "1rem",
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  border: `1px solid ${BORDER}`,
                  boxShadow: "0 22px 55px rgba(0,0,0,0.55)",
                  display: "grid",
                  gridTemplateRows: "auto 1fr auto",
                  gap: ".85rem",
                  backdropFilter: "blur(10px)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 950, color: ORANGE }}>Frame {currentFrameNumber}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!canEditThisFrame || isFutureFrame) return;
                      startEditFrame();
                    }}
                    disabled={!canEditThisFrame || isFutureFrame}
                    style={{
                      border: `1px solid ${BORDER}`,
                      borderRadius: 999,
                      padding: ".45rem .8rem",
                      background: "rgba(255,255,255,0.08)",
                      color: TEXT,
                      fontWeight: 900,
                      opacity: !canEditThisFrame || isFutureFrame ? 0.5 : 1,
                      cursor: !canEditThisFrame || isFutureFrame ? "default" : "pointer"
                    }}
                  >
                    Reset frame
                  </button>
                </div>

                <div style={{ display: "grid", gap: ".85rem" }}>
                  <Label text="Lane (optional)">
                    <select
                      value={currentFrame.lane ?? ""}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        setFrameValue(index, { lane: val });
                      }}
                      style={inputDark}
                    >
                      <option value="">—</option>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </Label>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: ".75rem" }}>
                    <RollBlock
                      title="Roll 1"
                      enabled={rollEnabled(1)}
                      rollValue={currentFrame.r1}
                      onRollChange={(v) => onRollChange(1, v)}
                      options={rollOptions(1)}
                      csValue={currentFrame.r1_cs}
                      onCSChange={(v) => onChopSplitChange(1, v)}
                    />
                    <RollBlock
                      title="Roll 2"
                      enabled={rollEnabled(2)}
                      rollValue={currentFrame.r2}
                      onRollChange={(v) => onRollChange(2, v)}
                      options={rollOptions(2)}
                      csValue={currentFrame.r2_cs}
                      onCSChange={(v) => onChopSplitChange(2, v)}
                    />
                    <RollBlock
                      title="Roll 3"
                      enabled={rollEnabled(3)}
                      rollValue={currentFrame.r3}
                      onRollChange={(v) => onRollChange(3, v)}
                      options={rollOptions(3)}
                      csValue={currentFrame.r3_cs}
                      onCSChange={(v) => onChopSplitChange(3, v)}
                    />
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
                    borderRadius: 14,
                    padding: ".9rem",
                    fontWeight: 950,
                    background: ORANGE,
                    color: "#fff",
                    opacity: !frameComplete(currentFrame, currentFrameNumber) || isFutureFrame ? 0.55 : 1,
                    cursor: !frameComplete(currentFrame, currentFrameNumber) || isFutureFrame ? "default" : "pointer",
                    boxShadow: "0 18px 40px rgba(0,0,0,0.35)"
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div style={{ maxWidth: 820, margin: "1.25rem auto 0", display: "grid", gap: ".75rem" }}>
          <button
            onClick={submitScore}
            disabled={!allComplete}
            style={{
              width: "100%",
              border: "none",
              borderRadius: 16,
              padding: "1rem",
              fontWeight: 950,
              background: ORANGE,
              color: "#fff",
              opacity: allComplete ? 1 : 0.55,
              cursor: allComplete ? "pointer" : "default",
              boxShadow: "0 22px 55px rgba(0,0,0,0.55)"
            }}
          >
            Submit Score
          </button>

          <button
            onClick={newGame}
            style={{
              width: "100%",
              border: `1px solid ${BORDER}`,
              borderRadius: 16,
              padding: "1rem",
              fontWeight: 950,
              background: PANEL,
              color: TEXT,
              boxShadow: "0 22px 55px rgba(0,0,0,0.45)"
            }}
          >
            New Game
          </button>
        </div>
      </div>
    </main>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "grid",
        gap: ".35rem",
        fontSize: ".9rem",
        color: "rgba(242,242,242,0.85)",
        fontWeight: 900
      }}
    >
      {text}
      {children}
    </label>
  );
}

const inputDark: React.CSSProperties = {
  padding: ".7rem",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.25)",
  color: "#f2f2f2",
  outline: "none",
  fontFamily: "Montserrat, system-ui"
};

function RollBlock({
  title,
  enabled,
  rollValue,
  onRollChange,
  options,
  csValue,
  onCSChange
}: {
  title: string;
  enabled: boolean;
  rollValue: number | null;
  onRollChange: (v: number | null) => void;
  options: number[];
  csValue: ChopSplit;
  onCSChange: (v: ChopSplit) => void;
}) {
  return (
    <div style={{ display: "grid", gap: ".45rem" }}>
      <div style={{ fontSize: ".85rem", fontWeight: 950, color: "rgba(242,242,242,0.9)" }}>{title}</div>

      <select
        value={rollValue ?? ""}
        disabled={!enabled}
        onChange={(e) => onRollChange(e.target.value === "" ? null : Number(e.target.value))}
        style={{
          ...inputDark,
          opacity: enabled ? 1 : 0.55
        }}
      >
        <option value="">—</option>
        {options.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>

      <select
        value={csValue ?? ""}
        disabled={!enabled || rollValue === null}
        onChange={(e) => onCSChange(e.target.value === "" ? null : (e.target.value as "Chop" | "Split"))}
        style={{
          ...inputDark,
          opacity: !enabled || rollValue === null ? 0.55 : 1
        }}
      >
        <option value="">—</option>
        <option value="Chop">Chop</option>
        <option value="Split">Split</option>
      </select>
    </div>
  );
}