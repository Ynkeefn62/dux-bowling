"use client";

import { useEffect, useMemo, useState } from "react";

type FrameRolls = {
  r1: number | null;
  r2: number | null;
  r3: number | null; // (kept to 3 for cookie scheme)
};

const ORANGE = "#e46a2e";
const CREAM = "#f5f0e6";
const TEXT_ORANGE = "#c75a1d";

const COOKIE_PREFIX = ""; // keep simple, keys are game_id, frameX_rollY

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp("(^| )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]+)")
  );
  return match ? decodeURIComponent(match[2]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function frameKey(frameNumber: number, rollNumber: 1 | 2 | 3) {
  return `${COOKIE_PREFIX}frame${frameNumber}_roll${rollNumber}`;
}

function createEmptyFrames(): FrameRolls[] {
  return Array.from({ length: 10 }, () => ({ r1: null, r2: null, r3: null }));
}

/**
 * Duckpin frame interpretation with 3-roll storage.
 * Frames 1-9:
 *  - Strike (r1=10) ends frame immediately.
 *  - Spare can happen by roll2 or roll3 if total reaches 10.
 *  - Otherwise open frame total < 10 after up to 3 rolls.
 *
 * Frame 10:
 *  - If strike on roll1, roll2 and roll3 are bonus rolls (each 0-10).
 *  - If spare by roll2, roll3 is bonus roll (0-10).
 *  - Otherwise roll3 limited by remaining pins to max 10 total.
 */
function allowedMaxPinsForNextRoll(
  frameIndex: number,
  current: FrameRolls
): { nextRoll: 1 | 2 | 3 | null; maxPins: number } {
  const frameNumber = frameIndex + 1;
  const isTenth = frameNumber === 10;

  // Determine next roll
  let nextRoll: 1 | 2 | 3 | null = null;
  if (current.r1 === null) nextRoll = 1;
  else if (current.r2 === null) nextRoll = 2;
  else if (current.r3 === null) nextRoll = 3;
  else nextRoll = null;

  if (!nextRoll) return { nextRoll: null, maxPins: 0 };

  // STRIKE handling
  if (!isTenth && nextRoll !== 1 && current.r1 === 10) {
    // frame ended; no more rolls allowed
    return { nextRoll: null, maxPins: 0 };
  }

  // Compute remaining pins (normal rule)
  const r1 = current.r1 ?? 0;
  const r2 = current.r2 ?? 0;
  const r3 = current.r3 ?? 0;
  const sum12 = r1 + r2;
  const sum123 = r1 + r2 + r3;

  if (!isTenth) {
    // Frame 1-9
    if (current.r1 === 10) return { nextRoll: null, maxPins: 0 }; // strike ends frame
    if (nextRoll === 2) return { nextRoll, maxPins: Math.max(0, 10 - r1) };
    // roll3 allowed only if still <10 after roll2
    if (sum12 >= 10) return { nextRoll: null, maxPins: 0 };
    return { nextRoll, maxPins: Math.max(0, 10 - sum12) };
  }

  // Frame 10 special
  if (nextRoll === 2) {
    // If strike on roll1, roll2 is bonus roll (0-10)
    if (current.r1 === 10) return { nextRoll, maxPins: 10 };
    return { nextRoll, maxPins: Math.max(0, 10 - r1) };
  }

  // nextRoll === 3
  if (current.r1 === 10) {
    // strike in 10th: roll3 bonus (0-10)
    return { nextRoll, maxPins: 10 };
  }
  if (current.r1 !== null && current.r2 !== null && sum12 === 10) {
    // spare by roll2: roll3 bonus (0-10)
    return { nextRoll, maxPins: 10 };
  }
  // otherwise normal remaining to max 10 total
  return { nextRoll, maxPins: Math.max(0, 10 - sum12) };
}

function isStrike(frameNumber: number, f: FrameRolls) {
  // In duckpin, strike is still 10 on first ball.
  return f.r1 === 10;
}

function isSpare(frameNumber: number, f: FrameRolls) {
  const r1 = f.r1 ?? 0;
  const r2 = f.r2 ?? 0;
  const r3 = f.r3 ?? 0;
  if (f.r1 === 10) return false; // strike not spare
  // spare can happen by roll2 or roll3 (total 10)
  if (f.r1 !== null && f.r2 !== null && r1 + r2 === 10) return true;
  if (f.r1 !== null && f.r2 !== null && f.r3 !== null && r1 + r2 + r3 === 10) return true;
  return false;
}

function frameCompleted(frameNumber: number, f: FrameRolls) {
  const tenth = frameNumber === 10;
  if (!tenth) {
    if (f.r1 === 10) return true;
    if (f.r1 === null || f.r2 === null) return false;
    const sum12 = (f.r1 ?? 0) + (f.r2 ?? 0);
    if (sum12 >= 10) return true; // spare by roll2 ends frame
    return f.r3 !== null; // otherwise needs roll3
  } else {
    // 10th: we keep 3 rolls total in this MVP cookie scheme.
    // Frame completes when r1,r2,r3 all filled OR if strike/spare logic doesn't require r3? (we still allow r3 but not require)
    if (f.r1 === null || f.r2 === null) return false;
    // If open and sum12 <10, we require r3
    const sum12 = (f.r1 ?? 0) + (f.r2 ?? 0);
    if (f.r1 !== 10 && sum12 < 10) return f.r3 !== null;
    // If strike or spare by roll2, r3 is a bonus (allowed but not required). We'll treat completed once r2 entered.
    return true;
  }
}

/**
 * Score duckpin using:
 *  - Strike bonus: next 2 balls
 *  - Spare bonus: next 1 ball (spare can be by roll2 or roll3)
 *  - Open: sum of rolls in frame (up to 3)
 *
 * For incomplete games, returns:
 *  - frameTotals: per-frame cumulative if determinable, else null
 */
function computeDuckpinCumulatives(frames: FrameRolls[]) {
  // Build a "roll stream" and a mapping from each frame to its roll indices
  const rollStream: number[] = [];
  const frameRollIndexStart: number[] = []; // start index in rollStream for each frame

  for (let i = 0; i < 10; i++) {
    const frameNumber = i + 1;
    const f = frames[i];
    frameRollIndexStart[i] = rollStream.length;

    // Construct frame rolls for scoring stream
    if (frameNumber !== 10) {
      if (f.r1 === null) continue;
      rollStream.push(f.r1);
      if (f.r1 === 10) continue; // strike ends frame
      if (f.r2 === null) continue;
      rollStream.push(f.r2);
      const sum12 = f.r1 + f.r2;
      if (sum12 >= 10) continue; // spare by roll2 ends frame
      if (f.r3 === null) continue;
      rollStream.push(f.r3);
    } else {
      // 10th: include whatever is set; for bonus we allow r3 optional
      if (f.r1 === null) continue;
      rollStream.push(f.r1);
      if (f.r2 === null) continue;
      rollStream.push(f.r2);
      if (f.r3 !== null) rollStream.push(f.r3);
    }
  }

  // Now compute frame-by-frame totals + cumulative
  const frameCum: (number | null)[] = Array(10).fill(null);

  let total = 0;
  let streamIndex = 0;

  for (let i = 0; i < 10; i++) {
    const frameNumber = i + 1;
    const f = frames[i];

    // If no first roll, frame not started
    if (f.r1 === null) break;

    const r1 = f.r1 ?? 0;
    const r2 = f.r2 ?? 0;
    const r3 = f.r3 ?? 0;

    // Determine how many rolls this frame uses in the rollStream
    let rollsUsed = 0;
    if (frameNumber !== 10) {
      if (r1 === 10) rollsUsed = 1;
      else if (f.r2 === null) rollsUsed = 0;
      else if (r1 + r2 >= 10) rollsUsed = 2;
      else if (f.r3 === null) rollsUsed = 0;
      else rollsUsed = 3;
    } else {
      // tenth: at least 2 rolls to have a "frame" in our MVP
      if (f.r2 === null) rollsUsed = 0;
      else rollsUsed = f.r3 === null ? 2 : 3;
    }

    if (rollsUsed === 0) break;

    // strike
    if (r1 === 10) {
      const b1 = rollStream[streamIndex + 1];
      const b2 = rollStream[streamIndex + 2];
      if (b1 === undefined || b2 === undefined) {
        frameCum[i] = null;
        break;
      }
      total += 10 + b1 + b2;
      frameCum[i] = total;
      streamIndex += 1;
      continue;
    }

    // spare (by roll2 or roll3)
    const sum12 = r1 + r2;
    const sum123 = r1 + r2 + r3;

    const spareBy2 = f.r2 !== null && sum12 === 10;
    const spareBy3 = f.r3 !== null && sum123 === 10;

    if (spareBy2 || spareBy3) {
      const bonusIndex = streamIndex + (spareBy2 ? 2 : 3);
      const b = rollStream[bonusIndex];
      if (b === undefined) {
        frameCum[i] = null;
        break;
      }
      total += 10 + b;
      frameCum[i] = total;
      streamIndex += spareBy2 ? 2 : 3;
      continue;
    }

    // open
    total += sum123; // r3 may be 0 if not set, but rollsUsed ensures it's set when needed
    frameCum[i] = total;
    streamIndex += rollsUsed;
  }

  return frameCum;
}

function classicRollBoxStyle(base?: React.CSSProperties): React.CSSProperties {
  return {
    width: 34,
    height: 34,
    border: `1px solid rgba(0,0,0,0.15)`,
    borderRadius: 6,
    display: "grid",
    placeItems: "center",
    fontWeight: 700,
    color: TEXT_ORANGE,
    background: "#fff",
    ...base
  };
}

function triangleSpareBackground(): React.CSSProperties {
  // half-shaded triangle in the top-right corner
  return {
    background:
      "linear-gradient(135deg, rgba(228,106,46,0.35) 0%, rgba(228,106,46,0.35) 50%, transparent 50%, transparent 100%)"
  };
}

export default function GamePage() {
  const [carouselIndex, setCarouselIndex] = useState(0); // 0..9
  const [flippedFrame, setFlippedFrame] = useState<number | null>(null); // which frame is flipped (0..9) or null
  const [frames, setFrames] = useState<FrameRolls[]>(createEmptyFrames());
  const [gameId, setGameId] = useState<string>("");

  // Load cookies on mount
  useEffect(() => {
    const existingId = getCookie("game_id");
    if (existingId) setGameId(existingId);
    else {
      const newId = crypto.randomUUID();
      setGameId(newId);
      setCookie("game_id", newId);
    }

    const loaded = createEmptyFrames();
    for (let f = 1; f <= 10; f++) {
      for (let r = 1 as 1 | 2 | 3; r <= 3; r = (r + 1) as 1 | 2 | 3) {
        const v = getCookie(frameKey(f, r));
        loaded[f - 1][`r${r}` as "r1" | "r2" | "r3"] = v === null ? null : Number(v);
      }
    }
    setFrames(loaded);
  }, []);

  const cumulatives = useMemo(() => computeDuckpinCumulatives(frames), [frames]);

  const currentFrameIndex = useMemo(() => {
    // First frame that is not completed (by our frameCompleted rules), else 9
    for (let i = 0; i < 10; i++) {
      if (!frameCompleted(i + 1, frames[i])) return i;
    }
    return 9;
  }, [frames]);

  const canEditFrame = (frameIdx: number) => frameIdx <= currentFrameIndex;

  const isFirst = carouselIndex === 0;
  const isLast = carouselIndex === 9;

  function goPrev() {
    if (carouselIndex > 0) {
      setFlippedFrame(null);
      setCarouselIndex(carouselIndex - 1);
    }
  }

  function goNext() {
    if (carouselIndex < 9) {
      setFlippedFrame(null);
      setCarouselIndex(carouselIndex + 1);
    }
  }

  function resetFrame(frameIdx: number) {
    const frameNumber = frameIdx + 1;
    // Clear cookies for the entire frame (prevents stale roll3, etc.)
    deleteCookie(frameKey(frameNumber, 1));
    deleteCookie(frameKey(frameNumber, 2));
    deleteCookie(frameKey(frameNumber, 3));

    setFrames(prev => {
      const copy = [...prev];
      copy[frameIdx] = { r1: null, r2: null, r3: null };
      return copy;
    });
  }

  function setRoll(frameIdx: number, roll: 1 | 2 | 3, pins: number | null) {
    const frameNumber = frameIdx + 1;
    const key = frameKey(frameNumber, roll);

    if (pins === null) deleteCookie(key);
    else setCookie(key, String(pins));

    setFrames(prev => {
      const copy = [...prev];
      const f = { ...copy[frameIdx] };

      // When editing, enforce "must re-enter from roll1":
      // we will only allow setting roll N if all prior rolls are set.
      if (roll === 1) {
        f.r1 = pins;
        f.r2 = null;
        f.r3 = null;
        // also clear cookies for roll2/3
        deleteCookie(frameKey(frameNumber, 2));
        deleteCookie(frameKey(frameNumber, 3));
      } else if (roll === 2) {
        f.r2 = pins;
        f.r3 = null;
        deleteCookie(frameKey(frameNumber, 3));
      } else {
        f.r3 = pins;
      }

      copy[frameIdx] = f;
      return copy;
    });
  }

  function submitScore() {
    // Clear all cookies and reset state
    deleteCookie("game_id");
    for (let f = 1; f <= 10; f++) {
      deleteCookie(frameKey(f, 1));
      deleteCookie(frameKey(f, 2));
      deleteCookie(frameKey(f, 3));
    }
    const newId = crypto.randomUUID();
    setCookie("game_id", newId);
    setGameId(newId);
    setFrames(createEmptyFrames());
    setFlippedFrame(null);
    setCarouselIndex(0);
  }

  function newGame() {
    // Same behavior per your request
    submitScore();
  }

  const activeFrame = frames[carouselIndex];
  const frameNumber = carouselIndex + 1;
  const tenth = frameNumber === 10;

  const strike = isStrike(frameNumber, activeFrame);
  const spare = isSpare(frameNumber, activeFrame);

  const { nextRoll, maxPins } = allowedMaxPinsForNextRoll(carouselIndex, activeFrame);

  const rollOptions = useMemo(() => Array.from({ length: maxPins + 1 }, (_, i) => i), [maxPins]);

  const editable = canEditFrame(carouselIndex);

  function flipToBack() {
    if (!editable) return;
    // If editing a prior frame, reset that frame first (as requested)
    if (carouselIndex < currentFrameIndex) {
      resetFrame(carouselIndex);
    }
    setFlippedFrame(carouselIndex);
  }

  function flipToFront() {
    setFlippedFrame(null);
  }

  const isFlipped = flippedFrame === carouselIndex;

  // Determine roll symbols for the score-sheet front
  const r1 = activeFrame.r1;
  const r2 = activeFrame.r2;
  const r3 = activeFrame.r3;

  // spare completion roll index (2 or 3) for styling
  const spareBy2 = r1 !== null && r2 !== null && r1 !== 10 && r1 + r2 === 10;
  const spareBy3 =
    r1 !== null &&
    r2 !== null &&
    r3 !== null &&
    r1 !== 10 &&
    r1 + r2 < 10 &&
    r1 + r2 + r3 === 10;

  const frameCum = cumulatives[carouselIndex];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: CREAM,
        fontFamily: "Montserrat, system-ui",
        padding: "2rem",
        color: TEXT_ORANGE
      }}
    >
      {/* Header (logo + mission) */}
      <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
        <img src="/1@300x.png" alt="Dux Bowling" style={{ maxWidth: 180, width: "100%" }} />
      </div>

      <p
        style={{
          textAlign: "center",
          maxWidth: 720,
          margin: "0 auto 2rem",
          color: TEXT_ORANGE,
          fontSize: "1.05rem",
          lineHeight: 1.6
        }}
      >
        Enter your rolls frame-by-frame. Tap a frame to enter pins.
      </p>

      {/* Fixed arrows (same “fixed-to-screen” behavior as menu/login) */}
      <button
        onClick={goPrev}
        disabled={isFirst}
        aria-label="Previous frame"
        style={{
          position: "fixed",
          left: 16,
          top: "50%",
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
          zIndex: 20
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
          top: "50%",
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
          zIndex: 20
        }}
      >
        ›
      </button>

      {/* Card */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          onClick={() => (isFlipped ? undefined : flipToBack())}
          style={{
            width: 340,
            height: 260,
            perspective: 1000,
            cursor: editable ? "pointer" : "not-allowed"
          }}
          title={!editable ? "You can only edit current or prior frames." : "Tap to enter pins"}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              transformStyle: "preserve-3d",
              transition: "transform 0.6s",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
            }}
          >
            {/* FRONT: Classic-ish scoresheet */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#fff",
                borderRadius: 14,
                padding: "1.2rem 1.2rem 1rem",
                backfaceVisibility: "hidden",
                boxShadow: "0 10px 25px rgba(0,0,0,0.10)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h2 style={{ color: ORANGE, margin: 0 }}>Frame {frameNumber}</h2>
                <span style={{ fontSize: ".9rem", opacity: 0.9 }}>
                  {editable ? "Tap to enter" : "Locked"}
                </span>
              </div>

              {/* Roll boxes */}
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
                {/* Roll 1 */}
                <div
                  style={classicRollBoxStyle(
                    strike
                      ? { background: "rgba(228,106,46,0.18)", borderColor: "rgba(228,106,46,0.5)" }
                      : undefined
                  )}
                >
                  {r1 === null ? "" : strike ? "X" : r1}
                </div>

                {/* Roll 2 */}
                <div
                  style={classicRollBoxStyle(
                    spareBy2
                      ? { ...triangleSpareBackground(), borderColor: "rgba(228,106,46,0.5)" }
                      : undefined
                  )}
                >
                  {r2 === null ? "" : spareBy2 ? "/" : r2}
                </div>

                {/* Roll 3 */}
                <div
                  style={classicRollBoxStyle(
                    spareBy3
                      ? { ...triangleSpareBackground(), borderColor: "rgba(228,106,46,0.5)" }
                      : tenth && r1 === 10
                      ? { background: "rgba(228,106,46,0.06)" }
                      : undefined
                  )}
                >
                  {r3 === null ? "" : spareBy3 ? "/" : r3}
                </div>
              </div>

              {/* Cumulative score */}
              <div
                style={{
                  marginTop: 18,
                  borderTop: "1px solid rgba(0,0,0,0.08)",
                  paddingTop: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span style={{ fontWeight: 700 }}>Cumulative</span>
                <span style={{ fontSize: "1.35rem", fontWeight: 800, color: ORANGE }}>
                  {frameCum === null ? "—" : frameCum}
                </span>
              </div>

              <div style={{ fontSize: ".85rem", opacity: 0.85 }}>
                {strike
                  ? "Strike (bonus: next 2 balls)"
                  : spare
                  ? "Spare (bonus: next 1 ball)"
                  : "Open frame"}
                {tenth ? " · 10th frame rules apply" : ""}
              </div>
            </div>

            {/* BACK: Roll entry UI */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: ORANGE,
                color: "#fff",
                borderRadius: 14,
                padding: "1.2rem",
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.10)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
              onClick={e => e.stopPropagation()}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h2 style={{ margin: 0 }}>Frame {frameNumber}</h2>
                  <button
                    onClick={flipToFront}
                    style={{
                      background: "rgba(255,255,255,0.18)",
                      color: "#fff",
                      border: "none",
                      padding: ".4rem .7rem",
                      borderRadius: 10,
                      cursor: "pointer"
                    }}
                  >
                    Close
                  </button>
                </div>

                <p style={{ marginTop: 10, opacity: 0.95 }}>
                  Enter pins knocked down. Must enter rolls in order.
                </p>

                {!editable ? (
                  <p style={{ fontWeight: 700 }}>
                    You can only edit the current frame or earlier frames.
                  </p>
                ) : (
                  <>
                    {/* Roll entry controls */}
                    <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                      <RollRow
                        label="Roll 1"
                        value={activeFrame.r1}
                        enabled={activeFrame.r1 === null}
                        options={activeFrame.r1 === null ? rollOptions : []}
                        onPick={(v) => setRoll(carouselIndex, 1, v)}
                      />

                      <RollRow
                        label="Roll 2"
                        value={activeFrame.r2}
                        enabled={activeFrame.r1 !== null && activeFrame.r2 === null && (tenth || activeFrame.r1 !== 10)}
                        options={
                          activeFrame.r1 !== null && activeFrame.r2 === null
                            ? allowedMaxPinsForNextRoll(carouselIndex, activeFrame).nextRoll === 2
                              ? Array.from({ length: allowedMaxPinsForNextRoll(carouselIndex, activeFrame).maxPins + 1 }, (_, i) => i)
                              : []
                            : []
                        }
                        onPick={(v) => setRoll(carouselIndex, 2, v)}
                      />

                      <RollRow
                        label="Roll 3"
                        value={activeFrame.r3}
                        enabled={
                          activeFrame.r1 !== null &&
                          activeFrame.r2 !== null &&
                          activeFrame.r3 === null &&
                          // frame 1-9: only if not strike and not already spare by roll2
                          (tenth ||
                            (activeFrame.r1 !== 10 && (activeFrame.r1 + activeFrame.r2) < 10))
                        }
                        options={
                          activeFrame.r1 !== null && activeFrame.r2 !== null && activeFrame.r3 === null
                            ? allowedMaxPinsForNextRoll(carouselIndex, activeFrame).nextRoll === 3
                              ? Array.from({ length: allowedMaxPinsForNextRoll(carouselIndex, activeFrame).maxPins + 1 }, (_, i) => i)
                              : []
                            : []
                        }
                        onPick={(v) => setRoll(carouselIndex, 3, v)}
                      />
                    </div>

                    <div style={{ marginTop: 14, fontSize: ".9rem", opacity: 0.95 }}>
                      {nextRoll ? (
                        <>
                          Next: <strong>Roll {nextRoll}</strong> (0–{maxPins})
                        </>
                      ) : (
                        <>Frame entry complete.</>
                      )}
                    </div>

                    {/* Submit frame / flip back */}
                    <button
                      onClick={() => {
                        // Require that the frame is in a valid "completed" state before flipping back
                        const complete = frameCompleted(frameNumber, frames[carouselIndex]);
                        if (complete) flipToFront();
                      }}
                      style={{
                        marginTop: 16,
                        width: "100%",
                        padding: ".85rem",
                        borderRadius: 12,
                        border: "none",
                        background: "#fff",
                        color: ORANGE,
                        fontWeight: 800,
                        cursor: frameCompleted(frameNumber, frames[carouselIndex]) ? "pointer" : "not-allowed",
                        opacity: frameCompleted(frameNumber, frames[carouselIndex]) ? 1 : 0.6
                      }}
                    >
                      Confirm Rolls & Return
                    </button>

                    <button
                      onClick={() => resetFrame(carouselIndex)}
                      style={{
                        marginTop: 10,
                        width: "100%",
                        padding: ".75rem",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.6)",
                        background: "transparent",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Reset This Frame
                    </button>
                  </>
                )}
              </div>

              {/* Footer buttons */}
              <div style={{ display: "grid", gap: 10 }}>
                <button
                  onClick={submitScore}
                  style={{
                    width: "100%",
                    padding: ".85rem",
                    borderRadius: 12,
                    border: "none",
                    background: "rgba(0,0,0,0.18)",
                    color: "#fff",
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Submit Score (clears cookies)
                </button>

                <button
                  onClick={newGame}
                  style={{
                    width: "100%",
                    padding: ".85rem",
                    borderRadius: 12,
                    border: "none",
                    background: "rgba(255,255,255,0.18)",
                    color: "#fff",
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  New Game (clears cookies)
                </button>

                <div style={{ fontSize: ".8rem", opacity: 0.9, textAlign: "center" }}>
                  Game ID: <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{gameId || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Small helper row */}
      <div style={{ textAlign: "center", marginTop: "1.25rem", color: TEXT_ORANGE, opacity: 0.9 }}>
        Viewing frame <strong>{carouselIndex + 1}</strong> of <strong>10</strong>
      </div>
    </main>
  );
}

/** Simple roll picker row */
function RollRow(props: {
  label: string;
  value: number | null;
  enabled: boolean;
  options: number[];
  onPick: (v: number) => void;
}) {
  const { label, value, enabled, options, onPick } = props;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.12)",
        padding: ".75rem",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12
      }}
    >
      <div style={{ fontWeight: 800 }}>{label}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ minWidth: 34, textAlign: "center", fontWeight: 800 }}>
          {value === null ? "—" : value}
        </div>

        <select
          disabled={!enabled}
          value={value === null ? "" : String(value)}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isNaN(v)) onPick(v);
          }}
          style={{
            width: 120,
            padding: ".55rem .6rem",
            borderRadius: 10,
            border: "none",
            outline: "none",
            background: enabled ? "#fff" : "rgba(255,255,255,0.25)",
            color: enabled ? "#111" : "rgba(255,255,255,0.85)",
            fontWeight: 700,
            cursor: enabled ? "pointer" : "not-allowed"
          }}
        >
          <option value="" disabled>
            Select…
          </option>
          {options.map(n => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}