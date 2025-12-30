"use client";

export const dynamic = "force-dynamic";

const GameClient = dynamic(() => import("../components/GameClient"), { ssr: false });

export default function GamePage() {
  return <GameClient />;
}

import { useEffect, useMemo, useRef, useState } from "react";

type Frame = {
  r1: number | null;
  r2: number | null;
  r3: number | null;
};

const ORANGE = "#e46a2e";
const CREAM = "#f5f0e6";

function setCookie(name: string, value: string, days = 30) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
}

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function keyFor(frame: number, roll: 1 | 2 | 3) {
  return `frame${frame}_r${roll}`;
}

function isFrameComplete(frameNum: number, f: Frame) {
  const r1 = f.r1;
  const r2 = f.r2;
  const r3 = f.r3;

  if (frameNum === 10) {
    // Duckpin: always 3 rolls in 10th frame
    return r1 !== null && r2 !== null && r3 !== null;
  }

  if (r1 === null) return false;
  if (r1 === 10) return true; // strike ends frame (1–9)
  if (r2 === null) return false;

  // Spare is ONLY if first+second=10 (per your clarified rule)
  if (r1 + r2 === 10) return true;

  // Otherwise need 3 rolls for open frame
  return r3 !== null;
}

function nextFrameIndex(frames: Frame[]) {
  for (let i = 0; i < 10; i++) {
    if (!isFrameComplete(i + 1, frames[i])) return i;
  }
  return 9;
}

/**
 * Duckpin scoring rules per your requirements:
 * - Strike (frames 1-9): bonus next 2 balls
 * - Spare (frames 1-9): bonus next 1 ball, ONLY if r1+r2==10
 * - If 10 reached on 3rd ball => NOT a spare, no bonus
 * - 10th frame: sum of its 3 rolls only (no extra beyond included balls)
 *
 * Returns cumulative score per frame (null if not yet computable).
 */
function computeCumulative(frames: Frame[]) {
  // Build chronological roll list (exclude nulls)
  const rolls: number[] = [];
  // Track mapping from frame -> starting roll index in rolls[]
  const startIndex: number[] = Array(10).fill(0);

  let idx = 0;
  for (let f = 0; f < 10; f++) {
    startIndex[f] = idx;
    const fr = frames[f];

    if (fr.r1 !== null) {
      rolls.push(fr.r1); idx++;
    } else {
      continue;
    }

    const frameNum = f + 1;

    if (frameNum < 10 && fr.r1 === 10) {
      // strike consumes 1 roll for frames 1-9
      continue;
    }

    if (fr.r2 !== null) { rolls.push(fr.r2); idx++; } else { continue; }

    // If spare (r1+r2==10) in frames 1-9, consumes 2 rolls; no r3
    if (frameNum < 10 && fr.r1 + fr.r2 === 10) {
      continue;
    }

    // Otherwise 3rd roll exists (or not yet)
    if (fr.r3 !== null) { rolls.push(fr.r3); idx++; } else { continue; }
  }

  const cum: (number | null)[] = Array(10).fill(null);
  let total = 0;

  // Helper to see if roll exists
  const hasRoll = (i: number) => typeof rolls[i] === "number";

  for (let f = 0; f < 10; f++) {
    const frameNum = f + 1;
    const fr = frames[f];

    if (!isFrameComplete(frameNum, fr)) {
      cum[f] = null;
      continue;
    }

    const s = startIndex[f];
    const r1 = rolls[s];

    if (frameNum === 10) {
      // 10th frame: sum of its 3 rolls (all must be present)
      // In our model 10th always stores 3 rolls once complete.
      const a = fr.r1 ?? 0;
      const b = fr.r2 ?? 0;
      const c = fr.r3 ?? 0;
      total += a + b + c;
      cum[f] = total;
      continue;
    }

    // Strike (frames 1-9): need next 2 balls
    if (r1 === 10) {
      if (!hasRoll(s + 1) || !hasRoll(s + 2)) {
        cum[f] = null;
        continue;
      }
      total += 10 + rolls[s + 1] + rolls[s + 2];
      cum[f] = total;
      continue;
    }

    // Non-strike frames 1-9: r2 exists if complete
    // Spare ONLY if r1+r2==10 (NOT if completed on 3rd)
    const r2 = rolls[s + 1];
    const spare = r1 + r2 === 10;

    if (spare) {
      if (!hasRoll(s + 2)) {
        cum[f] = null;
        continue;
      }
      total += 10 + rolls[s + 2];
      cum[f] = total;
      continue;
    }

    // Open frame: must have r3
    const r3 = rolls[s + 2];
    total += r1 + r2 + r3;
    cum[f] = total;
  }

  return cum;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function GamePage() {
  const [carouselIndex, setCarouselIndex] = useState(0); // which frame card you're viewing (0-9)
  const [flipped, setFlipped] = useState(false);
  const [frames, setFrames] = useState<Frame[]>(
    Array.from({ length: 10 }, () => ({ r1: null, r2: null, r3: null }))
  );

  const [gameId, setGameId] = useState<string>("");

  // for aligning fixed arrows to card center
  const cardOuterRef = useRef<HTMLDivElement | null>(null);
  const [arrowTop, setArrowTop] = useState<number>(200);

  const currentFrameIdx = useMemo(() => nextFrameIndex(frames), [frames]);
  const cumulative = useMemo(() => computeCumulative(frames), [frames]);
  const allComplete = useMemo(() => frames.every((f, i) => isFrameComplete(i + 1, f)), [frames]);

  // Load cookies on first mount
  useEffect(() => {
    const existingGame = getCookie("game_id");
    if (existingGame) setGameId(existingGame);
    else {
      const newId = crypto.randomUUID();
      setGameId(newId);
      setCookie("game_id", newId);
    }

    const loaded: Frame[] = Array.from({ length: 10 }, (_, i) => {
      const frameNum = i + 1;
      const r1 = getCookie(keyFor(frameNum, 1));
      const r2 = getCookie(keyFor(frameNum, 2));
      const r3 = getCookie(keyFor(frameNum, 3));
      return {
        r1: r1 === null ? null : Number(r1),
        r2: r2 === null ? null : Number(r2),
        r3: r3 === null ? null : Number(r3)
      };
    });

    setFrames(loaded);
    setCarouselIndex(nextFrameIndex(loaded));
  }, []);

  // Track card center for fixed arrows
  useEffect(() => {
    let raf = 0;

    const update = () => {
      const el = cardOuterRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        // keep within viewport bounds
        setArrowTop(clamp(center, 80, window.innerHeight - 80));
      }
      raf = 0;
    };

    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const viewingFrameNum = carouselIndex + 1;
  const viewingFrame = frames[carouselIndex];

  const canOpenEditor = carouselIndex <= currentFrameIdx; // current or earlier
  const isEditingPrior = carouselIndex < currentFrameIdx;

  // Max pins logic per roll
  function maxPinsFor(frameNum: number, roll: 1 | 2 | 3, f: Frame) {
    const r1 = f.r1 ?? 0;
    const r2 = f.r2 ?? 0;

    if (frameNum === 10) {
      // 10th: always 3 rolls
      if (roll === 1) return 10;

      // Strike on 1st: roll2 and roll3 are fill balls on fresh rack
      if (f.r1 === 10) return 10;

      // Not strike
      if (roll === 2) return 10 - r1;

      // roll === 3
      if (f.r1 !== null && f.r2 !== null && f.r1 + f.r2 === 10) {
        // Spare (only by first two) => fill ball fresh rack
        return 10;
      }

      // Otherwise remaining pins
      return 10 - (r1 + r2);
    }

    // Frames 1-9
    if (roll === 1) return 10;

    // Strike ends frame (no roll2/roll3)
    if (f.r1 === 10) return 0;

    if (roll === 2) return 10 - r1;

    // roll === 3
    // Spare (only first two) ends frame; no roll3
    if (f.r1 !== null && f.r2 !== null && f.r1 + f.r2 === 10) return 0;

    return 10 - (r1 + r2);
  }

  function clearFrameCookies(frameNum: number) {
    deleteCookie(keyFor(frameNum, 1));
    deleteCookie(keyFor(frameNum, 2));
    deleteCookie(keyFor(frameNum, 3));
  }

  function startEdit() {
    if (!canOpenEditor) return;

    // Reset this frame entirely (state + cookies) so user must re-enter from roll 1
    clearFrameCookies(viewingFrameNum);
    setFrames(prev => {
      const copy = [...prev];
      copy[carouselIndex] = { r1: null, r2: null, r3: null };
      return copy;
    });

    setFlipped(true);
  }

  function setRoll(frameIdx: number, roll: 1 | 2 | 3, value: number) {
    setFrames(prev => {
      const copy = [...prev];
      const frameNum = frameIdx + 1;
      const f = { ...copy[frameIdx] };

      if (roll === 1) {
        f.r1 = value;
        f.r2 = null;
        f.r3 = null;
      } else if (roll === 2) {
        f.r2 = value;
        f.r3 = null;
      } else {
        f.r3 = value;
      }

      // Persist cookies immediately
      if (f.r1 !== null) setCookie(keyFor(frameNum, 1), String(f.r1)); else deleteCookie(keyFor(frameNum, 1));
      if (f.r2 !== null) setCookie(keyFor(frameNum, 2), String(f.r2)); else deleteCookie(keyFor(frameNum, 2));
      if (f.r3 !== null) setCookie(keyFor(frameNum, 3), String(f.r3)); else deleteCookie(keyFor(frameNum, 3));

      copy[frameIdx] = f;
      return copy;
    });
  }

  function canSubmitFrame(frameNum: number, f: Frame) {
    // sequential entry: must choose r1 before r2 before r3
    if (f.r1 === null) return false;

    if (frameNum < 10 && f.r1 === 10) return true; // strike ends

    if (f.r2 === null) return false;

    if (frameNum < 10 && f.r1 + f.r2 === 10) return true; // spare ends (only via first two)

    // 10th always needs r3; open frames need r3
    return f.r3 !== null;
  }

  function submitFrame() {
    // Only flip back if this frame is currently valid/complete
    const f = frames[carouselIndex];
    if (!canSubmitFrame(viewingFrameNum, f)) return;

    setFlipped(false);

    // If we just completed the "current frame", advance carousel to next incomplete frame
    setCarouselIndex(prev => {
      const nextIdx = nextFrameIndex(frames.map((fr, i) => (i === carouselIndex ? f : fr)));
      return nextIdx;
    });
  }

  function newGame() {
    deleteCookie("game_id");
    for (let i = 1; i <= 10; i++) clearFrameCookies(i);

    const newId = crypto.randomUUID();
    setCookie("game_id", newId);
    setGameId(newId);

    setFrames(Array.from({ length: 10 }, () => ({ r1: null, r2: null, r3: null })));
    setCarouselIndex(0);
    setFlipped(false);
  }

  function submitScore() {
    if (!allComplete) return;

    // For now: just clear cookies and reset (later you’ll send to Supabase)
    deleteCookie("game_id");
    for (let i = 1; i <= 10; i++) clearFrameCookies(i);

    alert("Score submitted! (Storage cleared.)");
    newGame();
  }

  const isFirst = carouselIndex === 0;
  const isLast = carouselIndex === 9;

  function prevCard() {
    if (carouselIndex > 0) {
      setCarouselIndex(carouselIndex - 1);
      setFlipped(false);
    }
  }

  function nextCard() {
    if (carouselIndex < 9) {
      setCarouselIndex(carouselIndex + 1);
      setFlipped(false);
    }
  }

  // Determine strike/spare indicators for FRONT rendering
  const front = (() => {
    const f = viewingFrame;
    const r1 = f.r1;
    const r2 = f.r2;
    const r3 = f.r3;

    const frameNum = viewingFrameNum;

    const strike = frameNum < 10 && r1 === 10;
    const spare = frameNum < 10 && r1 !== null && r2 !== null && r1 !== 10 && r1 + r2 === 10;

    const cum = cumulative[carouselIndex];
    return { strike, spare, r1, r2, r3, cum };
  })();

  // Dropdown option builder
  function options(max: number) {
    return Array.from({ length: max + 1 }, (_, i) => i);
  }

  const max1 = maxPinsFor(viewingFrameNum, 1, viewingFrame);
  const max2 = maxPinsFor(viewingFrameNum, 2, viewingFrame);
  const max3 = maxPinsFor(viewingFrameNum, 3, viewingFrame);

  const roll1Disabled = false;
  const roll2Disabled =
    viewingFrame.r1 === null ||
    (viewingFrameNum < 10 && viewingFrame.r1 === 10);

  const roll3Disabled =
    viewingFrame.r1 === null ||
    viewingFrame.r2 === null ||
    (viewingFrameNum < 10 && viewingFrame.r1 === 10) ||
    (viewingFrameNum < 10 && viewingFrame.r1 !== null && viewingFrame.r2 !== null && viewingFrame.r1 + viewingFrame.r2 === 10);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: CREAM,
        fontFamily: "Montserrat, system-ui",
        padding: "2rem 1rem 3rem",
        color: ORANGE
      }}
    >
      {/* Logo + mission */}
      <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
        <img src="/1@300x.png" alt="Dux Bowling" style={{ maxWidth: 180, width: "100%" }} />
      </div>

      <p
        style={{
          textAlign: "center",
          maxWidth: 700,
          margin: "0 auto 1.75rem",
          color: "#c75a1d",
          fontSize: "1.05rem"
        }}
      >
        Duckpin score entry — swipe through frames and tap to edit.
      </p>

      {/* Fixed arrows (left/right fixed; height follows card center) */}
      <button
        onClick={prevCard}
        disabled={isFirst}
        aria-label="Previous frame"
        style={{
          position: "fixed",
          left: 14,
          top: arrowTop,
          transform: "translateY(-50%)",
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "none",
          background: ORANGE,
          color: "#fff",
          fontSize: "1.5rem",
          opacity: isFirst ? 0.5 : 1,
          cursor: isFirst ? "default" : "pointer",
          zIndex: 50
        }}
      >
        ‹
      </button>

      <button
        onClick={nextCard}
        disabled={isLast}
        aria-label="Next frame"
        style={{
          position: "fixed",
          right: 14,
          top: arrowTop,
          transform: "translateY(-50%)",
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "none",
          background: ORANGE,
          color: "#fff",
          fontSize: "1.5rem",
          opacity: isLast ? 0.5 : 1,
          cursor: isLast ? "default" : "pointer",
          zIndex: 50
        }}
      >
        ›
      </button>

      {/* Card */}
      <div
        ref={cardOuterRef}
        style={{
          maxWidth: 420,
          margin: "0 auto",
          perspective: 1000
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 320,
            transformStyle: "preserve-3d",
            transition: "transform 0.6s",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)"
          }}
        >
          {/* FRONT: classic score sheet look */}
          <div
            onClick={() => {
              // tap card to edit (current or earlier)
              if (!flipped) startEdit();
            }}
            style={{
              position: "absolute",
              inset: 0,
              background: "#fff",
              borderRadius: 14,
              boxShadow: "0 10px 25px rgba(0,0,0,0.10)",
              padding: "1rem",
              backfaceVisibility: "hidden",
              cursor: canOpenEditor ? "pointer" : "default"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h2 style={{ margin: 0, color: ORANGE }}>Frame {viewingFrameNum}</h2>
              <div style={{ fontSize: ".9rem", color: "#7a4b2c" }}>
                {carouselIndex < currentFrameIdx ? "Complete" : carouselIndex === currentFrameIdx ? "Current" : "Locked"}
              </div>
            </div>

            {/* Scoresheet box */}
            <div
              style={{
                marginTop: "1rem",
                border: `2px solid ${ORANGE}`,
                borderRadius: 10,
                overflow: "hidden"
              }}
            >
              {/* top row: roll boxes */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", height: 70 }}>
                {/* Roll 1 */}
                <div
                  style={{
                    position: "relative",
                    borderRight: `2px solid ${ORANGE}`,
                    background: front.strike ? ORANGE : "#fff",
                    color: front.strike ? "#fff" : ORANGE,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.4rem",
                    fontWeight: 700
                  }}
                >
                  {front.strike ? "X" : front.r1 ?? ""}
                </div>

                {/* Roll 2 */}
                <div
                  style={{
                    position: "relative",
                    borderRight: `2px solid ${ORANGE}`,
                    background: front.spare
                      ? `linear-gradient(135deg, rgba(228,106,46,0.18) 50%, transparent 50%)`
                      : "#fff",
                    color: ORANGE,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                    fontWeight: 700
                  }}
                >
                  {front.spare ? "/" : front.r2 ?? ""}
                </div>

                {/* Roll 3 */}
                <div
                  style={{
                    color: ORANGE,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                    fontWeight: 700
                  }}
                >
                  {/* 3rd-ball 10 is NOT spare; show number */}
                  {front.r3 ?? ""}
                </div>
              </div>

              {/* bottom row: cumulative */}
              <div
                style={{
                  height: 80,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: ORANGE,
                  background: "#fff"
                }}
              >
                {front.cum === null ? "—" : front.cum}
              </div>
            </div>

            <div style={{ marginTop: "1rem", textAlign: "center", color: "#7a4b2c", fontSize: ".95rem" }}>
              Tap to {isEditingPrior ? "re-enter" : "enter"} rolls
            </div>
          </div>

          {/* BACK: minimal roll entry (no long instructions) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: ORANGE,
              color: "#fff",
              borderRadius: 14,
              boxShadow: "0 10px 25px rgba(0,0,0,0.10)",
              padding: "1rem",
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>Frame {viewingFrameNum}</h2>

              <div style={{ marginTop: "1rem", display: "grid", gap: ".75rem" }}>
                {/* Roll 1 */}
                <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", alignItems: "center", gap: ".75rem" }}>
                  <div style={{ fontWeight: 700 }}>Roll 1</div>
                  <select
                    value={viewingFrame.r1 ?? ""}
                    onChange={(e) => setRoll(carouselIndex, 1, Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: ".7rem",
                      borderRadius: 10,
                      border: "none",
                      fontSize: "1rem"
                    }}
                  >
                    <option value="" disabled>Select</option>
                    {options(max1).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                {/* Roll 2 */}
                <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", alignItems: "center", gap: ".75rem" }}>
                  <div style={{ fontWeight: 700 }}>Roll 2</div>
                  <select
                    value={viewingFrame.r2 ?? ""}
                    onChange={(e) => setRoll(carouselIndex, 2, Number(e.target.value))}
                    disabled={roll2Disabled}
                    style={{
                      width: "100%",
                      padding: ".7rem",
                      borderRadius: 10,
                      border: "none",
                      fontSize: "1rem",
                      opacity: roll2Disabled ? 0.6 : 1
                    }}
                  >
                    <option value="" disabled>Select</option>
                    {options(max2).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                {/* Roll 3 */}
                <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", alignItems: "center", gap: ".75rem" }}>
                  <div style={{ fontWeight: 700 }}>Roll 3</div>
                  <select
                    value={viewingFrame.r3 ?? ""}
                    onChange={(e) => setRoll(carouselIndex, 3, Number(e.target.value))}
                    disabled={roll3Disabled}
                    style={{
                      width: "100%",
                      padding: ".7rem",
                      borderRadius: 10,
                      border: "none",
                      fontSize: "1rem",
                      opacity: roll3Disabled ? 0.6 : 1
                    }}
                  >
                    <option value="" disabled>Select</option>
                    {options(max3).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={submitFrame}
              disabled={!canSubmitFrame(viewingFrameNum, viewingFrame)}
              style={{
                width: "100%",
                padding: ".85rem",
                borderRadius: 12,
                border: "none",
                background: "#fff",
                color: ORANGE,
                fontSize: "1.05rem",
                fontWeight: 800,
                opacity: canSubmitFrame(viewingFrameNum, viewingFrame) ? 1 : 0.6,
                cursor: canSubmitFrame(viewingFrameNum, viewingFrame) ? "pointer" : "default"
              }}
            >
              Confirm Rolls
            </button>
          </div>
        </div>
      </div>

      {/* Submit / New Game BELOW score card */}
      <div style={{ maxWidth: 420, margin: "1.25rem auto 0", display: "grid", gap: ".75rem" }}>
        <button
          onClick={submitScore}
          disabled={!allComplete}
          style={{
            width: "100%",
            padding: ".85rem",
            borderRadius: 12,
            border: "none",
            background: ORANGE,
            color: "#fff",
            fontSize: "1.05rem",
            fontWeight: 800,
            opacity: allComplete ? 1 : 0.5,
            cursor: allComplete ? "pointer" : "default"
          }}
        >
          Submit Score
        </button>

        <button
          onClick={newGame}
          style={{
            width: "100%",
            padding: ".85rem",
            borderRadius: 12,
            border: `2px solid ${ORANGE}`,
            background: "transparent",
            color: ORANGE,
            fontSize: "1.05rem",
            fontWeight: 800,
            cursor: "pointer"
          }}
        >
          New Game
        </button>

        <div style={{ textAlign: "center", fontSize: ".85rem", color: "#7a4b2c" }}>
          Game ID: {gameId.slice(0, 8)}…
        </div>
      </div>
    </main>
  );
}