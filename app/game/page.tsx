"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Frame = {
  r1: number | null;
  r2: number | null;
  r3: number | null;
};

const CREAM = "#f5f0e6";
const ORANGE = "#e46a2e";

// Cookie helpers
function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string) {
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  const prefix = encodeURIComponent(name) + "=";
  for (const c of cookies) {
    if (c.startsWith(prefix)) return decodeURIComponent(c.slice(prefix.length));
  }
  return null;
}

function deleteCookie(name: string) {
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Duckpin: strike bonus next 2 balls; spare bonus next 1 ball.
// Frames 1–9: up to 3 rolls, but frame ends early if strike on r1, or spare by r2.
// Frame 10: max 3 rolls total (per your requirement).
function getFrameRollCount(frameIndex: number, f: Frame): number {
  const r1 = f.r1;
  const r2 = f.r2;
  const r3 = f.r3;

  if (r1 == null) return 0;

  // Frame 10 (index 9): always allow up to 3, but no extra beyond 3.
  if (frameIndex === 9) {
    if (r2 == null) return 1;
    if (r3 == null) return 2;
    return 3;
  }

  // Frames 1–9:
  if (r1 === 10) return 1; // strike
  if (r2 == null) return 1;

  // spare by second ball
  if (r1 + r2 === 10) return 2;

  // otherwise can use third ball
  if (r3 == null) return 2;
  return 3;
}

function isFrameComplete(frameIndex: number, f: Frame): boolean {
  const count = getFrameRollCount(frameIndex, f);
  if (frameIndex === 9) {
    // 10th frame complete when 3 rolls entered OR earlier rolls missing? We'll treat as complete only when all 3 set.
    return count === 3;
  }

  // frames 1–9 complete when:
  // strike on first, spare by second, or third entered (open or spare-on-third)
  const r1 = f.r1;
  const r2 = f.r2;
  const r3 = f.r3;

  if (r1 == null) return false;
  if (r1 === 10) return true;
  if (r2 == null) return false;
  if (r1 + r2 === 10) return true;
  return r3 != null; // third roll entered
}

function flattenRolls(frames: Frame[]): number[] {
  const rolls: number[] = [];
  frames.forEach((f, idx) => {
    const count = getFrameRollCount(idx, f);
    if (count >= 1 && f.r1 != null) rolls.push(f.r1);
    if (count >= 2 && f.r2 != null) rolls.push(f.r2);
    if (count >= 3 && f.r3 != null) rolls.push(f.r3);
  });
  return rolls;
}

function computeDuckpinCumulative(frames: Frame[]): { perFrame: (number | null)[]; total: number | null } {
  const allRolls = flattenRolls(frames);
  const perFrame: (number | null)[] = Array(10).fill(null);

  let total = 0;
  let rollIndex = 0;

  for (let frame = 0; frame < 10; frame++) {
    const f = frames[frame];
    const count = getFrameRollCount(frame, f);

    // Not enough rolls to even score base of frame
    if (count === 0) break;

    const r1 = allRolls[rollIndex] ?? null;
    const r2 = allRolls[rollIndex + 1] ?? null;
    const r3 = allRolls[rollIndex + 2] ?? null;

    // Frame 10: no extra rolls beyond the 3 in this frame
    if (frame === 9) {
      if (count < 3) break; // wait until user finishes 10th
      const frameTotal = (r1 ?? 0) + (r2 ?? 0) + (r3 ?? 0);
      total += frameTotal;
      perFrame[frame] = total;
      rollIndex += 3;
      continue;
    }

    // Strike
    if (r1 === 10) {
      const b1 = allRolls[rollIndex + 1];
      const b2 = allRolls[rollIndex + 2];
      if (b1 == null || b2 == null) break; // need next 2 balls
      total += 10 + b1 + b2;
      perFrame[frame] = total;
      rollIndex += 1;
      continue;
    }

    // Need second roll for non-strike frames
    if (r2 == null) break;

    // Spare by second roll
    if (r1 + r2 === 10) {
      const b1 = allRolls[rollIndex + 2];
      if (b1 == null) break; // need next 1 ball
      total += 10 + b1;
      perFrame[frame] = total;
      rollIndex += 2;
      continue;
    }

    // Otherwise: can have third roll (open or spare-on-third)
    if (count < 3) break;
    if (r3 == null) break;

    const sum3 = r1 + r2 + r3;

    // Spare-on-third (sum hits 10 on third ball): bonus next 1 ball
    if (sum3 === 10) {
      const b1 = allRolls[rollIndex + 3];
      if (b1 == null) break;
      total += 10 + b1;
      perFrame[frame] = total;
      rollIndex += 3;
      continue;
    }

    // Open frame
    total += sum3;
    perFrame[frame] = total;
    rollIndex += 3;
  }

  const totalOut = perFrame.some(v => v != null) ? perFrame.filter(v => v != null).slice(-1)[0] ?? null : null;
  return { perFrame, total: totalOut };
}

function emptyFrames(): Frame[] {
  return Array.from({ length: 10 }, () => ({ r1: null, r2: null, r3: null }));
}

function frameCookieName(frameNum1Based: number, rollNum: 1 | 2 | 3) {
  return `test_frame${frameNum1Based}_roll${rollNum}`;
}

function clearFrameCookies(frameNum1Based: number) {
  deleteCookie(frameCookieName(frameNum1Based, 1));
  deleteCookie(frameCookieName(frameNum1Based, 2));
  deleteCookie(frameCookieName(frameNum1Based, 3));
}

function readFramesFromCookies(): { gameId: string | null; frames: Frame[] } {
  const gameId = getCookie("test_game_id");
  const frames = emptyFrames();
  for (let f = 1; f <= 10; f++) {
    const r1 = getCookie(frameCookieName(f, 1));
    const r2 = getCookie(frameCookieName(f, 2));
    const r3 = getCookie(frameCookieName(f, 3));
    frames[f - 1] = {
      r1: r1 == null || r1 === "" ? null : clampInt(Number(r1), 0, 10),
      r2: r2 == null || r2 === "" ? null : clampInt(Number(r2), 0, 10),
      r3: r3 == null || r3 === "" ? null : clampInt(Number(r3), 0, 10)
    };
  }
  return { gameId, frames };
}

function writeFrameToCookies(frameNum1Based: number, f: Frame) {
  setCookie(frameCookieName(frameNum1Based, 1), f.r1 == null ? "" : String(f.r1));
  setCookie(frameCookieName(frameNum1Based, 2), f.r2 == null ? "" : String(f.r2));
  setCookie(frameCookieName(frameNum1Based, 3), f.r3 == null ? "" : String(f.r3));
}

function clearAllGameCookies() {
  deleteCookie("test_game_id");
  for (let f = 1; f <= 10; f++) clearFrameCookies(f);
}

export default function GamePage() {
  const [frames, setFrames] = useState<Frame[]>(() => emptyFrames());
  const [cardIndex, setCardIndex] = useState(0); // 0..9 frames
  const [flipped, setFlipped] = useState(false);
  const [editingFrame, setEditingFrame] = useState<number | null>(null); // which frame is being edited on back
  const [temp, setTemp] = useState<Frame>({ r1: null, r2: null, r3: null });

  // Arrow positioning
  const cardWrapRef = useRef<HTMLDivElement | null>(null);
  const [arrowTop, setArrowTop] = useState<number>(200);

  // Load cookies once
  useEffect(() => {
    const saved = readFramesFromCookies();
    setFrames(saved.frames);

    if (!saved.gameId) {
      setCookie("test_game_id", crypto.randomUUID());
    }
  }, []);

  // Keep arrows vertically aligned to card center (but fixed left/right)
  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const el = cardWrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setArrowTop(rect.top + rect.height / 2);
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [cardIndex, flipped]);

  const { perFrame, total } = useMemo(() => computeDuckpinCumulative(frames), [frames]);

  // Determine current frame the bowler is allowed to enter (first incomplete)
  const currentFrame = useMemo(() => {
    for (let i = 0; i < 10; i++) {
      if (!isFrameComplete(i, frames[i])) return i;
    }
    return 9; // if all complete, keep at 10th
  }, [frames]);

  const isFirst = cardIndex === 0;
  const isLast = cardIndex === 9;

  function prev() {
    if (isFirst) return;
    setFlipped(false);
    setCardIndex(cardIndex - 1);
  }

  function next() {
    if (isLast) return;
    setFlipped(false);
    setCardIndex(cardIndex + 1);
  }

  function openEdit(frameIdx: number) {
    // Only allow editing current frame or earlier
    if (frameIdx > currentFrame) return;

    // Reset cookies for that frame (prevents stale third-roll issues)
    clearFrameCookies(frameIdx + 1);

    // Clear the frame in state and force re-entry from roll 1
    setFrames(prev => {
      const copy = [...prev];
      copy[frameIdx] = { r1: null, r2: null, r3: null };
      return copy;
    });

    setEditingFrame(frameIdx);
    setTemp({ r1: null, r2: null, r3: null });
    setFlipped(true);
  }

  function maxPinsForRoll(rollNum: 1 | 2 | 3) {
    const r1 = temp.r1 ?? 0;
    const r2 = temp.r2 ?? 0;

    // 10-pin max per frame always; 10th frame still max 10 total across 3 rolls (your requirement)
    if (rollNum === 1) return 10;

    if (rollNum === 2) {
      return clampInt(10 - r1, 0, 10);
    }

    // roll 3
    return clampInt(10 - (r1 + r2), 0, 10);
  }

  function canSelectRoll2() {
    return temp.r1 != null && temp.r1 !== 10; // in frames 1–9, strike ends frame; in 10th user may still roll 2/3 but we keep consistent UI:
  }

  function canSelectRoll3(frameIdx: number) {
    if (temp.r1 == null) return false;
    if (temp.r2 == null) return false;

    // In frames 1–9, strike ends frame, spare by second ends frame
    if (frameIdx !== 9) {
      if (temp.r1 === 10) return false;
      if ((temp.r1 ?? 0) + (temp.r2 ?? 0) === 10) return false;
    }

    return true;
  }

  function saveFrame() {
    if (editingFrame == null) return;

    // Validate sequential entry: must have r1 to save
    if (temp.r1 == null) return;

    const frameIdx = editingFrame;

    // Determine how many rolls are allowed/needed for this frame given duckpin logic
    let final: Frame = { ...temp };

    if (frameIdx !== 9) {
      // frames 1–9
      if (final.r1 === 10) {
        final = { r1: 10, r2: null, r3: null };
      } else if (final.r2 == null) {
        return; // must enter roll 2 if not strike
      } else if (final.r1 + final.r2 === 10) {
        final = { r1: final.r1, r2: final.r2, r3: null };
      } else {
        if (final.r3 == null) return; // open frame requires third roll
        // ensure <=10
        if (final.r1 + final.r2 + final.r3 > 10) return;
      }
    } else {
      // 10th frame: allow up to 3 rolls, no extra beyond 3
      if (final.r2 == null) return;
      if (final.r3 == null) return;
      if ((final.r1 ?? 0) + (final.r2 ?? 0) + (final.r3 ?? 0) > 10) return;
    }

    setFrames(prev => {
      const copy = [...prev];
      copy[frameIdx] = final;
      return copy;
    });

    writeFrameToCookies(frameIdx + 1, final);

    setFlipped(false);
    setEditingFrame(null);
  }

  function newGame() {
    clearAllGameCookies();
    setCookie("test_game_id", crypto.randomUUID());
    setFrames(emptyFrames());
    setCardIndex(0);
    setFlipped(false);
    setEditingFrame(null);
    setTemp({ r1: null, r2: null, r3: null });
  }

  function submitScore() {
    // For now: just clears cookies as requested
    clearAllGameCookies();
    setFlipped(false);
    setEditingFrame(null);
    alert("Score submitted (test). Cookies cleared.");
  }

  const displayFrame = frames[cardIndex];

  // Determine strike/spare visual for the front
  const frameIsStrike = displayFrame.r1 === 10 && cardIndex !== 9;
  const frameSum2 = (displayFrame.r1 ?? 0) + (displayFrame.r2 ?? 0);
  const frameSum3 = frameSum2 + (displayFrame.r3 ?? 0);
  const frameIsSpare =
    !frameIsStrike &&
    displayFrame.r1 != null &&
    displayFrame.r2 != null &&
    ((frameSum2 === 10 && cardIndex !== 9) ||
      (cardIndex !== 9 && displayFrame.r3 != null && frameSum3 === 10));

  // Which roll box gets the spare symbol?
  const spareBox: 2 | 3 | null =
    frameIsSpare
      ? (frameSum2 === 10 ? 2 : 3)
      : null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: CREAM,
        fontFamily: "Montserrat, system-ui",
        padding: "2rem 1rem",
        color: "#2b1d12"
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
        <img src="/1@300x.png" alt="Dux Bowling" style={{ maxWidth: 160, width: "100%" }} />
      </div>

      {/* Minimal header / total */}
      <div style={{ textAlign: "center", marginBottom: "1.25rem", color: ORANGE }}>
        <div style={{ fontWeight: 700, fontSize: "1.15rem" }}>Duckpin Score</div>
        <div style={{ fontSize: "0.95rem" }}>
          Total: <strong>{total ?? "—"}</strong>
        </div>
      </div>

      {/* Fixed arrows (left/right fixed like menu/login), vertically centered to card */}
      <button
        onClick={prev}
        disabled={isFirst}
        aria-label="Previous frame"
        style={{
          position: "fixed",
          left: 14,
          top: arrowTop,
          transform: "translateY(-50%)",
          width: 46,
          height: 46,
          borderRadius: "50%",
          border: "none",
          background: ORANGE,
          color: "#fff",
          fontSize: "1.7rem",
          opacity: isFirst ? 0.5 : 1,
          cursor: isFirst ? "default" : "pointer",
          boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
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
          right: 14,
          top: arrowTop,
          transform: "translateY(-50%)",
          width: 46,
          height: 46,
          borderRadius: "50%",
          border: "none",
          background: ORANGE,
          color: "#fff",
          fontSize: "1.7rem",
          opacity: isLast ? 0.5 : 1,
          cursor: isLast ? "default" : "pointer",
          boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
          zIndex: 50
        }}
      >
        ›
      </button>

      {/* Card Wrapper (used to compute arrowTop) */}
      <div
        ref={cardWrapRef}
        style={{
          maxWidth: 360,
          margin: "0 auto",
          perspective: 1000
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 260,
            transformStyle: "preserve-3d",
            transition: "transform 0.6s",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)"
          }}
        >
          {/* FRONT: classic-ish score sheet */}
          <div
            onClick={() => openEdit(cardIndex)}
            style={{
              position: "absolute",
              inset: 0,
              background: "#fff",
              borderRadius: 14,
              padding: "1rem",
              backfaceVisibility: "hidden",
              boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
              cursor: cardIndex <= currentFrame ? "pointer" : "default",
              opacity: cardIndex <= currentFrame ? 1 : 0.6,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontWeight: 800, color: ORANGE, fontSize: "1.05rem" }}>
                Frame {cardIndex + 1}
              </div>
              <div style={{ color: "#7a5b42", fontSize: "0.9rem" }}>
                {cardIndex < currentFrame ? "Edit" : cardIndex === currentFrame ? "Current" : ""}
              </div>
            </div>

            {/* Score box */}
            <div style={{ marginTop: "1rem" }}>
              {/* Roll boxes row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {[1, 2, 3].map((n) => {
                  const rollVal = n === 1 ? displayFrame.r1 : n === 2 ? displayFrame.r2 : displayFrame.r3;

                  const isStrikeBox = frameIsStrike && n === 1;
                  const isSpareThisBox = spareBox === n;

                  return (
                    <div
                      key={n}
                      style={{
                        position: "relative",
                        height: 46,
                        border: "2px solid #2b1d12",
                        borderRadius: 8,
                        overflow: "hidden",
                        background: isStrikeBox ? "rgba(228,106,46,0.16)" : "#fff"
                      }}
                    >
                      {/* Spare triangle shading */}
                      {isSpareThisBox && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "linear-gradient(135deg, rgba(228,106,46,0.22) 0%, rgba(228,106,46,0.22) 50%, transparent 50%, transparent 100%)"
                          }}
                        />
                      )}

                      <div
                        style={{
                          position: "relative",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "1.15rem",
                          color: "#2b1d12"
                        }}
                      >
                        {isStrikeBox ? "X" : isSpareThisBox ? "/" : rollVal ?? ""}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cumulative box */}
              <div
                style={{
                  marginTop: 10,
                  height: 62,
                  border: "2px solid #2b1d12",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "1.6rem",
                  color: ORANGE
                }}
              >
                {perFrame[cardIndex] ?? "—"}
              </div>
            </div>

            <div style={{ marginTop: "auto", textAlign: "center", fontSize: "0.85rem", color: "#7a5b42" }}>
              Tap card to enter / edit
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
              boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem"
            }}
          >
            <div style={{ fontWeight: 900, fontSize: "1.05rem" }}>
              Frame {editingFrame != null ? editingFrame + 1 : cardIndex + 1}
            </div>

            {/* Compact selects */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.6rem" }}>
              {/* Roll 1 */}
              <select
                value={temp.r1 == null ? "" : String(temp.r1)}
                onChange={(e) => {
                  const v = e.target.value === "" ? null : clampInt(Number(e.target.value), 0, 10);
                  setTemp({ r1: v, r2: null, r3: null });
                }}
                style={{
                  height: 44,
                  borderRadius: 10,
                  border: "none",
                  padding: "0 0.75rem",
                  fontWeight: 700
                }}
              >
                <option value="">Roll 1</option>
                {Array.from({ length: 11 }, (_, i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>

              {/* Roll 2 */}
              <select
                disabled={!canSelectRoll2()}
                value={temp.r2 == null ? "" : String(temp.r2)}
                onChange={(e) => {
                  const v = e.target.value === "" ? null : clampInt(Number(e.target.value), 0, maxPinsForRoll(2));
                  setTemp((prev) => ({ ...prev, r2: v, r3: null }));
                }}
                style={{
                  height: 44,
                  borderRadius: 10,
                  border: "none",
                  padding: "0 0.75rem",
                  fontWeight: 700,
                  opacity: canSelectRoll2() ? 1 : 0.7
                }}
              >
                <option value="">Roll 2</option>
                {Array.from({ length: maxPinsForRoll(2) + 1 }, (_, i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>

              {/* Roll 3 */}
              <select
                disabled={editingFrame == null ? true : !canSelectRoll3(editingFrame)}
                value={temp.r3 == null ? "" : String(temp.r3)}
                onChange={(e) => {
                  const v = e.target.value === "" ? null : clampInt(Number(e.target.value), 0, maxPinsForRoll(3));
                  setTemp((prev) => ({ ...prev, r3: v }));
                }}
                style={{
                  height: 44,
                  borderRadius: 10,
                  border: "none",
                  padding: "0 0.75rem",
                  fontWeight: 700,
                  opacity: editingFrame != null && canSelectRoll3(editingFrame) ? 1 : 0.7
                }}
              >
                <option value="">Roll 3</option>
                {Array.from({ length: maxPinsForRoll(3) + 1 }, (_, i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginTop: "0.25rem" }}>
              <button
                onClick={saveFrame}
                style={{
                  height: 44,
                  borderRadius: 12,
                  border: "none",
                  background: "#fff",
                  color: ORANGE,
                  fontWeight: 900,
                  cursor: "pointer"
                }}
              >
                Save
              </button>

              <button
                onClick={() => {
                  if (editingFrame != null) clearFrameCookies(editingFrame + 1);
                  setTemp({ r1: null, r2: null, r3: null });
                }}
                style={{
                  height: 44,
                  borderRadius: 12,
                  border: "none",
                  background: "rgba(255,255,255,0.22)",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: "pointer"
                }}
              >
                Reset
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginTop: "auto" }}>
              <button
                onClick={submitScore}
                style={{
                  height: 44,
                  borderRadius: 12,
                  border: "none",
                  background: "#2b1d12",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: "pointer"
                }}
              >
                Submit Score
              </button>

              <button
                onClick={newGame}
                style={{
                  height: 44,
                  borderRadius: 12,
                  border: "none",
                  background: "rgba(43,29,18,0.75)",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: "pointer"
                }}
              >
                New Game
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Small spacer so fixed buttons don't overlap footer */}
      <div style={{ height: 40 }} />
    </main>
  );
}