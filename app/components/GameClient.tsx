"use client";

import { useEffect, useMemo, useState } from "react";

/** Cookie helpers (SAFE: only runs in browser) */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  // path=/ makes cookies available on BOTH /game and /game-test
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

/** Helpers */
const todayISO = () => new Date().toISOString().slice(0, 10);
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

type Meta = {
  date: string;
  location: "Walkersville Bowling Center" | "Mount Airy Bowling Lanes";
  gameType: "Scrimmage" | "League" | "Tournament";
  gameNumber: number;
};

type Frame = {
  lane?: number;         // optional
  r1?: number | null;
  r2?: number | null;
  r3?: number | null;
};

/**
 * Duckpin scoring notes (per your latest rules):
 * - Up to 3 rolls per frame (including 10th)
 * - Frame total max 10 unless 10th-frame reset cases.
 * - IMPORTANT: knocking down remaining pins on 3rd ball is NOT treated as spare bonus.
 *   (i.e., only spares on 2nd ball give next-ball bonus; 3rd-ball completion scores 10 flat)
 */
function computeScore(frames: Frame[]) {
  // Build list of balls in order with frame context
  const balls: number[] = [];
  const frameBallCounts: number[] = []; // how many balls actually recorded per frame

  for (let i = 0; i < 10; i++) {
    const f = frames[i] || {};
    const r1 = f.r1 ?? null;
    const r2 = f.r2 ?? null;
    const r3 = f.r3 ?? null;

    let count = 0;
    if (r1 !== null && r1 !== undefined) { balls.push(r1); count++; }
    if (r2 !== null && r2 !== undefined) { balls.push(r2); count++; }
    if (r3 !== null && r3 !== undefined) { balls.push(r3); count++; }
    frameBallCounts.push(count);
  }

  // Score frame-by-frame
  let score = 0;
  let idx = 0;

  for (let frame = 0; frame < 10; frame++) {
    const f = frames[frame] || {};
    const r1 = f.r1 ?? null;
    const r2 = f.r2 ?? null;
    const r3 = f.r3 ?? null;

    // If frame not started, cumulative stays
    if (r1 === null || r1 === undefined) break;

    const a = r1 ?? 0;
    const b = (r2 ?? 0);
    const c = (r3 ?? 0);

    // STRIKE (first ball 10): bonus is next two balls
    if (a === 10) {
      const bonus1 = balls[idx + 1] ?? 0;
      const bonus2 = balls[idx + 2] ?? 0;
      score += 10 + bonus1 + bonus2;
      idx += 1;
      continue;
    }

    // SPARE ONLY IF completed on 2nd ball (a+b==10)
    if ((r2 !== null && r2 !== undefined) && a + b === 10) {
      const bonus = balls[idx + 2] ?? 0;
      score += 10 + bonus;
      idx += 2;
      continue;
    }

    // If completed on 3rd ball to reach 10 (a+b+c==10) => NOT spare bonus per your rule
    if ((r3 !== null && r3 !== undefined) && a + b + c === 10) {
      score += 10;
      idx += 3;
      continue;
    }

    // OPEN frame: sum of recorded balls (up to 3)
    if (r2 === null || r2 === undefined) {
      score += a;
      idx += 1;
      continue;
    }
    if (r3 === null || r3 === undefined) {
      score += a + b;
      idx += 2;
      continue;
    }

    score += a + b + c;
    idx += 3;
  }

  return score;
}

export default function GameClient() {
  // Persistent game id shared across /game and /game-test
  const [gameId, setGameId] = useState<string>("");

  // Meta inputs
  const [meta, setMeta] = useState<Meta>({
    date: todayISO(),
    location: "Walkersville Bowling Center",
    gameType: "Scrimmage",
    gameNumber: 1
  });

  // Frames (10)
  const [frames, setFrames] = useState<Frame[]>(Array.from({ length: 10 }, () => ({})));

  // UI state
  const [frameIndex, setFrameIndex] = useState(0); // 0..9
  const [flipped, setFlipped] = useState(false);

  // Load cookies ONLY in effect (browser-only)
  useEffect(() => {
    const existingGameId = getCookie("dux_game_id");
    const gid = existingGameId || crypto.randomUUID();
    setGameId(gid);
    if (!existingGameId) setCookie("dux_game_id", gid, 7);

    // Meta cookies
    const cDate = getCookie("dux_date");
    const cLoc = getCookie("dux_location") as Meta["location"] | null;
    const cType = getCookie("dux_game_type") as Meta["gameType"] | null;
    const cNum = getCookie("dux_game_number");

    setMeta(prev => ({
      date: cDate || prev.date,
      location: cLoc || prev.location,
      gameType: cType || prev.gameType,
      gameNumber: cNum ? Number(cNum) : prev.gameNumber
    }));

    // Frame cookies
    const nextFrames = Array.from({ length: 10 }, (_, i) => {
      const lane = getCookie(`frame${i + 1}_lane`);
      const r1 = getCookie(`frame${i + 1}_roll1`);
      const r2 = getCookie(`frame${i + 1}_roll2`);
      const r3 = getCookie(`frame${i + 1}_roll3`);
      return {
        lane: lane ? Number(lane) : undefined,
        r1: r1 ? Number(r1) : undefined,
        r2: r2 ? Number(r2) : undefined,
        r3: r3 ? Number(r3) : undefined
      } as Frame;
    });

    setFrames(nextFrames);
  }, []);

  // Persist meta to cookies when changed
  useEffect(() => {
    setCookie("dux_date", meta.date, 7);
    setCookie("dux_location", meta.location, 7);
    setCookie("dux_game_type", meta.gameType, 7);
    setCookie("dux_game_number", String(meta.gameNumber), 7);
  }, [meta]);

  const totalScore = useMemo(() => computeScore(frames), [frames]);

  // Frame completion rules (duckpin)
  function isFrameComplete(i: number, f: Frame) {
    const frameNum = i + 1;
    const r1 = f.r1 ?? null;
    const r2 = f.r2 ?? null;
    const r3 = f.r3 ?? null;

    if (r1 === null || r1 === undefined) return false;

    // Frames 1-9:
    if (frameNum < 10) {
      if (r1 === 10) return true;       // strike ends frame
      if (r2 === null || r2 === undefined) return false;
      // If spare on 2nd ball ends frame
      if (r1 + r2 === 10) return true;
      // otherwise need 3rd
      return r3 !== null && r3 !== undefined;
    }

    // 10th frame: ALWAYS up to 3 rolls, but may end early if third completes and no extra (duckpin has no extra)
    // You specified: duckpin only allows 3 rolls in the 10th; no additional.
    if (r2 === null || r2 === undefined) return false;
    if (r3 === null || r3 === undefined) return false;
    return true;
  }

  function firstIncompleteFrameIndex() {
    for (let i = 0; i < 10; i++) {
      if (!isFrameComplete(i, frames[i])) return i;
    }
    return 10;
  }

  const currentAllowedMaxFrame = firstIncompleteFrameIndex(); // can edit <= currentAllowedMaxFrame

  // Reset cookies for a frame when editing (your requirement)
  function resetFrameCookies(frameNum: number) {
    deleteCookie(`frame${frameNum}_roll1`);
    deleteCookie(`frame${frameNum}_roll2`);
    deleteCookie(`frame${frameNum}_roll3`);
    deleteCookie(`frame${frameNum}_lane`);
  }

  function setFrameValue(i: number, patch: Partial<Frame>) {
    setFrames(prev => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }

  // Compute dropdown options for a given roll in a given frame, following your 10th-frame rule
  function getOptionsForRoll(frameNum: number, rollIndex: 1 | 2 | 3, f: Frame) {
    const r1 = f.r1 ?? null;
    const r2 = f.r2 ?? null;

    // Can't pick roll 2/3 before earlier roll
    if (rollIndex === 2 && (r1 === null || r1 === undefined)) return [];
    if (rollIndex === 3 && (r1 === null || r1 === undefined || r2 === null || r2 === undefined)) return [];

    // Frames 1-9
    if (frameNum < 10) {
      const soFar =
        (rollIndex === 1 ? 0 : (f.r1 ?? 0)) +
        (rollIndex === 3 ? (f.r2 ?? 0) : 0);
      const remaining = Math.max(0, 10 - soFar);

      // If strike on roll1, roll2/roll3 should be disabled
      if (rollIndex !== 1 && (f.r1 ?? 0) === 10) return [];

      // If spare on roll2 (r1+r2==10), roll3 disabled
      if (rollIndex === 3 && (f.r1 ?? 0) + (f.r2 ?? 0) === 10) return [];

      return range(0, remaining);
    }

    // 10th frame logic per your latest:
    // - roll2 options limited to remaining after roll1 (0..10-r1)
    // - roll3:
    //   - if r1+r2==10 -> reset pins, options 0..10
    //   - else options 0..(10 - (r1+r2)) remaining
    if (frameNum === 10) {
      const a = f.r1 ?? 0;
      const b = f.r2 ?? 0;

      if (rollIndex === 1) return range(0, 10);

      if (rollIndex === 2) {
        const remaining = Math.max(0, 10 - a);
        return range(0, remaining);
      }

      // rollIndex === 3
      if (a + b === 10) {
        return range(0, 10); // reset pins
      }
      const remaining = Math.max(0, 10 - (a + b));
      return range(0, remaining);
    }

    return [];
  }

  function onSelectLane(i: number, lane: number) {
    setFrameValue(i, { lane });
    setCookie(`frame${i + 1}_lane`, String(lane), 7);
  }

  function onSelectRoll(i: number, roll: 1 | 2 | 3, pins: number) {
    const frameNum = i + 1;

    // If user is editing a prior frame: require full re-entry from roll1
    // We’ll implement by clearing the whole frame cookies when roll1 changes OR when they start editing a completed frame.
    // To keep it simple and predictable:
    // - If they change roll1, clear roll2+roll3
    // - If they change roll2, clear roll3
    // - If they are editing any completed frame and pick any roll, ensure subsequent rolls cleared accordingly.

    if (roll === 1) {
      // Clear frame (your requirement for edits)
      resetFrameCookies(frameNum);
      setFrameValue(i, { r1: pins, r2: undefined, r3: undefined });
      setCookie(`frame${frameNum}_roll1`, String(pins), 7);
      return;
    }

    if (roll === 2) {
      // must have roll1
      if (frames[i].r1 === null || frames[i].r1 === undefined) return;
      // clear roll3 if editing
      deleteCookie(`frame${frameNum}_roll3`);
      setFrameValue(i, { r2: pins, r3: undefined });
      setCookie(`frame${frameNum}_roll2`, String(pins), 7);
      return;
    }

    // roll === 3
    if (frames[i].r1 === null || frames[i].r1 === undefined) return;
    if (frames[i].r2 === null || frames[i].r2 === undefined) return;

    setFrameValue(i, { r3: pins });
    setCookie(`frame${frameNum}_roll3`, String(pins), 7);
  }

  function canOpenFrame(i: number) {
    // Can open current or any prior frame only
    return i <= currentAllowedMaxFrame;
  }

  function allFramesComplete() {
    return firstIncompleteFrameIndex() === 10;
  }

  function newGame() {
    deleteCookie("dux_game_id");
    deleteCookie("dux_date");
    deleteCookie("dux_location");
    deleteCookie("dux_game_type");
    deleteCookie("dux_game_number");
    for (let i = 1; i <= 10; i++) {
      resetFrameCookies(i);
    }

    const gid = crypto.randomUUID();
    setCookie("dux_game_id", gid, 7);
    setGameId(gid);
    setMeta({
      date: todayISO(),
      location: "Walkersville Bowling Center",
      gameType: "Scrimmage",
      gameNumber: 1
    });
    setFrames(Array.from({ length: 10 }, () => ({})));
    setFrameIndex(0);
    setFlipped(false);
  }

  function submitScore() {
    if (!allFramesComplete()) return;
    // For now, just clears cookies per your request
    newGame();
  }

  // UI helpers for classic score-sheet look (simplified MVP)
  function isStrike(f: Frame, frameNum: number) {
    return (f.r1 ?? 0) === 10 && frameNum < 10; // treat 10th differently visually if you want later
  }

  function isSpareSecondBallOnly(f: Frame, frameNum: number) {
    if (frameNum === 10) return false; // keep simple
    const a = f.r1 ?? null;
    const b = f.r2 ?? null;
    return a !== null && b !== null && a + b === 10 && a !== 10;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f0e6",
        fontFamily: "Montserrat, system-ui",
        padding: "2rem 1rem",
        color: "#c75a1d"
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <img src="/1@300x.png" alt="Dux Bowling" style={{ maxWidth: 180, width: "100%" }} />
      </div>

      {/* Meta inputs */}
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto 1rem",
          background: "#fff",
          borderRadius: 12,
          padding: "1rem",
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)"
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
          <label style={{ fontSize: ".85rem" }}>
            Date
            <input
              type="date"
              value={meta.date}
              max={todayISO()}
              onChange={(e) => setMeta({ ...meta, date: e.target.value })}
              style={{ width: "100%", padding: ".5rem", marginTop: ".25rem" }}
            />
          </label>

          <label style={{ fontSize: ".85rem" }}>
            Location
            <select
              value={meta.location}
              onChange={(e) => setMeta({ ...meta, location: e.target.value as Meta["location"] })}
              style={{ width: "100%", padding: ".5rem", marginTop: ".25rem" }}
            >
              <option>Walkersville Bowling Center</option>
              <option>Mount Airy Bowling Lanes</option>
            </select>
          </label>

          <label style={{ fontSize: ".85rem" }}>
            Game Type
            <select
              value={meta.gameType}
              onChange={(e) => setMeta({ ...meta, gameType: e.target.value as Meta["gameType"] })}
              style={{ width: "100%", padding: ".5rem", marginTop: ".25rem" }}
            >
              <option>Scrimmage</option>
              <option>League</option>
              <option>Tournament</option>
            </select>
          </label>

          <label style={{ fontSize: ".85rem" }}>
            Game #
            <select
              value={meta.gameNumber}
              onChange={(e) => setMeta({ ...meta, gameNumber: Number(e.target.value) })}
              style={{ width: "100%", padding: ".5rem", marginTop: ".25rem" }}
            >
              {range(1, 10).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>

        <div style={{ fontSize: ".8rem", marginTop: ".75rem", opacity: 0.75 }}>
          Game ID: {gameId.slice(0, 8)}…
        </div>
      </div>

      {/* “Classic” score strip (10 frames) */}
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 12,
          padding: "1rem",
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)"
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: ".35rem" }}>
          {frames.map((f, i) => {
            const frameNum = i + 1;
            const active = i === frameIndex;
            const strike = isStrike(f, frameNum);
            const spare2 = isSpareSecondBallOnly(f, frameNum);

            // Cumulative score shown (simple: overall total; you can refine to per-frame cumulative if you want)
            const cum = computeScore(frames.slice(0, i + 1));

            return (
              <button
                key={i}
                disabled={!canOpenFrame(i)}
                onClick={() => { setFrameIndex(i); setFlipped(false); }}
                style={{
                  border: active ? "2px solid #e46a2e" : "1px solid #eee",
                  background: canOpenFrame(i) ? "#fff" : "#f3f3f3",
                  borderRadius: 8,
                  padding: ".35rem",
                  textAlign: "left",
                  opacity: canOpenFrame(i) ? 1 : 0.6
                }}
              >
                <div style={{ fontSize: ".7rem", fontWeight: 700, color: "#c75a1d" }}>
                  {frameNum}
                </div>

                {/* Marks row (very simplified classic look) */}
                <div style={{ display: "flex", gap: ".2rem", marginTop: ".15rem" }}>
                  <div style={{
                    flex: 1,
                    height: 12,
                    border: "1px solid #ddd",
                    borderRadius: 3,
                    background: strike ? "#e46a2e" : "#fff",
                    color: strike ? "#fff" : "#333",
                    fontSize: ".65rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {strike ? "X" : (f.r1 ?? "")}
                  </div>

                  <div style={{
                    flex: 1,
                    height: 12,
                    border: "1px solid #ddd",
                    borderRadius: 3,
                    background: spare2 ? "linear-gradient(135deg, transparent 50%, rgba(228,106,46,0.35) 50%)" : "#fff",
                    fontSize: ".65rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {spare2 ? "/" : (f.r2 ?? "")}
                  </div>
                </div>

                <div style={{
                  marginTop: ".25rem",
                  fontSize: ".75rem",
                  fontWeight: 700,
                  color: "#c75a1d",
                  textAlign: "center"
                }}>
                  {Number.isFinite(cum) && cum > 0 ? cum : ""}
                </div>
              </button>
            );
          })}
        </div>

        {/* Card + arrows that stay fixed from left/right, but move vertically with the card */}
        <div style={{ maxWidth: 520, margin: "1.25rem auto 0", position: "relative" }}>
          {/* Left arrow */}
          <button
            onClick={() => { if (frameIndex > 0) { setFrameIndex(frameIndex - 1); setFlipped(false); } }}
            disabled={frameIndex === 0}
            style={{
              position: "absolute",
              left: -56,
              top: "50%",
              transform: "translateY(-50%)",
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "none",
              background: "#e46a2e",
              color: "#fff",
              fontSize: "1.4rem",
              opacity: frameIndex === 0 ? 0.5 : 1,
              cursor: frameIndex === 0 ? "default" : "pointer"
            }}
            aria-label="Previous frame"
          >
            ‹
          </button>

          {/* Right arrow */}
          <button
            onClick={() => { if (frameIndex < 9) { setFrameIndex(frameIndex + 1); setFlipped(false); } }}
            disabled={frameIndex === 9}
            style={{
              position: "absolute",
              right: -56,
              top: "50%",
              transform: "translateY(-50%)",
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "none",
              background: "#e46a2e",
              color: "#fff",
              fontSize: "1.4rem",
              opacity: frameIndex === 9 ? 0.5 : 1,
              cursor: frameIndex === 9 ? "default" : "pointer"
            }}
            aria-label="Next frame"
          >
            ›
          </button>

          {/* Flip card */}
          <div
            onClick={() => setFlipped(!flipped)}
            style={{
              width: "100%",
              height: 240,
              perspective: 1000,
              cursor: "pointer"
            }}
          >
            <div style={{
              position: "relative",
              width: "100%",
              height: "100%",
              transformStyle: "preserve-3d",
              transition: "transform 0.6s",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)"
            }}>
              {/* Front: compact entry */}
              <div style={{
                position: "absolute",
                inset: 0,
                background: "#fff",
                borderRadius: 12,
                padding: "1rem",
                backfaceVisibility: "hidden",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontWeight: 800, color: "#e46a2e" }}>Frame {frameIndex + 1}</div>
                  <div style={{ fontSize: ".9rem", fontWeight: 800, color: "#c75a1d" }}>Total: {totalScore}</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".6rem" }}>
                  <label style={{ fontSize: ".8rem" }}>
                    Lane (optional)
                    <select
                      value={frames[frameIndex].lane ?? ""}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onSelectLane(frameIndex, Number(e.target.value))}
                      style={{ width: "100%", padding: ".45rem", marginTop: ".25rem" }}
                    >
                      <option value="">—</option>
                      {range(1, 12).map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>

                  <div style={{ fontSize: ".8rem", opacity: 0.8, alignSelf: "end" }}>
                    Tap card to flip
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: ".6rem" }}>
                  {[1,2,3].map((r) => {
                    const frameNum = frameIndex + 1;
                    const opts = getOptionsForRoll(frameNum, r as 1|2|3, frames[frameIndex]);
                    const val = (r === 1 ? frames[frameIndex].r1 : r === 2 ? frames[frameIndex].r2 : frames[frameIndex].r3) ?? "";

                    return (
                      <label key={r} style={{ fontSize: ".8rem" }}>
                        Roll {r}
                        <select
                          value={val as any}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onSelectRoll(frameIndex, r as 1|2|3, Number(e.target.value))}
                          disabled={!canOpenFrame(frameIndex) || opts.length === 0}
                          style={{ width: "100%", padding: ".45rem", marginTop: ".25rem" }}
                        >
                          <option value="">—</option>
                          {opts.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </label>
                    );
                  })}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Only allow flipping “back” when frame is complete OR it’s a prior frame (editing)
                    setFlipped(true);
                  }}
                  style={{
                    width: "100%",
                    padding: ".7rem",
                    borderRadius: 10,
                    border: "none",
                    background: "#e46a2e",
                    color: "#fff",
                    fontWeight: 800
                  }}
                >
                  Confirm Frame
                </button>
              </div>

              {/* Back */}
              <div style={{
                position: "absolute",
                inset: 0,
                background: "#e46a2e",
                color: "#fff",
                borderRadius: 12,
                padding: "1rem",
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "1.25rem", fontWeight: 900 }}>
                  Cumulative Score
                </div>
                <div style={{ fontSize: "3rem", fontWeight: 900, marginTop: ".25rem" }}>
                  {totalScore}
                </div>
                <div style={{ marginTop: ".75rem", opacity: 0.9 }}>
                  Tap to edit this frame
                </div>
              </div>
            </div>
          </div>

          {/* Submit/new game buttons BELOW scorecard (your requirement) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem", marginTop: "1rem" }}>
            <button
              onClick={newGame}
              style={{
                padding: ".85rem",
                borderRadius: 10,
                border: "2px solid #e46a2e",
                background: "#fff",
                color: "#e46a2e",
                fontWeight: 900
              }}
            >
              New Game
            </button>

            <button
              onClick={submitScore}
              disabled={!allFramesComplete()}
              style={{
                padding: ".85rem",
                borderRadius: 10,
                border: "none",
                background: "#e46a2e",
                color: "#fff",
                fontWeight: 900,
                opacity: allFramesComplete() ? 1 : 0.5,
                cursor: allFramesComplete() ? "pointer" : "default"
              }}
            >
              Submit Score
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}