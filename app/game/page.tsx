"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Mark = "C" | "S" | null;

type FrameState = {
  lane: number | null;
  r1: number | null;
  r2: number | null;
  r3: number | null;
  m1: Mark; // chop/split marker for roll1
  m2: Mark; // roll2
  m3: Mark; // roll3
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
  return typeof window !== "undefined" && typeof document !== "undefined";
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
  for (const p of parts) if (p.startsWith(key)) return decodeURIComponent(p.slice(key.length));
  return null;
}
function deleteCookie(name: string) {
  if (!isBrowser()) return;
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function range(min: number, max: number) {
  const out: number[] = [];
  for (let i = min; i <= max; i++) out.push(i);
  return out;
}

function readMarkCookie(raw: string | null): Mark {
  if (raw === "C") return "C";
  if (raw === "S") return "S";
  return null;
}

function initFramesFromCookiesClient(): FrameState[] {
  const frames: FrameState[] = [];
  for (let f = 1; f <= 10; f++) {
    const lane = getCookie(`frame${f}_lane`);
    const r1 = getCookie(`frame${f}_roll1`);
    const r2 = getCookie(`frame${f}_roll2`);
    const r3 = getCookie(`frame${f}_roll3`);

    const m1 = readMarkCookie(getCookie(`frame${f}_roll1_mark`));
    const m2 = readMarkCookie(getCookie(`frame${f}_roll2_mark`));
    const m3 = readMarkCookie(getCookie(`frame${f}_roll3_mark`));

    frames.push({
      lane: lane ? Number(lane) : null,
      r1: r1 !== null ? Number(r1) : null,
      r2: r2 !== null ? Number(r2) : null,
      r3: r3 !== null ? Number(r3) : null,
      m1,
      m2,
      m3
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
    deleteCookie(`frame${f}_roll1_mark`);
    deleteCookie(`frame${f}_roll2_mark`);
    deleteCookie(`frame${f}_roll3_mark`);
  }
}

function resetFrameCookies(frameNumber: number) {
  deleteCookie(`frame${frameNumber}_lane`);
  deleteCookie(`frame${frameNumber}_roll1`);
  deleteCookie(`frame${frameNumber}_roll2`);
  deleteCookie(`frame${frameNumber}_roll3`);
  deleteCookie(`frame${frameNumber}_roll1_mark`);
  deleteCookie(`frame${frameNumber}_roll2_mark`);
  deleteCookie(`frame${frameNumber}_roll3_mark`);
}

function frameComplete(frame: FrameState, frameNumber: number) {
  const { r1, r2, r3 } = frame;

  if (frameNumber < 10) {
    if (r1 === null) return false;
    if (r1 === 10) return true; // strike ends frame (1–9)
    if (r2 === null) return false;
    if (r1 + r2 === 10) return true; // spare in 2 ends frame (1–9)
    return r3 !== null; // otherwise need 3rd roll
  }

  // 10th frame: always 3 rolls in your tracker (no extra)
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
 * - 10th frame: no bonuses beyond, max 3 rolls
 */
function computeCumulative(frames: FrameState[]) {
  const cum: (number | null)[] = Array(10).fill(null);

  const rollStream: number[] = [];

  // frames 1-9 build stream
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

  // add 10th (no bonus beyond)
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

// 10th frame dropdown options per your rules
function optionsForRoll10th(r1: number | null, r2: number | null, roll: 1 | 2 | 3) {
  if (roll === 1) return range(0, 10);
  if (r1 === null) return [];

  if (roll === 2) {
    if (r1 === 10) return range(0, 10); // reset rack after strike
    return range(0, Math.max(0, 10 - r1)); // remaining
  }

  // roll 3
  if (r2 === null) return [];

  if (r1 === 10) {
    // second was on a full rack
    if (r2 === 10) return range(0, 10); // reset again
    return range(0, Math.max(0, 10 - r2)); // remaining from second rack
  }

  // first not strike
  if (r1 + r2 === 10) {
    // spare-in-2 => reset rack for third
    return range(0, 10);
  }

  // otherwise only remaining pins
  return range(0, Math.max(0, 10 - r1 - r2));
}

// frames 1-9 options
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

async function getMeUserId(): Promise<string | null> {
  try {
    const r = await fetch("/api/auth/me", { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.user?.id ?? null;
  } catch {
    return null;
  }
}

export default function GamePage() {
  const [mounted, setMounted] = useState(false);

  // meta
  const [gameId, setGameId] = useState<string>("");
  const [gameDate, setGameDate] = useState<string>(todayISO());
  const [location, setLocation] = useState<(typeof LOCATIONS)[number]>(LOCATIONS[0]);
  const [gameType, setGameType] = useState<(typeof GAME_TYPES)[number]>(GAME_TYPES[0]);
  const [gameNumber, setGameNumber] = useState<number>(1);

  // frames
  const [frames, setFrames] = useState<FrameState[]>(
    Array.from({ length: 10 }, () => ({
      lane: null,
      r1: null,
      r2: null,
      r3: null,
      m1: null,
      m2: null,
      m3: null
    }))
  );

  // carousel state
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // arrows
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [arrowTop, setArrowTop] = useState<number>(280);

  // submit UX
  const [toast, setToast] = useState<string | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    setMounted(true);

    // game id cookie
    const existing = getCookie("game_id");
    let id = existing ?? "";
    if (!id) {
      id = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();
      setCookie("game_id", id);
    }
    setGameId(id);

    // meta cookies
    setGameDate(getCookie("game_date") ?? todayISO());
    setLocation(((getCookie("game_location") as any) ?? LOCATIONS[0]) as any);
    setGameType(((getCookie("game_type") as any) ?? GAME_TYPES[0]) as any);
    setGameNumber(Number(getCookie("game_number") ?? "1"));

    // frames cookies
    const fr = initFramesFromCookiesClient();
    setFrames(fr);

    const fi = firstIncompleteFrame(fr);
    setIndex(fi);
  }, []);

  // persist meta cookies
  useEffect(() => {
    if (!mounted) return;
    setCookie("game_date", gameDate);
    setCookie("game_location", location);
    setCookie("game_type", gameType);
    setCookie("game_number", String(gameNumber));
  }, [mounted, gameDate, location, gameType, gameNumber]);

  // center arrows on card without lag (RAF-throttled)
  useEffect(() => {
    if (!mounted) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const el = cardRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const y = r.top + r.height / 2;
      setArrowTop(Math.max(90, Math.min(window.innerHeight - 90, y)));
    };

    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    schedule();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    const ro = new ResizeObserver(schedule);
    if (cardRef.current) ro.observe(cardRef.current);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) window.cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [mounted, index]);

  const cumulative = useMemo(() => computeCumulative(frames), [frames]);

  const currentFrameNumber = index + 1;
  const currentFrame = frames[index];

  const isFirst = index === 0;
  const isLast = index === 9;

  const currentAllowedIndex = firstIncompleteFrame(frames);
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

    if (patch.m1 !== undefined) {
      if (patch.m1 === null) deleteCookie(`frame${fnum}_roll1_mark`);
      else setCookie(`frame${fnum}_roll1_mark`, patch.m1);
    }
    if (patch.m2 !== undefined) {
      if (patch.m2 === null) deleteCookie(`frame${fnum}_roll2_mark`);
      else setCookie(`frame${fnum}_roll2_mark`, patch.m2);
    }
    if (patch.m3 !== undefined) {
      if (patch.m3 === null) deleteCookie(`frame${fnum}_roll3_mark`);
      else setCookie(`frame${fnum}_roll3_mark`, patch.m3);
    }
  }

  function rollOptions(roll: 1 | 2 | 3) {
    const { r1, r2 } = currentFrame;
    if (currentFrameNumber === 10) return optionsForRoll10th(r1, r2, roll);
    return optionsForRollStandard(r1, r2, roll);
  }

  function rollEnabled(roll: 1 | 2 | 3) {
    if (isFutureFrame) return false;

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
      setFrameValue(index, { r1: val, r2: null, r3: null, m2: null, m3: null });
      return;
    }
    if (roll === 2) {
      setFrameValue(index, { r2: val, r3: null, m3: null });
      return;
    }
    setFrameValue(index, { r3: val });
  }

  function setMark(roll: 1 | 2 | 3, val: Mark) {
    if (roll === 1) setFrameValue(index, { m1: val });
    if (roll === 2) setFrameValue(index, { m2: val });
    if (roll === 3) setFrameValue(index, { m3: val });
  }

  async function resetThisFrame() {
    resetFrameCookies(currentFrameNumber);
    setFrameValue(index, { lane: null, r1: null, r2: null, r3: null, m1: null, m2: null, m3: null });
    // ✅ no network
  }

  async function confirmFrame() {
    if (!frameComplete(currentFrame, currentFrameNumber) || isFutureFrame) return;

    setFlipped(false);

    const nowAllowed = firstIncompleteFrame(frames);
    if (index === nowAllowed && index < 9) setIndex(index + 1);
  }

  const allComplete = useMemo(() => {
    for (let i = 0; i < 10; i++) if (!frameComplete(frames[i], i + 1)) return false;
    return true;
  }, [frames]);

  function newGame() {
    clearAllGameCookies();

    const id = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();
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
      r3: null,
      m1: null,
      m2: null,
      m3: null
    }));
    setFrames(empty);
    setIndex(0);
    setFlipped(false);
  }

  function buildSubmitPayload() {
    return {
      game_id: gameId,
      played_date: gameDate,
      location_name: location,
      event_type_name: gameType,
      game_number: gameNumber,
      frames: frames.map((f, i) => ({
        frame_number: i + 1,
        lane: f.lane ?? null,
        r1: f.r1 ?? null,
        r2: f.r2 ?? null,
        r3: f.r3 ?? null,
        r1_mark: f.m1 ?? null,
        r2_mark: f.m2 ?? null,
        r3_mark: f.m3 ?? null
      }))
    };
  }

  async function onSubmitClick() {
    if (!allComplete || submitting) return;

    const userId = await getMeUserId();
    if (!userId) {
      setToast("You must log in first to submit your score.");
      return;
    }

    setShowSubmitConfirm(true);
  }

  async function submitScoreFinal() {
    if (!allComplete) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(buildSubmitPayload())
      });

      const j = await res.json().catch(() => null);

      if (!res.ok || !j?.ok) {
        setToast(j?.error || "Failed to submit score. Please try again.");
        return;
      }

      setToast("Score submitted!");
      setShowSubmitConfirm(false);

      clearAllGameCookies();
      newGame();
    } catch {
      setToast("Network error submitting score. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // display helpers
  const strike = isStrike(currentFrame);
  const spare2 = isSpareInTwo(currentFrame);
  const cumScore = cumulative[index];

  const r1Text = strike ? "X" : currentFrame.r1 !== null ? String(currentFrame.r1) : "";
  const r2Text = spare2 ? "/" : currentFrame.r2 !== null ? String(currentFrame.r2) : "";
  const r3Text = currentFrame.r3 !== null ? String(currentFrame.r3) : "";

  const m1 = currentFrame.m1;
  const m2 = currentFrame.m2;
  const m3 = currentFrame.m3;

  if (!mounted) {
    return <main style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "Montserrat, system-ui" }} />;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: BG,
        fontFamily: "Montserrat, system-ui",
        color: TEXT,
        padding: "2rem 1rem 3rem"
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

      <div style={{ position: "relative", zIndex: 1, maxWidth: 920, margin: "0 auto" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          <img
            src="/1@300x.png"
            alt="Dux Bowling"
            style={{ maxWidth: 160, height: "auto", filter: "drop-shadow(0 18px 40px rgba(0,0,0,0.6))" }}
          />
        </div>

        <header style={{ textAlign: "center", marginBottom: "1rem" }}>
          <h1 style={{ margin: 0, color: ORANGE, fontWeight: 950, letterSpacing: "-0.02em" }}>Game Tracker</h1>
          <p style={{ margin: ".5rem 0 0", color: MUTED, lineHeight: 1.6 }}>Track your duckpin score in real time.</p>
        </header>

        {/* Meta inputs */}
        <Panel style={{ marginBottom: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
            <label style={labelStyle}>
              Date
              <input type="date" value={gameDate} max={todayISO()} onChange={(e) => setGameDate(e.target.value)} style={inputStyle} />
            </label>

            <label style={labelStyle}>
              Location
              <select value={location} onChange={(e) => setLocation(e.target.value as any)} style={inputStyle}>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              Game Type
              <select value={gameType} onChange={(e) => setGameType(e.target.value as any)} style={inputStyle}>
                {GAME_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              Game Number
              <select value={gameNumber} onChange={(e) => setGameNumber(Number(e.target.value))} style={inputStyle}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ marginTop: ".75rem", color: MUTED, fontSize: ".85rem" }}>
            Game ID: <span style={{ color: TEXT, fontWeight: 900 }}>{gameId.slice(0, 8)}</span>
          </div>
        </Panel>

        {/* Fixed arrows aligned to card center */}
        <button
          onClick={goPrev}
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
            fontSize: "1.5rem",
            opacity: isFirst ? 0.5 : 1,
            cursor: isFirst ? "default" : "pointer",
            zIndex: 50,
            boxShadow: "0 18px 40px rgba(0,0,0,0.55)"
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
            right: 12,
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
            zIndex: 50,
            boxShadow: "0 18px 40px rgba(0,0,0,0.55)"
          }}
        >
          ›
        </button>

        {/* Card */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div ref={cardRef} style={{ width: "min(640px, 94vw)", height: 340, perspective: 1100, opacity: isFutureFrame ? 0.6 : 1 }}>
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
                onClick={() => {
                  if (isFutureFrame) return;
                  setFlipped(true);
                }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: PANEL,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 18,
                  padding: "1rem",
                  backfaceVisibility: "hidden",
                  boxShadow: "0 22px 55px rgba(0,0,0,0.55)",
                  backdropFilter: "blur(10px)",
                  cursor: isFutureFrame ? "not-allowed" : "pointer",
                  display: "grid",
                  gridTemplateRows: "auto 1fr auto",
                  gap: ".75rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 950, color: ORANGE, letterSpacing: "-0.02em" }}>Frame {currentFrameNumber}</div>
                  <div style={{ fontSize: ".85rem", color: MUTED }}>Cumulative</div>
                </div>

                <div
                  style={{
                    border: `2px solid ${ORANGE}`,
                    borderRadius: 14,
                    overflow: "hidden",
                    display: "grid",
                    gridTemplateRows: "84px 1fr",
                    background: "rgba(0,0,0,0.18)"
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `2px solid ${ORANGE}` }}>
                    <RollCell value={r1Text} isStrike={strike} mark={m1} rightBorder />
                    <RollCell value={r2Text} spareTriangle={spare2} mark={m2} rightBorder />
                    <RollCell value={r3Text} mark={m3} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ fontSize: "2.3rem", fontWeight: 950, color: ORANGE }}>{cumScore ?? "—"}</div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".9rem", color: MUTED }}>
                  <div>
                    Lane: <span style={{ color: TEXT, fontWeight: 900 }}>{currentFrame.lane ?? "—"}</span>
                  </div>
                  <div style={{ color: MUTED }}>{isFutureFrame ? "Complete earlier frames first" : "Tap to enter scores"}</div>
                </div>
              </div>

              {/* BACK */}
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: PANEL,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 18,
                  padding: "1rem",
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  boxShadow: "0 22px 55px rgba(0,0,0,0.55)",
                  backdropFilter: "blur(10px)",
                  display: "grid",
                  gridTemplateRows: "auto 1fr auto",
                  gap: ".75rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 950, color: ORANGE, letterSpacing: "-0.02em" }}>Frame {currentFrameNumber}</div>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (isFutureFrame) return;
                      await resetThisFrame();
                    }}
                    disabled={isFutureFrame}
                    style={{
                      border: `1px solid ${BORDER}`,
                      borderRadius: 999,
                      padding: ".45rem .8rem",
                      background: "rgba(0,0,0,0.22)",
                      color: TEXT,
                      fontWeight: 900,
                      opacity: isFutureFrame ? 0.5 : 1,
                      cursor: isFutureFrame ? "default" : "pointer"
                    }}
                  >
                    Reset frame
                  </button>
                </div>

                <div style={{ display: "grid", gap: ".75rem" }}>
                  <label style={labelStyle}>
                    Lane (optional)
                    <select
                      value={currentFrame.lane ?? ""}
                      onChange={(e) => setFrameValue(index, { lane: e.target.value ? Number(e.target.value) : null })}
                      style={inputStyle}
                    >
                      <option value="">—</option>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: ".75rem" }}>
                    <RollEntry
                      label="Roll 1"
                      value={currentFrame.r1}
                      enabled={rollEnabled(1)}
                      options={rollOptions(1)}
                      onChange={(v) => onRollChange(1, v)}
                      mark={currentFrame.m1}
                      onMarkChange={(m) => setMark(1, m)}
                    />
                    <RollEntry
                      label="Roll 2"
                      value={currentFrame.r2}
                      enabled={rollEnabled(2)}
                      options={rollOptions(2)}
                      onChange={(v) => onRollChange(2, v)}
                      mark={currentFrame.m2}
                      onMarkChange={(m) => setMark(2, m)}
                    />
                    <RollEntry
                      label="Roll 3"
                      value={currentFrame.r3}
                      enabled={rollEnabled(3)}
                      options={rollOptions(3)}
                      onChange={(v) => onRollChange(3, v)}
                      mark={currentFrame.m3}
                      onMarkChange={(m) => setMark(3, m)}
                    />
                  </div>
                </div>

                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await confirmFrame();
                  }}
                  disabled={!frameComplete(currentFrame, currentFrameNumber) || isFutureFrame}
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: 14,
                    padding: ".95rem",
                    fontWeight: 950,
                    background: ORANGE,
                    color: "#fff",
                    opacity: !frameComplete(currentFrame, currentFrameNumber) || isFutureFrame ? 0.6 : 1,
                    cursor: !frameComplete(currentFrame, currentFrameNumber) || isFutureFrame ? "default" : "pointer",
                    boxShadow: "0 18px 40px rgba(0,0,0,0.55)"
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div style={{ marginTop: "1.25rem", display: "grid", gap: ".75rem" }}>
          <button
            onClick={onSubmitClick}
            disabled={!allComplete || submitting}
            style={{
              width: "100%",
              border: "none",
              borderRadius: 18,
              padding: "1.05rem",
              fontWeight: 950,
              background: ORANGE,
              color: "#fff",
              opacity: allComplete && !submitting ? 1 : 0.6,
              cursor: allComplete && !submitting ? "pointer" : "default",
              boxShadow: "0 22px 55px rgba(0,0,0,0.55)"
            }}
          >
            {submitting ? "Submitting..." : "Submit Score"}
          </button>

          <button
            onClick={newGame}
            style={{
              width: "100%",
              border: `1px solid ${BORDER}`,
              borderRadius: 18,
              padding: "1.05rem",
              fontWeight: 950,
              background: "rgba(0,0,0,0.22)",
              color: TEXT
            }}
          >
            New Game
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 18,
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.78)",
            border: `1px solid ${BORDER}`,
            color: TEXT,
            padding: ".75rem 1rem",
            borderRadius: 14,
            fontWeight: 900,
            zIndex: 9999,
            boxShadow: "0 22px 55px rgba(0,0,0,0.65)",
            backdropFilter: "blur(10px)",
            maxWidth: "min(92vw, 520px)",
            textAlign: "center"
          }}
        >
          {toast}
        </div>
      )}

      {/* Submit confirmation modal */}
      {showSubmitConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => !submitting && setShowSubmitConfirm(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.62)",
            zIndex: 9998,
            display: "grid",
            placeItems: "center",
            padding: "1rem"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(92vw, 560px)",
              background: PANEL,
              border: `1px solid ${BORDER}`,
              borderRadius: 18,
              padding: "1rem",
              boxShadow: "0 22px 55px rgba(0,0,0,0.65)",
              backdropFilter: "blur(12px)"
            }}
          >
            <div style={{ fontWeight: 950, color: ORANGE, fontSize: "1.15rem", marginBottom: ".5rem" }}>
              Submit score?
            </div>

            <div style={{ color: MUTED, lineHeight: 1.6, fontWeight: 800 }}>
              Are you sure you want to submit your score? Once you have submitted your score, results are final and cannot
              be changed.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem", marginTop: "1rem" }}>
              <button
                onClick={() => !submitting && setShowSubmitConfirm(false)}
                disabled={submitting}
                style={{
                  border: `1px solid ${BORDER}`,
                  borderRadius: 14,
                  padding: ".95rem",
                  fontWeight: 950,
                  background: "rgba(0,0,0,0.22)",
                  color: TEXT,
                  opacity: submitting ? 0.6 : 1,
                  cursor: submitting ? "default" : "pointer"
                }}
              >
                No
              </button>

              <button
                onClick={submitScoreFinal}
                disabled={submitting}
                style={{
                  border: "none",
                  borderRadius: 14,
                  padding: ".95rem",
                  fontWeight: 950,
                  background: ORANGE,
                  color: "#fff",
                  opacity: submitting ? 0.7 : 1,
                  cursor: submitting ? "default" : "pointer",
                  boxShadow: "0 18px 40px rgba(0,0,0,0.55)"
                }}
              >
                {submitting ? "Submitting..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: PANEL,
        border: `1px solid ${BORDER}`,
        borderRadius: 18,
        padding: "1rem",
        boxShadow: "0 22px 55px rgba(0,0,0,0.55)",
        backdropFilter: "blur(10px)",
        ...style
      }}
    >
      {children}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: ".35rem",
  fontSize: ".9rem",
  color: MUTED,
  fontWeight: 900
};

const inputStyle: React.CSSProperties = {
  padding: ".7rem .75rem",
  borderRadius: 14,
  border: `1px solid ${BORDER}`,
  background: "rgba(0,0,0,0.22)",
  color: TEXT,
  outline: "none"
};

function RollCell({
  value,
  rightBorder,
  spareTriangle,
  isStrike,
  mark
}: {
  value: string;
  rightBorder?: boolean;
  spareTriangle?: boolean;
  isStrike?: boolean;
  mark: Mark;
}) {
  return (
    <div
      style={{
        position: "relative",
        borderRight: rightBorder ? `2px solid ${ORANGE}` : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.35rem",
        fontWeight: 950,
        background: isStrike ? ORANGE : "transparent",
        color: isStrike ? "#fff" : ORANGE
      }}
    >
      {spareTriangle && (
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, transparent 50%, rgba(228,106,46,0.35) 50%)` }} />
      )}

      {mark && (
        <div
          style={{
            position: "absolute",
            top: 6,
            left: 8,
            fontSize: ".75rem",
            fontWeight: 950,
            color: isStrike ? "#fff" : ORANGE,
            opacity: 0.95
          }}
        >
          {mark}
        </div>
      )}

      <span style={{ position: "relative" }}>{value}</span>
    </div>
  );
}

function RollEntry({
  label,
  value,
  enabled,
  options,
  onChange,
  mark,
  onMarkChange
}: {
  label: string;
  value: number | null;
  enabled: boolean;
  options: number[];
  onChange: (v: number | null) => void;
  mark: Mark;
  onMarkChange: (m: Mark) => void;
}) {
  return (
    <div style={{ display: "grid", gap: ".5rem" }}>
      <label style={{ display: "grid", gap: ".25rem", fontSize: ".85rem", fontWeight: 950, color: MUTED }}>
        {label}
        <select
          value={value ?? ""}
          disabled={!enabled}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          style={{
            padding: ".65rem .7rem",
            borderRadius: 14,
            border: `1px solid ${BORDER}`,
            background: "rgba(0,0,0,0.22)",
            color: TEXT,
            outline: "none",
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
      </label>

      <label style={{ display: "grid", gap: ".25rem", fontSize: ".8rem", fontWeight: 950, color: MUTED }}>
        Chop / Split
        <select
          value={mark ?? ""}
          onChange={(e) => onMarkChange((e.target.value === "" ? null : (e.target.value as any)) as Mark)}
          style={{
            padding: ".55rem .7rem",
            borderRadius: 14,
            border: `1px solid ${BORDER}`,
            background: "rgba(0,0,0,0.22)",
            color: TEXT,
            outline: "none"
          }}
        >
          <option value="">—</option>
          <option value="C">Chop</option>
          <option value="S">Split</option>
        </select>
      </label>
    </div>
  );
}