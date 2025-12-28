"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Duckpin notes implemented:
 * - Frames 1-9: up to 3 rolls, max 10 pins total per frame
 * - Strike: 10 on first roll, frame ends early
 * - Spare: reaching 10 by roll 2 or roll 3
 * - Strike bonus: next 2 rolls
 * - Spare bonus: next 1 roll
 * - 10th frame:
 *   - Strike on first roll => +2 bonus rolls (total 3 rolls in frame 10)
 *   - Spare by roll 2 => +1 bonus roll (total 3 rolls in frame 10)
 *   - Spare by roll 3 => +1 bonus roll (total 4 rolls in frame 10)
 * - Pin limit per *frame* still enforced (0..remaining) EXCEPT bonus rolls in 10th frame
 */

type Frame = {
  rolls: (number | null)[]; // length 3 normally, 10th can have 4
  // computed:
  strike: boolean;
  spare: boolean;
  open: boolean;
};

const ORANGE = "#e46a2e";
const CREAM = "#f5f0e6";

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string) {
  const target = encodeURIComponent(name) + "=";
  const parts = document.cookie.split("; ");
  for (const p of parts) {
    if (p.startsWith(target)) return decodeURIComponent(p.slice(target.length));
  }
  return null;
}

function deleteCookie(name: string) {
  document.cookie = `${encodeURIComponent(
    name
  )}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function ensureGameId() {
  let id = getCookie("game_id");
  if (!id) {
    id =
      (globalThis.crypto && "randomUUID" in crypto && crypto.randomUUID()) ||
      `game_${Math.random().toString(16).slice(2)}_${Date.now()}`;
    setCookie("game_id", id, 7);
  }
  return id;
}

function cookieKey(frame: number, roll: number) {
  return `frame${frame}_roll${roll}`;
}

function loadFramesFromCookies(): (number | null)[][] {
  const frames: (number | null)[][] = [];
  for (let f = 1; f <= 10; f++) {
    const maxRolls = f === 10 ? 4 : 3;
    const rolls: (number | null)[] = [];
    for (let r = 1; r <= maxRolls; r++) {
      const v = getCookie(cookieKey(f, r));
      rolls.push(v === null ? null : Number(v));
    }
    frames.push(rolls);
  }
  return frames;
}

function clearFrameCookies(frame: number) {
  const maxRolls = frame === 10 ? 4 : 3;
  for (let r = 1; r <= maxRolls; r++) deleteCookie(cookieKey(frame, r));
}

function clearAllGameCookies() {
  deleteCookie("game_id");
  for (let f = 1; f <= 10; f++) clearFrameCookies(f);
}

function normalizeFrames(raw: (number | null)[][]): Frame[] {
  return raw.map((rolls, idx) => {
    const f = idx + 1;

    // Keep only meaningful rolls for strike frames (1-9)
    // For 10th frame we keep as user enters; validation enforced on entry.
    const r1 = rolls[0];
    const r2 = rolls[1];
    const r3 = rolls[2];
    const r4 = f === 10 ? rolls[3] : null;

    const strike = r1 === 10;
    const frameTotal3 =
      (r1 ?? 0) + (r2 ?? 0) + (r3 ?? 0); // ignore r4 for spare detection
    const spare =
      !strike &&
      r1 !== null &&
      ((r2 !== null && r1 + r2 === 10) ||
        (r3 !== null && frameTotal3 === 10));

    const open =
      r1 !== null &&
      (f === 10
        ? // 10th frame can be incomplete but open once 3 rolls entered w/o spare
          r2 !== null &&
          r3 !== null &&
          !strike &&
          !spare
        : r2 !== null && r3 !== null && !strike && !spare);

    // 10th frame bonus roll eligibility:
    // - Strike on first => needs r2 & r3 as bonus (still stored in roll2/roll3)
    // - Spare by roll2 => needs r3 as bonus
    // - Spare by roll3 => needs r4 as bonus
    // We'll handle entry rules elsewhere.

    const normalized: (number | null)[] =
      f === 10 ? [r1, r2, r3, r4] : [r1, r2, r3];

    return { rolls: normalized, strike, spare, open };
  });
}

function flattenRollsForScoring(frames: Frame[]): number[] {
  // For scoring, we need a sequential list of rolls, including 10th frame bonus rolls.
  const out: number[] = [];
  for (let f = 1; f <= 10; f++) {
    const fr = frames[f - 1];
    const r = fr.rolls;

    if (f <= 9) {
      const r1 = r[0];
      if (r1 === null) break;
      if (r1 === 10) {
        out.push(10);
      } else {
        const r2 = r[1];
        const r3 = r[2];
        if (r2 === null || r3 === null) break;
        out.push(r1, r2, r3);
      }
    } else {
      // Frame 10: always append whatever is present in order.
      // (Scoring function will safely treat missing as 0 for incomplete scoring display.)
      const seq = r.filter(v => v !== null) as number[];
      out.push(...seq);
    }
  }
  return out;
}

function duckpinCumulativeByFrame(frames: Frame[]): number[] {
  // Returns array length 10 of cumulative score at each frame (or last computed),
  // based on duckpin rules: strike bonus next 2 balls, spare bonus next 1.
  const rolls = flattenRollsForScoring(frames);

  // Build a mapping of frame->roll start indices for the rolls array
  const frameStart: number[] = [];
  let ri = 0;
  for (let f = 1; f <= 10; f++) {
    frameStart.push(ri);
    const fr = frames[f - 1];
    const r1 = fr.rolls[0];

    if (f <= 9) {
      if (r1 === null) break;
      if (r1 === 10) ri += 1;
      else ri += 3;
    } else {
      // 10th frame consumes whatever rolls exist (up to 4)
      const count = fr.rolls.filter(v => v !== null).length;
      ri += count;
    }
  }

  const cum: number[] = Array(10).fill(0);
  let score = 0;
  let rollIndex = 0;

  for (let frame = 1; frame <= 10; frame++) {
    // If we have no roll for this frame, stop computing further.
    if (rollIndex >= rolls.length) {
      // carry score forward
      for (let k = frame - 1; k < 10; k++) cum[k] = score;
      break;
    }

    const r1 = rolls[rollIndex] ?? 0;

    // Frames 1-9 rules use 1-roll strike else 3-roll frame
    if (frame <= 9) {
      if (r1 === 10) {
        const b1 = rolls[rollIndex + 1] ?? 0;
        const b2 = rolls[rollIndex + 2] ?? 0;
        score += 10 + b1 + b2;
        cum[frame - 1] = score;
        rollIndex += 1;
        continue;
      }

      const r2 = rolls[rollIndex + 1];
      const r3 = rolls[rollIndex + 2];
      if (r2 === undefined || r3 === undefined) {
        // incomplete frame, carry score
        for (let k = frame - 1; k < 10; k++) cum[k] = score;
        break;
      }

      const frameTotal = r1 + r2 + r3;

      if (r1 + r2 === 10 || frameTotal === 10) {
        const bonus = rolls[rollIndex + 3] ?? 0;
        score += 10 + bonus;
      } else {
        score += frameTotal;
      }

      cum[frame - 1] = score;
      rollIndex += 3;
      continue;
    }

    // Frame 10:
    // Treat the remaining rolls as belonging to frame 10.
    // Strike/spare bonus rolls are already included as additional rolls.
    // We just compute the frame 10 score directly from its own rolls without "next frame" lookups.
    const fr10 = frames[9];
    const r10 = fr10.rolls;

    // Need at least 1 roll to score anything
    const a = r10[0];
    if (a === null) {
      cum[9] = score;
      break;
    }

    // Strike: score = 10 + next two rolls in frame 10 (roll2, roll3)
    if (a === 10) {
      const b = r10[1] ?? 0;
      const c = r10[2] ?? 0;
      // If b/c missing, still shows partial score
      score += 10 + (b ?? 0) + (c ?? 0);
      cum[9] = score;
      break;
    }

    const b = r10[1];
    const c = r10[2];

    if (b === null || c === null) {
      cum[9] = score;
      break;
    }

    const total3 = a + b + c;

    // Spare by roll2 => +1 bonus (roll3 is bonus), but in duckpin 10th we store it in roll3.
    // Spare by roll3 => +1 bonus (roll4).
    if (a + b === 10) {
      // roll3 is bonus
      score += 10 + c;
      cum[9] = score;
      break;
    }

    if (total3 === 10) {
      const d = r10[3];
      score += 10 + (d ?? 0);
      cum[9] = score;
      break;
    }

    // Open
    score += total3;
    cum[9] = score;
    break;
  }

  return cum;
}

function remainingPinsForRoll(framesRaw: (number | null)[][], frameIdx: number, rollIdx: number) {
  // rollIdx: 0-based within frame
  const frameNumber = frameIdx + 1;
  const rolls = framesRaw[frameIdx];

  const r1 = rolls[0];
  const r2 = rolls[1];
  const r3 = rolls[2];

  // 10th frame bonus rules: once spare/strike achieved, bonus rolls are NOT constrained by remaining pins.
  if (frameNumber === 10) {
    const first = r1 ?? 0;
    const second = r2 ?? 0;
    const third = r3 ?? 0;

    const strike = r1 === 10;
    const spareBy2 = !strike && r1 !== null && r2 !== null && r1 + r2 === 10;
    const spareBy3 = !strike && r1 !== null && r2 !== null && r3 !== null && (r1 + r2 + r3 === 10);

    // If entering roll2/roll3 as strike bonus: not constrained
    if (strike) return 10;

    // If spare by roll2, roll3 is bonus: not constrained
    if (spareBy2 && rollIdx === 2) return 10;

    // If spare by roll3, roll4 is bonus: not constrained
    if (spareBy3 && rollIdx === 3) return 10;

    // Otherwise still constrained by remaining in first three rolls
    const pinsSoFar = (r1 ?? 0) + (r2 ?? 0) + (r3 ?? 0);
    return Math.max(0, 10 - pinsSoFar);
  }

  // Frames 1-9: constrained by remaining pins in frame total
  const pinsSoFar = (r1 ?? 0) + (r2 ?? 0) + (r3 ?? 0);
  return Math.max(0, 10 - pinsSoFar);
}

export default function GamePage() {
  const [gameId, setGameId] = useState<string>("");

  // Raw rolls storage for cookies: 10 frames, each with 3 rolls; 10th has optional 4th
  const [framesRaw, setFramesRaw] = useState<(number | null)[][]>(() => {
    // On first render client-side, cookies exist; but to be safe, initialize empty and load in effect.
    return Array.from({ length: 10 }, (_, i) =>
      i === 9 ? [null, null, null, null] : [null, null, null]
    );
  });

  const [currentFrameIdx, setCurrentFrameIdx] = useState(0); // 0..9
  const [flipped, setFlipped] = useState(false);
  const [editingFrameIdx, setEditingFrameIdx] = useState<number | null>(null);

  // For positioning arrows: fixed left/right, but vertically centered with the card.
  const cardWrapRef = useRef<HTMLDivElement | null>(null);
  const [arrowTop, setArrowTop] = useState<number>(240);

  useEffect(() => {
    const id = ensureGameId();
    setGameId(id);

    const loaded = loadFramesFromCookies();

    // Ensure 10th frame has 4 slots in state
    const normalized = loaded.map((r, idx) => (idx === 9 ? [r[0], r[1], r[2], r[3]] : [r[0], r[1], r[2]]));
    setFramesRaw(normalized);

    // Determine current frame (first frame that isn't complete)
    const computedFrames = normalizeFrames(normalized);
    let cf = 0;
    for (let i = 0; i < 10; i++) {
      const fr = computedFrames[i];
      const isComplete = isFrameCompleteForProgress(normalized, i);
      if (!isComplete) {
        cf = i;
        break;
      }
      cf = i;
    }
    setCurrentFrameIdx(cf);

    // Arrow position tracking
    const updateArrowTop = () => {
      const el = cardWrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setArrowTop(Math.round(rect.top + rect.height / 2));
    };

    updateArrowTop();
    window.addEventListener("scroll", updateArrowTop, { passive: true });
    window.addEventListener("resize", updateArrowTop);
    return () => {
      window.removeEventListener("scroll", updateArrowTop);
      window.removeEventListener("resize", updateArrowTop);
    };
  }, []);

  const frames = useMemo(() => normalizeFrames(framesRaw), [framesRaw]);
  const cumulative = useMemo(() => duckpinCumulativeByFrame(frames), [frames]);

  const index = currentFrameIdx;
  const isFirst = index === 0;
  const isLast = index === 9;

  const viewingFrameIdx = editingFrameIdx ?? index;
  const viewingFrameNumber = viewingFrameIdx + 1;

  // Allow: edit prior frames or current frame only
  function canEditFrame(frameIdx: number) {
    return frameIdx <= currentFrameIdx;
  }

  function prevFrame() {
    if (index > 0) {
      setFlipped(false);
      setEditingFrameIdx(null);
      setCurrentFrameIdx(index - 1);
    }
  }

  function nextFrame() {
    if (index < 9) {
      setFlipped(false);
      setEditingFrameIdx(null);
      setCurrentFrameIdx(index + 1);
    }
  }

  function startEditThisFrame() {
    if (!canEditFrame(viewingFrameIdx)) return;
    // Reset that frame cookies & local state rolls to null to force re-entry from roll1
    clearFrameCookies(viewingFrameNumber);
    setFramesRaw(prev => {
      const copy = prev.map(arr => [...arr]);
      copy[viewingFrameIdx] =
        viewingFrameIdx === 9 ? [null, null, null, null] : [null, null, null];
      return copy;
    });
  }

  function setRoll(frameIdx: number, rollIdx: number, pins: number) {
    setFramesRaw(prev => {
      const copy = prev.map(arr => [...arr]);
      const frameNumber = frameIdx + 1;

      // Enforce sequential: can't set roll2 unless roll1 set, etc.
      for (let r = 0; r < rollIdx; r++) {
        if (copy[frameIdx][r] === null) return prev;
      }

      // Enforce edit rules: can only change if frame <= current
      if (!canEditFrame(frameIdx)) return prev;

      // Enforce max pins constraints (except 10th bonus)
      const maxPins = remainingPinsForRoll(copy, frameIdx, rollIdx);
      if (pins < 0 || pins > maxPins) return prev;

      // If setting roll1 and it's a strike in frames 1-9, wipe roll2/roll3
      if (frameNumber <= 9 && rollIdx === 0 && pins === 10) {
        copy[frameIdx][0] = 10;
        copy[frameIdx][1] = null;
        copy[frameIdx][2] = null;
      } else {
        copy[frameIdx][rollIdx] = pins;
      }

      // If user edits earlier roll, clear later rolls in that frame (and cookies) to force re-entry
      for (let r = rollIdx + 1; r < copy[frameIdx].length; r++) {
        copy[frameIdx][r] = null;
      }
      // Also clear cookies for that frame then re-write what exists
      clearFrameCookies(frameNumber);
      const maxRolls = frameNumber === 10 ? 4 : 3;
      for (let r = 1; r <= maxRolls; r++) {
        const v = copy[frameIdx][r - 1];
        if (v !== null) setCookie(cookieKey(frameNumber, r), String(v), 7);
      }

      return copy;
    });
  }

  function confirmFrame() {
    // Only confirm current frame or a prior frame that was edited.
    // If confirming current frame, advance current frame if complete.
    setFlipped(false);
    setEditingFrameIdx(null);

    // Recompute progress based on framesRaw
    setFramesRaw(prev => {
      // Ensure cookies are written for all non-null values in viewing frame
      const frameNumber = viewingFrameNumber;
      const maxRolls = frameNumber === 10 ? 4 : 3;
      clearFrameCookies(frameNumber);
      for (let r = 1; r <= maxRolls; r++) {
        const v = prev[viewingFrameIdx][r - 1];
        if (v !== null) setCookie(cookieKey(frameNumber, r), String(v), 7);
      }
      return prev;
    });

    // Advance if confirming current frame and it is complete
    if (viewingFrameIdx === currentFrameIdx) {
      if (isFrameCompleteForProgress(framesRaw, viewingFrameIdx)) {
        setCurrentFrameIdx(Math.min(9, currentFrameIdx + 1));
      }
    }
  }

  function submitScore() {
    // For now: just clears cookies and resets.
    clearAllGameCookies();
    const id = ensureGameId();
    setGameId(id);
    setFramesRaw(Array.from({ length: 10 }, (_, i) => (i === 9 ? [null, null, null, null] : [null, null, null])));
    setCurrentFrameIdx(0);
    setEditingFrameIdx(null);
    setFlipped(false);
  }

  function newGame() {
    submitScore();
  }

  // Dropdown options for current input roll (based on remaining pins)
  function rollOptions(frameIdx: number, rollIdx: number) {
    const maxPins = remainingPinsForRoll(framesRaw, frameIdx, rollIdx);
    return Array.from({ length: maxPins + 1 }, (_, i) => i);
  }

  // Visual sheet helpers
  const fr = frames[viewingFrameIdx];
  const rolls = framesRaw[viewingFrameIdx];

  const frameCum = cumulative[viewingFrameIdx] ?? 0;

  const strike = fr.strike;
  const spare = fr.spare;

  const spareRollBoxIndex = (() => {
    // Which roll (1-based) completed 10 pins in this frame (not a strike)?
    if (strike) return null;
    const r1 = rolls[0];
    const r2 = rolls[1];
    const r3 = rolls[2];
    if (r1 === null) return null;
    if (r2 !== null && r1 + r2 === 10) return 2;
    if (r3 !== null && r2 !== null && r1 + r2 + r3 === 10) return 3;
    if (viewingFrameNumber === 10) {
      const r4 = (rolls as any[])[3] as number | null;
      // spare by roll3 gets bonus roll4; spare indicator still on roll3
      void r4;
    }
    return null;
  })();

  const showRollInputsCount = viewingFrameNumber === 10 ? 4 : 3;

  // Determine which roll is currently editable (first null)
  const nextNeededRollIdx = (() => {
    const list = framesRaw[viewingFrameIdx];
    for (let i = 0; i < list.length; i++) {
      if (list[i] === null) return i;
    }
    return list.length; // none needed
  })();

  // Prevent going into edit mode for future frames
  const canEditThisCard = canEditFrame(viewingFrameIdx);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: CREAM,
        fontFamily: "Montserrat, system-ui",
        padding: "2rem 1rem"
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
        <img src="/1@300x.png" alt="Dux Bowling" style={{ maxWidth: 180, width: "100%" }} />
      </div>

      {/* Header / Mission */}
      <p
        style={{
          textAlign: "center",
          maxWidth: 700,
          margin: "0 auto 1.75rem",
          color: "#c75a1d",
          fontSize: "1.05rem",
          lineHeight: 1.5
        }}
      >
        Enter your rolls frame-by-frame. Tap the card to flip and enter pins.
        <br />
        <strong>Duckpin rules</strong> are applied automatically.
      </p>

      {/* Fixed arrows (left/right fixed; vertical tracks card center) */}
      <button
        onClick={prevFrame}
        disabled={isFirst}
        aria-label="Previous frame"
        style={{
          position: "fixed",
          left: 14,
          top: arrowTop,
          transform: "translateY(-50%)",
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "none",
          background: ORANGE,
          color: "#fff",
          fontSize: "1.4rem",
          opacity: isFirst ? 0.5 : 1,
          cursor: isFirst ? "default" : "pointer",
          zIndex: 50,
          boxShadow: "0 10px 24px rgba(0,0,0,0.18)"
        }}
      >
        ‹
      </button>

      <button
        onClick={nextFrame}
        disabled={isLast}
        aria-label="Next frame"
        style={{
          position: "fixed",
          right: 14,
          top: arrowTop,
          transform: "translateY(-50%)",
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "none",
          background: ORANGE,
          color: "#fff",
          fontSize: "1.4rem",
          opacity: isLast ? 0.5 : 1,
          cursor: isLast ? "default" : "pointer",
          zIndex: 50,
          boxShadow: "0 10px 24px rgba(0,0,0,0.18)"
        }}
      >
        ›
      </button>

      {/* Card */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          ref={cardWrapRef}
          style={{
            width: "min(92vw, 360px)",
            height: 260,
            perspective: 1000
          }}
          onClick={() => {
            // Only allow flipping if this is current or prior
            if (!canEditThisCard) return;
            setFlipped(v => !v);
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
            {/* FRONT: Classic score sheet look */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#fff",
                borderRadius: 14,
                padding: "1rem",
                backfaceVisibility: "hidden",
                boxShadow: "0 10px 25px rgba(0,0,0,0.10)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ color: ORANGE, fontWeight: 800 }}>
                  Frame {viewingFrameNumber}
                  {viewingFrameIdx === currentFrameIdx ? (
                    <span style={{ fontWeight: 600, color: "#9b4a1d" }}> • Current</span>
                  ) : (
                    <span style={{ fontWeight: 600, color: "#9b4a1d" }}> • Review</span>
                  )}
                </div>
                <div style={{ color: "#9b4a1d", fontSize: ".85rem" }}>
                  Game: {gameId ? gameId.slice(0, 8) : "—"}
                </div>
              </div>

              {/* Score sheet row */}
              <div
                style={{
                  marginTop: 10,
                  border: `2px solid ${ORANGE}`,
                  borderRadius: 10,
                  overflow: "hidden",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1.4fr",
                  height: 110
                }}
              >
                {/* Roll boxes */}
                <RollBox
                  label="1"
                  value={renderRollValue({ frameNumber: viewingFrameNumber, rollNumber: 1, pins: rolls[0], strike, spareRollBoxIndex })}
                  strikeCorner={strike}
                  spareCorner={false}
                  orange={ORANGE}
                />
                <RollBox
                  label="2"
                  value={renderRollValue({ frameNumber: viewingFrameNumber, rollNumber: 2, pins: rolls[1], strike, spareRollBoxIndex })}
                  strikeCorner={false}
                  spareCorner={spareRollBoxIndex === 2}
                  orange={ORANGE}
                />
                <RollBox
                  label="3"
                  value={renderRollValue({ frameNumber: viewingFrameNumber, rollNumber: 3, pins: rolls[2], strike, spareRollBoxIndex })}
                  strikeCorner={false}
                  spareCorner={spareRollBoxIndex === 3}
                  orange={ORANGE}
                />
                {/* Cumulative box */}
                <div
                  style={{
                    borderLeft: `2px solid ${ORANGE}`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: ORANGE
                  }}
                >
                  <div style={{ fontSize: ".85rem", fontWeight: 700, opacity: 0.85 }}>Cumulative</div>
                  <div style={{ fontSize: "2rem", fontWeight: 900, lineHeight: 1 }}>
                    {frameCum}
                  </div>
                </div>
              </div>

              <div style={{ color: "#9b4a1d", fontSize: ".9rem", lineHeight: 1.35 }}>
                Tap to enter pins. You may edit <strong>current</strong> or <strong>prior</strong> frames.
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    newGame();
                  }}
                  style={pillButtonStyle({ bg: "#fff", border: ORANGE, color: ORANGE })}
                >
                  New Game
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    submitScore();
                  }}
                  style={pillButtonStyle({ bg: ORANGE, border: ORANGE, color: "#fff" })}
                >
                  Submit Score
                </button>
              </div>
            </div>

            {/* BACK: Roll entry */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: ORANGE,
                color: "#fff",
                borderRadius: 14,
                padding: "0.9rem",
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.10)",
                display: "flex",
                flexDirection: "column"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                <div style={{ fontWeight: 900 }}>
                  Frame {viewingFrameNumber} Entry
                </div>

                <button
                  onClick={() => setFlipped(false)}
                  style={{
                    border: "none",
                    background: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    borderRadius: 999,
                    padding: ".35rem .7rem",
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Close
                </button>
              </div>

              {!canEditThisCard && (
                <div style={noteBoxStyle}>
                  You can only edit the current frame or earlier frames.
                </div>
              )}

              <div style={noteBoxStyle}>
                <strong>Rule:</strong> If you change a frame, you must re-enter the entire frame from Roll 1.
                <br />
                (We automatically clear that frame’s cookies.)
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <button
                  onClick={() => {
                    if (!canEditThisCard) return;
                    startEditThisFrame();
                  }}
                  style={{
                    flex: 1,
                    border: "none",
                    background: "rgba(255,255,255,0.18)",
                    color: "#fff",
                    borderRadius: 12,
                    padding: ".75rem",
                    fontWeight: 800,
                    cursor: canEditThisCard ? "pointer" : "default",
                    opacity: canEditThisCard ? 1 : 0.6
                  }}
                >
                  Reset Frame
                </button>

                <button
                  onClick={() => {
                    if (!canEditThisCard) return;
                    setEditingFrameIdx(viewingFrameIdx);
                    startEditThisFrame();
                  }}
                  style={{
                    flex: 1,
                    border: "none",
                    background: "rgba(255,255,255,0.18)",
                    color: "#fff",
                    borderRadius: 12,
                    padding: ".75rem",
                    fontWeight: 800,
                    cursor: canEditThisCard ? "pointer" : "default",
                    opacity: canEditThisCard ? 1 : 0.6
                  }}
                >
                  Edit This Frame
                </button>
              </div>

              {/* Roll dropdowns */}
              <div
                style={{
                  background: "rgba(255,255,255,0.14)",
                  borderRadius: 12,
                  padding: ".75rem",
                  overflow: "auto",
                  flex: 1
                }}
              >
                <div style={{ fontSize: ".95rem", fontWeight: 800, marginBottom: 8 }}>
                  Enter Pins (0–10)
                </div>

                {Array.from({ length: showRollInputsCount }).map((_, rollIdx) => {
                  // Hide roll4 unless 10th spare-by-3 requires it
                  if (viewingFrameNumber !== 10 && rollIdx === 3) return null;

                  // Determine if roll4 should be shown
                  if (viewingFrameNumber === 10 && rollIdx === 3) {
                    const r1 = framesRaw[9][0];
                    const r2 = framesRaw[9][1];
                    const r3 = framesRaw[9][2];
                    const strike10 = r1 === 10;
                    const spareBy2 = !strike10 && r1 !== null && r2 !== null && r1 + r2 === 10;
                    const spareBy3 = !strike10 && r1 !== null && r2 !== null && r3 !== null && (r1 + r2 + r3 === 10);
                    if (!spareBy3) return null; // only show roll4 for spare-by-3
                  }

                  const disabled =
                    !canEditThisCard ||
                    (rollIdx > 0 && framesRaw[viewingFrameIdx][rollIdx - 1] === null) ||
                    (rollIdx > nextNeededRollIdx); // prevents skipping ahead

                  const options = rollOptions(viewingFrameIdx, rollIdx);

                  return (
                    <div
                      key={rollIdx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        marginBottom: 10
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>
                        Roll {rollIdx + 1}
                      </div>

                      <select
                        value={framesRaw[viewingFrameIdx][rollIdx] ?? ""}
                        disabled={disabled}
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : Number(e.target.value);
                          if (val === null) return;
                          setRoll(viewingFrameIdx, rollIdx, val);
                        }}
                        style={{
                          width: 150,
                          borderRadius: 10,
                          border: "none",
                          padding: ".6rem .75rem",
                          fontWeight: 800,
                          color: ORANGE,
                          background: "#fff",
                          opacity: disabled ? 0.7 : 1
                        }}
                      >
                        <option value="" disabled>
                          Select…
                        </option>
                        {options.map(o => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}

                <div style={{ fontSize: ".85rem", opacity: 0.95, lineHeight: 1.35 }}>
                  {viewingFrameNumber !== 10 ? (
                    <>Frame total can’t exceed <strong>10</strong>.</>
                  ) : (
                    <>
                      10th frame bonus rolls are allowed. Bonus rolls are not constrained by remaining pins.
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => confirmFrame()}
                style={{
                  marginTop: 10,
                  border: "none",
                  borderRadius: 12,
                  padding: ".9rem",
                  fontWeight: 900,
                  background: "#fff",
                  color: ORANGE,
                  cursor: "pointer"
                }}
              >
                Confirm Frame
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/** Classic roll box rendering */
function RollBox(props: {
  label: string;
  value: string;
  strikeCorner: boolean;
  spareCorner: boolean;
  orange: string;
}) {
  const { value, strikeCorner, spareCorner, orange } = props;

  return (
    <div
      style={{
        position: "relative",
        borderRight: `2px solid ${orange}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
        fontSize: "1.35rem",
        color: orange
      }}
    >
      {/* Strike top-left box fill */}
      {strikeCorner && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 26,
            height: 26,
            background: orange,
            borderBottomRightRadius: 8
          }}
        />
      )}

      {/* Spare triangle shading */}
      {spareCorner && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, transparent 50%, rgba(228,106,46,0.22) 50%)`
          }}
        />
      )}

      <span style={{ position: "relative", zIndex: 1 }}>
        {value}
      </span>
    </div>
  );
}

function renderRollValue(args: {
  frameNumber: number;
  rollNumber: 1 | 2 | 3;
  pins: number | null;
  strike: boolean;
  spareRollBoxIndex: number | null;
}) {
  const { rollNumber, pins, strike, spareRollBoxIndex } = args;

  if (pins === null) return "";

  // Strike: show X in roll 1 (classic)
  if (rollNumber === 1 && strike) return "X";

  // Spare: show "/" in the roll box that completed 10
  if (spareRollBoxIndex === rollNumber) return "/";

  return String(pins);
}

function pillButtonStyle(opts: { bg: string; border: string; color: string }) {
  return {
    flex: 1,
    borderRadius: 999,
    border: `2px solid ${opts.border}`,
    background: opts.bg,
    color: opts.color,
    padding: ".65rem 1rem",
    fontWeight: 900,
    cursor: "pointer"
  } as const;
}

const noteBoxStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.18)",
  padding: ".65rem .75rem",
  borderRadius: 12,
  fontSize: ".88rem",
  lineHeight: 1.35,
  marginBottom: 10
};

function isFrameCompleteForProgress(framesRaw: (number | null)[][], frameIdx: number) {
  const frameNumber = frameIdx + 1;
  const r = framesRaw[frameIdx];

  const r1 = r[0];
  const r2 = r[1];
  const r3 = r[2];

  if (r1 === null) return false;

  if (frameNumber <= 9) {
    if (r1 === 10) return true; // strike completes frame
    return r2 !== null && r3 !== null;
  }

  // 10th frame completion:
  // - strike => needs roll2 and roll3
  if (r1 === 10) return r2 !== null && r3 !== null;

  if (r2 === null || r3 === null) return false;

  const total2 = r1 + r2;
  const total3 = total2 + r3;

  // spare by 2 => roll3 is bonus, so frame complete if roll3 present (already required)
  if (total2 === 10) return true;

  // spare by 3 => needs roll4
  if (total3 === 10) return r[3] !== null;

  // open => 3 rolls complete
  return true;
}