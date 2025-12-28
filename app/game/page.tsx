"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Duckpin assumptions used here (matches your cookie scheme up to roll3):
 * - Frames 1–9: up to 3 rolls, frame max 10 pins. Strike ends frame immediately.
 * - Frame 10: supports bonus behavior *within roll2/roll3*:
 *    - If roll1 is strike (10), roll2 and roll3 are bonus rolls (0–10 each).
 *    - If spare achieved by roll2 (roll1 + roll2 == 10), roll3 is a bonus roll (0–10).
 *    - Otherwise roll3 is normal and capped so total <= 10.
 *
 * This stays within frame10_roll1..roll3 (no roll4 cookie).
 */

type FrameRolls = {
  r1: number | null;
  r2: number | null;
  r3: number | null;
};

const ORANGE = "#e46a2e";
const CREAM = "#f5f0e6";
const TEXT_ORANGE = "#c75a1d";

function cookieGet(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(^| )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]+)")
  );
  return match ? decodeURIComponent(match[2]) : null;
}

function cookieSet(name: string, value: string, days = 14) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; expires=${expires}; path=/; SameSite=Lax`;
}

function cookieDel(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isStrike(frameIndex: number, f: FrameRolls) {
  // frameIndex 0-based
  return f.r1 === 10 && frameIndex < 10;
}

function isSpare(frameIndex: number, f: FrameRolls) {
  const r1 = f.r1 ?? 0;
  const r2 = f.r2 ?? 0;
  const r3 = f.r3 ?? 0;
  if (frameIndex < 9) {
    // Frames 1–9: spare if 10 achieved in roll2 or roll3 (but not strike on roll1)
    if (f.r1 === 10) return false;
    return r1 + r2 === 10 || r1 + r2 + r3 === 10;
  }
  // Frame 10: treat spare as reaching 10 by roll2 (for bonus roll3),
  // or by roll3 (no extra bonus beyond r3 in this cookie scheme).
  if (f.r1 === 10) return false;
  return r1 + r2 === 10 || r1 + r2 + r3 === 10;
}

function frameRollCount(frameIndex: number, f: FrameRolls) {
  // how many rolls are "consumed" by the frame when flattening for scoring
  if (frameIndex === 9) return 3; // frame 10 always has 3 stored slots
  if (f.r1 === 10) return 1;
  if (f.r1 == null || f.r2 == null) return 0; // incomplete
  const r1 = f.r1 ?? 0;
  const r2 = f.r2 ?? 0;
  if (r1 + r2 === 10) return 2;
  if (f.r3 == null) return 0;
  return 3;
}

function flattenRolls(frames: FrameRolls[]) {
  const out: number[] = [];
  for (let i = 0; i < 10; i++) {
    const f = frames[i];
    if (!f) continue;

    if (i === 9) {
      // tenth frame: include any entered rolls (up to 3)
      if (f.r1 != null) out.push(f.r1);
      if (f.r2 != null) out.push(f.r2);
      if (f.r3 != null) out.push(f.r3);
      continue;
    }

    if (f.r1 == null) break;

    if (f.r1 === 10) {
      out.push(10);
      continue;
    }

    if (f.r2 == null) break;
    out.push(f.r1, f.r2);

    const r1 = f.r1 ?? 0;
    const r2 = f.r2 ?? 0;

    if (r1 + r2 === 10) {
      // spare in 2
      continue;
    }

    if (f.r3 == null) break;
    out.push(f.r3);
  }
  return out;
}

/**
 * Duckpin scoring:
 * - Strike bonus: next 2 rolls
 * - Spare bonus: next 1 roll
 * - Frames 1-9 may have 1/2/3 rolls (strike/spare/open)
 * - Frame 10 uses the stored 3 rolls as-is (bonus rolls already live there)
 */
function scoreDuckpin(frames: FrameRolls[]) {
  const rolls = flattenRolls(frames);

  let total = 0;
  let rollIdx = 0;

  for (let frame = 0; frame < 10; frame++) {
    const f = frames[frame];
    if (!f) break;

    if (frame === 9) {
      // 10th frame: just sum entered rolls (up to 3)
      const r1 = f.r1 ?? 0;
      const r2 = f.r2 ?? 0;
      const r3 = f.r3 ?? 0;
      // only count what is actually entered
      let tenth = 0;
      if (f.r1 != null) tenth += r1;
      if (f.r2 != null) tenth += r2;
      if (f.r3 != null) tenth += r3;
      total += tenth;
      break;
    }

    const r1 = rolls[rollIdx] ?? null;
    if (r1 == null) break;

    // Strike
    if (r1 === 10) {
      const b1 = rolls[rollIdx + 1] ?? 0;
      const b2 = rolls[rollIdx + 2] ?? 0;
      total += 10 + b1 + b2;
      rollIdx += 1;
      continue;
    }

    const r2 = rolls[rollIdx + 1] ?? null;
    if (r2 == null) break;

    // Spare in 2?
    if (r1 + r2 === 10) {
      const b = rolls[rollIdx + 2] ?? 0;
      total += 10 + b;
      rollIdx += 2;
      continue;
    }

    const r3 = rolls[rollIdx + 2] ?? null;
    if (r3 == null) break;

    // Spare in 3?
    if (r1 + r2 + r3 === 10) {
      const b = rolls[rollIdx + 3] ?? 0;
      total += 10 + b;
      rollIdx += 3;
      continue;
    }

    // Open
    total += r1 + r2 + r3;
    rollIdx += 3;
  }

  return total;
}

function makeEmptyFrames(): FrameRolls[] {
  return Array.from({ length: 10 }, () => ({ r1: null, r2: null, r3: null }));
}

function frameIsComplete(frameIndex: number, f: FrameRolls): boolean {
  if (frameIndex === 9) {
    // tenth: we consider it complete when r1 and r2 are entered and:
    // - strike on r1 => r2 and r3 should be entered (bonus rolls)
    // - spare on r2 => r3 should be entered (bonus roll)
    // - otherwise: r3 can be null only if strike? no, strike requires r2+r3; otherwise r3 may be needed if not spare by 2
    if (f.r1 == null || f.r2 == null) return false;

    const r1 = f.r1 ?? 0;
    const r2 = f.r2 ?? 0;

    if (r1 === 10) return f.r3 != null; // need 2 bonus rolls total (r2+r3)
    if (r1 + r2 === 10) return f.r3 != null; // bonus roll
    // open tenth: if r1+r2 < 10, then r3 is normal third roll and required
    return f.r3 != null;
  }

  // frames 1-9
  if (f.r1 == null) return false;
  if (f.r1 === 10) return true;
  if (f.r2 == null) return false;
  const r1 = f.r1 ?? 0;
  const r2 = f.r2 ?? 0;
  if (r1 + r2 === 10) return true; // spare in 2 ends frame
  return f.r3 != null;
}

function getCurrentFrameIndex(frames: FrameRolls[]) {
  for (let i = 0; i < 10; i++) {
    if (!frameIsComplete(i, frames[i])) return i;
  }
  return 9;
}

function optionsForRoll(frameIndex: number, roll: 1 | 2 | 3, f: FrameRolls) {
  const r1 = f.r1 ?? 0;
  const r2 = f.r2 ?? 0;

  // Frame 10 special behavior (within 3 rolls only)
  if (frameIndex === 9) {
    if (roll === 1) return range(0, 10);

    // if r1 not selected yet, no options
    if (f.r1 == null) return [];

    // Strike on roll1 => roll2 & roll3 are bonus (0-10)
    if (f.r1 === 10) return range(0, 10);

    if (roll === 2) {
      // normal roll2 capped so frame doesn't exceed 10 (so you can reach spare)
      return range(0, 10 - r1);
    }

    // roll3:
    if (f.r2 == null) return [];

    // if spare achieved by roll2 => bonus roll3 0-10
    if (r1 + r2 === 10) return range(0, 10);

    // otherwise normal third roll capped to remaining pins
    return range(0, 10 - (r1 + r2));
  }

  // Frames 1–9
  if (roll === 1) return range(0, 10);

  if (roll === 2) {
    if (f.r1 == null) return [];
    if (f.r1 === 10) return []; // strike ends frame
    return range(0, 10 - r1);
  }

  // roll 3
  if (f.r1 == null || f.r2 == null) return [];
  if (f.r1 === 10) return [];
  if (r1 + r2 === 10) return []; // spare ends frame
  return range(0, 10 - (r1 + r2));
}

function range(min: number, max: number) {
  const out: number[] = [];
  for (let i = min; i <= max; i++) out.push(i);
  return out;
}

export default function GamePage() {
  // Carousel viewing index
  const [index, setIndex] = useState(0);

  // Which card is flipped (editing)
  const [flipped, setFlipped] = useState(false);

  // Which frame is being edited (must be <= currentFrameIndex)
  const [editingFrame, setEditingFrame] = useState<number | null>(null);

  // Stored game state
  const [gameId, setGameId] = useState<string>("");

  const [frames, setFrames] = useState<FrameRolls[]>(makeEmptyFrames());

  // Local draft while editing a frame (forces re-entry starting roll1)
  const [draft, setDraft] = useState<FrameRolls>({ r1: null, r2: null, r3: null });

  // Load cookies on first mount
  useEffect(() => {
    // game id
    const existing = cookieGet("game_id");
    const id = existing || (typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now()));
    setGameId(id);
    if (!existing) cookieSet("game_id", id);

    // frames rolls
    const loaded = makeEmptyFrames();
    for (let f = 1; f <= 10; f++) {
      for (let r = 1; r <= 3; r++) {
        const key = `frame${f}_roll${r}`;
        const val = cookieGet(key);
        if (val != null && val !== "") {
          const num = Number(val);
          if (!Number.isNaN(num)) {
            if (r === 1) loaded[f - 1].r1 = clampInt(num, 0, 10);
            if (r === 2) loaded[f - 1].r2 = clampInt(num, 0, 10);
            if (r === 3) loaded[f - 1].r3 = clampInt(num, 0, 10);
          }
        }
      }
    }
    setFrames(loaded);
  }, []);

  // Persist frame cookies whenever frames change
  useEffect(() => {
    for (let f = 1; f <= 10; f++) {
      const fr = frames[f - 1];
      cookieSet(`frame${f}_roll1`, fr.r1 == null ? "" : String(fr.r1));
      cookieSet(`frame${f}_roll2`, fr.r2 == null ? "" : String(fr.r2));
      cookieSet(`frame${f}_roll3`, fr.r3 == null ? "" : String(fr.r3));
    }
  }, [frames]);

  const currentFrameIndex = useMemo(() => getCurrentFrameIndex(frames), [frames]);
  const totalScore = useMemo(() => scoreDuckpin(frames), [frames]);

  const isFirst = index === 0;
  const isLast = index === 9;

  function prev() {
    if (!isFirst) {
      setIndex(index - 1);
      setFlipped(false);
      setEditingFrame(null);
    }
  }

  function next() {
    if (!isLast) {
      setIndex(index + 1);
      setFlipped(false);
      setEditingFrame(null);
    }
  }

  function beginEdit(frameIdx: number) {
    // Only current frame or earlier frames may be edited
    if (frameIdx > currentFrameIndex) return;

    setEditingFrame(frameIdx);
    setDraft({ r1: null, r2: null, r3: null }); // force re-entry from roll1
    setFlipped(true);
  }

  function setDraftRoll(roll: 1 | 2 | 3, value: number) {
    setDraft(prev => {
      const nextDraft: FrameRolls = { ...prev };

      if (roll === 1) {
        nextDraft.r1 = value;
        nextDraft.r2 = null;
        nextDraft.r3 = null;
      } else if (roll === 2) {
        nextDraft.r2 = value;
        nextDraft.r3 = null;
      } else {
        nextDraft.r3 = value;
      }

      // Apply early frame-ending logic for frames 1–9
      if (editingFrame != null && editingFrame < 9) {
        if (nextDraft.r1 === 10) {
          nextDraft.r2 = null;
          nextDraft.r3 = null;
        } else if (nextDraft.r1 != null && nextDraft.r2 != null) {
          if ((nextDraft.r1 ?? 0) + (nextDraft.r2 ?? 0) === 10) {
            nextDraft.r3 = null; // spare ends frame
          }
        }
      }

      return nextDraft;
    });
  }

  function canSubmitDraft(): boolean {
    if (editingFrame == null) return false;

    // Must follow order:
    if (draft.r1 == null) return false;

    // Frames 1-9: strike ends immediately
    if (editingFrame < 9 && draft.r1 === 10) return true;

    // Need roll2 next
    if (draft.r2 == null) return false;

    // Frames 1-9: spare in 2 ends frame
    if (editingFrame < 9 && (draft.r1 ?? 0) + (draft.r2 ?? 0) === 10) return true;

    // Otherwise need roll3 for frames 1–9
    if (editingFrame < 9) return draft.r3 != null;

    // Frame 10 logic:
    // - if strike on r1 => need r2 & r3
    // - if spare on r2 => need r3
    // - else open => need r3
    if (editingFrame === 9) {
      if (draft.r1 == null || draft.r2 == null) return false;
      return draft.r3 != null;
    }

    return false;
  }

  function submitDraft() {
    if (editingFrame == null) return;
    if (!canSubmitDraft()) return;

    setFrames(prev => {
      const nextFrames = [...prev];
      nextFrames[editingFrame] = { ...draft };
      return nextFrames;
    });

    setFlipped(false);
    setEditingFrame(null);
  }

  function clearCookiesAndReset() {
    cookieDel("game_id");
    for (let f = 1; f <= 10; f++) {
      for (let r = 1; r <= 3; r++) {
        cookieDel(`frame${f}_roll${r}`);
      }
    }

    const newId =
      typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now());
    cookieSet("game_id", newId);
    setGameId(newId);
    setFrames(makeEmptyFrames());
    setIndex(0);
    setFlipped(false);
    setEditingFrame(null);
    setDraft({ r1: null, r2: null, r3: null });
  }

  // Per-frame display values
  const frameLabel = `Frame ${index + 1}`;
  const frame = frames[index];

  const frameEntered = [frame.r1, frame.r2, frame.r3].filter(v => v != null) as number[];
  const framePins = frameEntered.reduce((a, b) => a + b, 0);

  const editable = index <= currentFrameIndex;

  const frontSubtitle =
    index < currentFrameIndex
      ? "Completed (tap to edit)"
      : index === currentFrameIndex
      ? "Current frame (tap to enter)"
      : "Locked (finish earlier frames)";

  // Draft options
  const d = draft;
  const roll1Options = editingFrame != null ? optionsForRoll(editingFrame, 1, d) : [];
  const roll2Options = editingFrame != null ? optionsForRoll(editingFrame, 2, d) : [];
  const roll3Options = editingFrame != null ? optionsForRoll(editingFrame, 3, d) : [];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: CREAM,
        fontFamily: "Montserrat, system-ui",
        padding: "2rem"
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <img src="/1@300x.png" alt="Dux Bowling" style={{ maxWidth: 180 }} />
      </div>

      {/* Header / Status */}
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto 1.5rem",
          textAlign: "center",
          color: TEXT_ORANGE
        }}
      >
        <h1 style={{ margin: 0 }}>Duckpin Score Entry (Test)</h1>
        <p style={{ margin: "0.5rem 0 0" }}>
          Game ID: <span style={{ opacity: 0.85 }}>{gameId || "…"}</span>
        </p>
        <p style={{ margin: "0.5rem 0 0" }}>
          Total Score: <strong>{totalScore}</strong>
        </p>
      </div>

      {/* Carousel Row (full width so arrows can sit near screen edges but move with card) */}
      <div
        style={{
          width: "100%",
          maxWidth: 980,
          margin: "0 auto",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 3.25rem" // keeps card wide while leaving arrow space
        }}
      >
        {/* Left Arrow (moves with card as page scrolls; fixed distance from left via wrapper edges) */}
        <button
          onClick={prev}
          disabled={isFirst}
          aria-label="Previous frame"
          style={{
            position: "absolute",
            left: 0,
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
            cursor: isFirst ? "default" : "pointer"
          }}
        >
          ‹
        </button>

        {/* Card */}
        <div
          onClick={() => {
            // click toggles flip only if editable
            if (!editable) return;

            // if not already editing, begin edit for this frame
            if (!flipped) beginEdit(index);
            else setFlipped(false);
          }}
          style={{
            width: "min(520px, 100%)",
            height: 260,
            perspective: 1000,
            cursor: editable ? "pointer" : "not-allowed"
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
            {/* Front */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#fff",
                borderRadius: 12,
                padding: "1.25rem",
                backfaceVisibility: "hidden",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                textAlign: "center"
              }}
            >
              <h2 style={{ color: ORANGE, marginBottom: "0.25rem" }}>
                {frameLabel}
              </h2>
              <p style={{ margin: 0, color: TEXT_ORANGE, opacity: 0.9 }}>
                {frontSubtitle}
              </p>

              <div style={{ marginTop: "1rem", color: "#333" }}>
                <p style={{ margin: "0.25rem 0" }}>
                  Rolls:{" "}
                  <strong>
                    {frame.r1 ?? "—"} / {frame.r2 ?? "—"} / {frame.r3 ?? "—"}
                  </strong>
                </p>
                <p style={{ margin: "0.25rem 0" }}>
                  Frame pins: <strong>{frameEntered.length ? framePins : "—"}</strong>
                </p>
                <p style={{ margin: "0.25rem 0" }}>
                  Cumulative score: <strong>{totalScore}</strong>
                </p>
              </div>

              {!editable && (
                <p style={{ marginTop: "0.75rem", color: "#999" }}>
                  Finish earlier frames to unlock this one.
                </p>
              )}
            </div>

            {/* Back (Entry form) */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: ORANGE,
                color: "#fff",
                borderRadius: 12,
                padding: "1.25rem",
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                textAlign: "center"
              }}
              onClick={(e) => {
                // prevent outer click from immediately flipping
                e.stopPropagation();
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "0.75rem" }}>
                Enter Rolls for {frameLabel}
              </h3>

              {/* Roll selectors */}
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginBottom: "1rem"
                }}
              >
                <RollSelect
                  label="Roll 1"
                  value={draft.r1}
                  options={roll1Options}
                  disabled={editingFrame == null}
                  onChange={(v) => setDraftRoll(1, v)}
                />

                <RollSelect
                  label="Roll 2"
                  value={draft.r2}
                  options={roll2Options}
                  disabled={draft.r1 == null || (editingFrame != null && editingFrame < 9 && draft.r1 === 10)}
                  onChange={(v) => setDraftRoll(2, v)}
                />

                <RollSelect
                  label="Roll 3"
                  value={draft.r3}
                  options={roll3Options}
                  disabled={
                    draft.r1 == null ||
                    draft.r2 == null ||
                    (editingFrame != null && editingFrame < 9 && draft.r1 === 10) ||
                    (editingFrame != null && editingFrame < 9 && (draft.r1 ?? 0) + (draft.r2 ?? 0) === 10)
                  }
                  onChange={(v) => setDraftRoll(3, v)}
                />
              </div>

              <button
                onClick={submitDraft}
                disabled={!canSubmitDraft()}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: 10,
                  border: "none",
                  background: canSubmitDraft() ? "#fff" : "rgba(255,255,255,0.55)",
                  color: ORANGE,
                  fontSize: "1rem",
                  cursor: canSubmitDraft() ? "pointer" : "default",
                  fontWeight: 700
                }}
              >
                Rolls are correct
              </button>

              <p style={{ marginTop: "0.75rem", fontSize: "0.9rem", opacity: 0.9 }}>
                Editing rule: if you edit a prior frame, you must re-enter that
                frame starting from Roll 1.
              </p>
            </div>
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={next}
          disabled={isLast}
          aria-label="Next frame"
          style={{
            position: "absolute",
            right: 0,
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
            cursor: isLast ? "default" : "pointer"
          }}
        >
          ›
        </button>
      </div>

      {/* Footer buttons */}
      <div
        style={{
          maxWidth: 720,
          margin: "2rem auto 0",
          display: "flex",
          gap: "1rem",
          justifyContent: "center",
          flexWrap: "wrap"
        }}
      >
        <button
          onClick={() => {
            // "Submit Score" clears cookies (and would later send to DB)
            clearCookiesAndReset();
          }}
          style={{
            padding: "0.75rem 1rem",
            borderRadius: 10,
            border: "none",
            background: ORANGE,
            color: "#fff",
            fontSize: "1rem",
            cursor: "pointer",
            minWidth: 160
          }}
        >
          Submit Score
        </button>

        <button
          onClick={clearCookiesAndReset}
          style={{
            padding: "0.75rem 1rem",
            borderRadius: 10,
            border: `2px solid ${ORANGE}`,
            background: "transparent",
            color: ORANGE,
            fontSize: "1rem",
            cursor: "pointer",
            minWidth: 160
          }}
        >
          New Game
        </button>
      </div>

      <p
        style={{
          maxWidth: 720,
          margin: "1.25rem auto 0",
          textAlign: "center",
          color: "#8a6a55",
          fontSize: "0.9rem"
        }}
      >
        Tip: Your progress is saved in cookies so you can refresh or come back
        if the page times out. “Submit Score” or “New Game” clears saved data.
      </p>
    </main>
  );
}

function RollSelect(props: {
  label: string;
  value: number | null;
  options: number[];
  disabled: boolean;
  onChange: (v: number) => void;
}) {
  const { label, value, options, disabled, onChange } = props;

  return (
    <div style={{ minWidth: 92 }}>
      <div style={{ fontSize: "0.9rem", marginBottom: "0.35rem" }}>{label}</div>
      <select
        value={value == null ? "" : String(value)}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          padding: "0.55rem",
          borderRadius: 10,
          border: "none",
          outline: "none",
          fontSize: "1rem"
        }}
      >
        <option value="" disabled>
          —
        </option>
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}