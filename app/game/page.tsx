"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Frame = {
  r1: number | null;
  r2: number | null;
  r3: number | null;
};

const ORANGE = "#e46a2e";
const CREAM = "#f5f0e6";

const COOKIE_PREFIX = "dux_test_";
const GAME_ID_COOKIE = `${COOKIE_PREFIX}game_id`;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function frameCookieName(frameIndex0: number, roll: 1 | 2 | 3) {
  // frame1_roll1 ... frame10_roll3
  return `${COOKIE_PREFIX}frame${frameIndex0 + 1}_roll${roll}`;
}

function resetFrameCookies(frameIndex0: number) {
  deleteCookie(frameCookieName(frameIndex0, 1));
  deleteCookie(frameCookieName(frameIndex0, 2));
  deleteCookie(frameCookieName(frameIndex0, 3));
}

/**
 * Duckpin rules (per your latest requirements):
 * - Frames 1–9: up to 3 rolls.
 *   - Strike: r1=10 -> frame ends; strike bonus = next 2 rolls.
 *   - Spare: ONLY if r1+r2=10 (second ball clears) -> frame ends; spare bonus = next 1 roll.
 *   - If total becomes 10 on third ball (r1+r2+r3=10): NOT a spare; NO bonus.
 * - 10th frame: max 3 rolls. No extra rolls ever.
 */
function isStrike(frame: Frame) {
  return frame.r1 === 10;
}

function isSecondBallSpare(frame: Frame) {
  return frame.r1 !== null && frame.r2 !== null && frame.r1 < 10 && frame.r1 + frame.r2 === 10;
}

function isThirdBallTenNoBonus(frame: Frame) {
  return (
    frame.r1 !== null &&
    frame.r2 !== null &&
    frame.r3 !== null &&
    frame.r1 < 10 &&
    frame.r1 + frame.r2 < 10 &&
    frame.r1 + frame.r2 + frame.r3 === 10
  );
}

function frameIsComplete(frame: Frame, frameIndex0: number) {
  // 10th frame still max 3 rolls, ends early on strike or 2-ball spare as well.
  if (frame.r1 === null) return false;

  if (frame.r1 === 10) return true; // strike ends immediately (including 10th)
  if (frame.r2 === null) return false;

  if (frame.r1 + frame.r2 === 10) return true; // 2-ball spare ends immediately (including 10th)
  if (frameIndex0 === 9) {
    // 10th frame: allow third roll only if needed; ends after r3 OR earlier if open after r2 (still can roll 3 in duckpin?).
    // In duckpin, you may take a 3rd ball if pins remain after two balls. If open after two, third is allowed.
    // So for 10th: if not strike/spare, you can complete with r3 (but not required if you want to record fewer—here we require it if pins remained).
    // We'll consider it complete only once r3 is set when not strike/spare.
    return frame.r3 !== null;
  }

  // frames 1-9: if not strike/spare after two, allow 3rd only if pins remain; consider complete when:
  // - r3 recorded OR
  // - pins fell in 2 rolls total <10 AND you still must take 3rd? In duckpin, you CAN take third ball if pins remain.
  // We'll require r3 to complete when not strike/spare (pins remain).
  return frame.r3 !== null;
}

function rollSequence(frames: Frame[]) {
  // Flatten respecting that strike uses 1 roll, 2-ball spare uses 2 rolls, otherwise 3 rolls (or fewer if not entered yet).
  const seq: number[] = [];
  frames.forEach((f, idx) => {
    if (f.r1 !== null) seq.push(f.r1);
    if (f.r2 !== null) seq.push(f.r2);
    // include r3 if present (even for 10th)
    if (f.r3 !== null) seq.push(f.r3);
  });
  return seq;
}

function computeCumulativeScores(frames: Frame[]) {
  // Returns cumulative per frame (length 10), null if not yet determinable for a frame (waiting on bonuses/rolls).
  const cumul: (number | null)[] = Array(10).fill(null);

  // Build a flat list of rolls to reference bonuses.
  const flat: number[] = [];
  const frameStartRollIndex: number[] = []; // roll index in flat at frame start
  frames.forEach((f, i) => {
    frameStartRollIndex[i] = flat.length;
    if (f.r1 !== null) flat.push(f.r1);
    if (f.r2 !== null) flat.push(f.r2);
    if (f.r3 !== null) flat.push(f.r3);
  });

  let running = 0;

  for (let i = 0; i < 10; i++) {
    const f = frames[i];
    const start = frameStartRollIndex[i];

    // If frame not complete, cannot show its cumulative.
    if (!frameIsComplete(f, i)) {
      cumul[i] = null;
      continue;
    }

    // Strike
    if (isStrike(f)) {
      const b1 = flat[start + 1];
      const b2 = flat[start + 2];
      if (b1 === undefined || b2 === undefined) {
        cumul[i] = null; // waiting for bonus rolls
        continue;
      }
      running += 10 + b1 + b2;
      cumul[i] = running;
      continue;
    }

    // Second-ball spare ONLY (your rule)
    if (isSecondBallSpare(f)) {
      const b = flat[start + 2]; // next roll after the 2-roll frame
      if (b === undefined) {
        cumul[i] = null; // waiting for bonus roll
        continue;
      }
      running += 10 + b;
      cumul[i] = running;
      continue;
    }

    // Third-ball 10 is NOT spare: NO bonus
    if (isThirdBallTenNoBonus(f)) {
      running += 10;
      cumul[i] = running;
      continue;
    }

    // Open frame: sum of its entered rolls (1-9 will have 3 rolls; 10th also 3 if open)
    const sum =
      (f.r1 ?? 0) + (f.r2 ?? 0) + (f.r3 ?? 0);
    running += sum;
    cumul[i] = running;
  }

  return cumul;
}

function makeEmptyFrames(): Frame[] {
  return Array.from({ length: 10 }, () => ({ r1: null, r2: null, r3: null }));
}

function uuidLike() {
  // good enough for a cookie game id without importing crypto in SSR contexts
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function GamePage() {
  const cardWrapRef = useRef<HTMLDivElement | null>(null);

  // Load or create game id
  const [gameId, setGameId] = useState<string>("");

  const [frames, setFrames] = useState<Frame[]>(makeEmptyFrames());
  const [index, setIndex] = useState(0); // frame being viewed (0-9)
  const [flipped, setFlipped] = useState(false);

  // Arrow vertical alignment with the card (fixed left/right, but top follows card position)
  const [arrowTop, setArrowTop] = useState<number>(240);

  // Load cookies on mount
  useEffect(() => {
    // game id
    const existing = getCookie(GAME_ID_COOKIE);
    const id = existing ?? uuidLike();
    setGameId(id);
    if (!existing) setCookie(GAME_ID_COOKIE, id);

    // frame/roll cookies
    const loaded = makeEmptyFrames();
    for (let f = 0; f < 10; f++) {
      for (let r: 1 | 2 | 3 = 1 as 1; r <= 3; r = (r + 1) as 1 | 2 | 3) {
        const v = getCookie(frameCookieName(f, r));
        if (v !== null && v !== "") {
          const n = Number(v);
          if (!Number.isNaN(n)) {
            if (r === 1) loaded[f].r1 = n;
            if (r === 2) loaded[f].r2 = n;
            if (r === 3) loaded[f].r3 = n;
          }
        }
      }
    }
    setFrames(loaded);
  }, []);

  // Keep arrows aligned to the card as the user scrolls / resizes
  useEffect(() => {
    const update = () => {
      if (!cardWrapRef.current) return;
      const rect = cardWrapRef.current.getBoundingClientRect();
      setArrowTop(rect.top + rect.height / 2);
    };

    update();
    const onScroll = () => update();
    const onResize = () => update();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Determine the "current frame" as first incomplete frame
  const currentFrameIndex = useMemo(() => {
    for (let i = 0; i < 10; i++) {
      if (!frameIsComplete(frames[i], i)) return i;
    }
    return 9;
  }, [frames]);

  const cumul = useMemo(() => computeCumulativeScores(frames), [frames]);

  const isFirst = index === 0;
  const isLast = index === 9;

  // Editing rules:
  // - You can enter the current frame or edit prior frames.
  const canEditThisFrame = index <= currentFrameIndex;

  function prev() {
    if (index > 0) {
      setIndex(index - 1);
      setFlipped(false);
    }
  }

  function next() {
    if (index < 9) {
      setIndex(index + 1);
      setFlipped(false);
    }
  }

  // Back-side entry state is derived from frames[index], but we enforce "must re-enter from roll 1 when editing".
  // So when user flips to edit, we reset that frame first.
  function beginEditFrame(frameIdx0: number) {
    if (!canEditThisFrame) return;

    // Reset ALL cookies for that frame and in-memory rolls for that frame (your requirement)
    resetFrameCookies(frameIdx0);

    setFrames(prev => {
      const copy = prev.map(f => ({ ...f }));
      copy[frameIdx0] = { r1: null, r2: null, r3: null };
      return copy;
    });

    setFlipped(true);
  }

  function setRoll(frameIdx0: number, roll: 1 | 2 | 3, value: number | null) {
    setFrames(prev => {
      const copy = prev.map(f => ({ ...f }));
      const f = copy[frameIdx0];

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

      return copy;
    });

    // Persist cookies (null clears)
    const name = frameCookieName(frameIdx0, roll);
    if (value === null) deleteCookie(name);
    else setCookie(name, String(value));
    // Also clear downstream rolls cookies when resetting a roll
    if (roll === 1) {
      deleteCookie(frameCookieName(frameIdx0, 2));
      deleteCookie(frameCookieName(frameIdx0, 3));
    }
    if (roll === 2) {
      deleteCookie(frameCookieName(frameIdx0, 3));
    }
  }

  function maxPinsForRoll(frameIdx0: number, roll: 1 | 2 | 3) {
    const f = frames[frameIdx0];
    const r1 = f.r1 ?? 0;
    const r2 = f.r2 ?? 0;

    if (roll === 1) return 10;

    // strike ends frame; we shouldn't even allow roll2/3
    if (f.r1 === 10) return 0;

    if (roll === 2) {
      return Math.max(0, 10 - r1);
    }

    // roll === 3
    // If second-ball spare ends frame (r1+r2=10), no third roll.
    if (f.r1 !== null && f.r2 !== null && f.r1 + f.r2 === 10) return 0;

    return Math.max(0, 10 - (r1 + r2));
  }

  function dropdownOptions(maxPins: number) {
    return Array.from({ length: maxPins + 1 }, (_, i) => i);
  }

  function canPickRoll2(frameIdx0: number) {
    const f = frames[frameIdx0];
    return f.r1 !== null && f.r1 !== 10;
  }

  function canPickRoll3(frameIdx0: number) {
    const f = frames[frameIdx0];
    if (f.r1 === null || f.r2 === null) return false;
    if (f.r1 === 10) return false;
    if (f.r1 + f.r2 === 10) return false; // spare ends frame
    return true;
  }

  function canSubmitFrame(frameIdx0: number) {
    const f = frames[frameIdx0];
    return frameIsComplete(f, frameIdx0);
  }

  function submitFrameAndFlip() {
    // If they are on a prior frame or current, just flip back to show the front.
    setFlipped(false);
  }

  function newGame() {
    // Clear all cookies
    deleteCookie(GAME_ID_COOKIE);
    for (let f = 0; f < 10; f++) resetFrameCookies(f);

    const id = uuidLike();
    setCookie(GAME_ID_COOKIE, id);
    setGameId(id);

    setFrames(makeEmptyFrames());
    setIndex(0);
    setFlipped(false);
  }

  function submitScore() {
    // For now: just clears cookies and resets (per your request)
    // Later: send to Supabase.
    deleteCookie(GAME_ID_COOKIE);
    for (let f = 0; f < 10; f++) resetFrameCookies(f);
    setFrames(makeEmptyFrames());
    setIndex(0);
    setFlipped(false);
  }

  const f = frames[index];
  const cumScoreThisFrame = cumul[index];

  // Score-sheet style roll boxes
  const strike = isStrike(f);
  const spare2 = isSecondBallSpare(f);
  const thirdTen = isThirdBallTenNoBonus(f);

  // Display marks:
  // - Strike: "X" in first box
  // - Spare (2-ball only): triangle marker in second box
  // - Third-ball 10: no spare marker; just show numbers and total.
  function RollBox({
    value,
    isStrikeBox,
    isSpareTriangle
  }: {
    value: string;
    isStrikeBox?: boolean;
    isSpareTriangle?: boolean;
  }) {
    return (
      <div
        style={{
          width: 34,
          height: 26,
          border: `1px solid ${ORANGE}`,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          fontWeight: 700,
          color: ORANGE,
          background: "#fff"
        }}
      >
        {isStrikeBox ? "X" : value}
        {isSpareTriangle ? (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: 0,
              height: 0,
              borderTop: `12px solid rgba(228,106,46,0.35)`,
              borderLeft: `12px solid transparent`,
              borderBottom: `12px solid transparent`,
              borderRight: `0px solid transparent`
            }}
          />
        ) : null}
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: CREAM,
        fontFamily: "Montserrat, system-ui",
        padding: "1.5rem 1rem 3rem",
        color: ORANGE
      }}
    >
      {/* Top (logo + subtle title) */}
      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <img
          src="/1@300x.png"
          alt="Dux Bowling"
          style={{ maxWidth: 140, width: "100%", height: "auto" }}
        />
      </div>

      <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
        <div style={{ fontWeight: 800, letterSpacing: "0.04em" }}>Duckpin Game</div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>
          Game ID: {gameId || "—"}
        </div>
      </div>

      {/* Fixed arrows (left/right fixed, vertical aligned to card) */}
      <button
        onClick={prev}
        disabled={isFirst}
        aria-label="Previous frame"
        style={{
          position: "fixed",
          left: 12,
          top: arrowTop,
          transform: "translateY(-50%)",
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "none",
          background: ORANGE,
          color: "#fff",
          fontSize: 26,
          opacity: isFirst ? 0.5 : 1,
          cursor: isFirst ? "default" : "pointer",
          zIndex: 50
        }}
      >
        ‹
      </button>

      <button
        onClick={next}
        disabled={isLast}
        aria-label="Next frame"
        style={{
          position: "fixed",
          right: 12,
          top: arrowTop,
          transform: "translateY(-50%)",
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "none",
          background: ORANGE,
          color: "#fff",
          fontSize: 26,
          opacity: isLast ? 0.5 : 1,
          cursor: isLast ? "default" : "pointer",
          zIndex: 50
        }}
      >
        ›
      </button>

      {/* Card */}
      <div
        ref={cardWrapRef}
        style={{
          maxWidth: 360,
          margin: "0 auto",
          perspective: 1200
        }}
      >
        <div
          onClick={() => {
            // Tap card: if front -> begin edit; if back -> do nothing (use submit button)
            if (!flipped) {
              if (canEditThisFrame) beginEditFrame(index);
            }
          }}
          style={{
            width: "100%",
            height: 260,
            cursor: canEditThisFrame ? "pointer" : "default"
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
            {/* FRONT (score sheet look) */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#fff",
                borderRadius: 14,
                padding: "1rem",
                backfaceVisibility: "hidden",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>Frame {index + 1}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {index < currentFrameIndex ? "Completed" : index === currentFrameIndex ? "Current" : "Locked"}
                </div>
              </div>

              {/* Roll boxes row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 6 }}>
                <RollBox
                  value={f.r1 === null ? "" : String(f.r1)}
                  isStrikeBox={strike}
                />

                <RollBox
                  value={
                    f.r2 === null || strike ? "" : String(f.r2)
                  }
                  isSpareTriangle={spare2}
                />

                <RollBox
                  value={
                    f.r3 === null || strike || spare2 ? "" : String(f.r3)
                  }
                />
              </div>

              {/* Notes (tiny) */}
              <div style={{ textAlign: "center", fontSize: 12, opacity: 0.85, marginTop: 2 }}>
                {strike
                  ? "Strike (+ next 2 rolls)"
                  : spare2
                  ? "Spare (+ next 1 roll)"
                  : thirdTen
                  ? "Ten on 3rd (no bonus)"
                  : ""}
              </div>

              {/* Cumulative */}
              <div
                style={{
                  marginTop: 6,
                  borderTop: `1px solid rgba(228,106,46,0.25)`,
                  paddingTop: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ fontWeight: 800 }}>Cumulative</div>
                <div style={{ fontWeight: 900, fontSize: 22 }}>
                  {cumScoreThisFrame === null ? "—" : cumScoreThisFrame}
                </div>
              </div>

              {!canEditThisFrame && (
                <div style={{ textAlign: "center", fontSize: 12, opacity: 0.7 }}>
                  Complete earlier frames first
                </div>
              )}
            </div>

            {/* BACK (entry, minimal text) */}
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
                boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontWeight: 900, fontSize: 18, textAlign: "center" }}>
                Frame {index + 1}
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {/* Roll 1 */}
                <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 800 }}>Roll 1</div>
                  <select
                    value={f.r1 === null ? "" : String(f.r1)}
                    onChange={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);
                      setRoll(index, 1, v);
                    }}
                    style={{
                      width: 120,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "none",
                      fontWeight: 800
                    }}
                  >
                    <option value="">—</option>
                    {dropdownOptions(10).map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* Roll 2 */}
                <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 800 }}>Roll 2</div>
                  <select
                    disabled={!canPickRoll2(index)}
                    value={f.r2 === null ? "" : String(f.r2)}
                    onChange={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);
                      setRoll(index, 2, v);
                    }}
                    style={{
                      width: 120,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "none",
                      fontWeight: 800,
                      opacity: canPickRoll2(index) ? 1 : 0.6
                    }}
                  >
                    <option value="">—</option>
                    {dropdownOptions(maxPinsForRoll(index, 2)).map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* Roll 3 */}
                <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 800 }}>Roll 3</div>
                  <select
                    disabled={!canPickRoll3(index)}
                    value={f.r3 === null ? "" : String(f.r3)}
                    onChange={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);
                      setRoll(index, 3, v);
                    }}
                    style={{
                      width: 120,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "none",
                      fontWeight: 800,
                      opacity: canPickRoll3(index) ? 1 : 0.6
                    }}
                  >
                    <option value="">—</option>
                    {dropdownOptions(maxPinsForRoll(index, 3)).map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <button
                  onClick={submitFrameAndFlip}
                  disabled={!canSubmitFrame(index)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "none",
                    background: "#fff",
                    color: ORANGE,
                    fontWeight: 900,
                    fontSize: 16,
                    opacity: canSubmitFrame(index) ? 1 : 0.6,
                    cursor: canSubmitFrame(index) ? "pointer" : "default"
                  }}
                >
                  Save Frame
                </button>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={submitScore}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.8)",
                      background: "transparent",
                      color: "#fff",
                      fontWeight: 800
                    }}
                  >
                    Submit Score
                  </button>

                  <button
                    onClick={newGame}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.8)",
                      background: "transparent",
                      color: "#fff",
                      fontWeight: 800
                    }}
                  >
                    New Game
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tiny hint row for tap behavior */}
        <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, opacity: 0.75 }}>
          Tap the card to edit (current or earlier frames).
        </div>
      </div>
    </main>
  );
}