"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import dynamic from "next/dynamic";
import ReactECharts from "echarts-for-react";
import type { AvatarState } from "@/app/avatar/BowlerCharacter";

// ─── Dynamic imports (no SSR) ─────────────────────────────────────────────────
const DashboardAvatarScene = dynamic(
  () => import("@/app/components/DashboardAvatarScene"),
  { ssr: false }
);
const QrScannerModal = dynamic(() => import("@/app/components/QrScannerModal"), { ssr: false });

// ─── Design tokens ────────────────────────────────────────────────────────────
const ORANGE  = "#e46a2e";
const BG      = "#0d0d14";
const PANEL   = "rgba(20,20,32,0.92)";
const PANEL2  = "rgba(26,26,40,0.88)";
const BORDER  = "rgba(255,255,255,0.09)";
const TEXT    = "#f2f2f2";
const MUTED   = "rgba(242,242,242,0.65)";
const CYAN    = "#38d9f5";
const GOLD    = "#f5c842";

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterOption     = { label: string; value: string };
type HistogramBucket  = { label: string; start: number; end: number; count: number };
type RollingPoint     = { t: string; strikePct: number; sparePct: number };
type FrameBreakdown   = { strikes: number; spares: number; opens: number; splits: number };
type RecentGame       = { date: string; score: number; gameType: string };
type PinLeaveFreq     = Record<number, number>; // pin 1-10 → 0..1 (0=never left, 1=always left)
type PersonalRecords  = { highGame: number; highSeries: number; bestStrikeStreak: number; bestSpareStreak: number };

type StatsResponse = {
  ok: boolean;
  gamesPlayed:  number;
  average:      number;
  median:       number;
  high:         number;
  low:          number;
  stddev:       number;
  scores:       number[];
  histogram:    HistogramBucket[];
  kpi?:         { strikePct: number; sparePct: number };
  rolling?:     RollingPoint[];
  filterOptions?: { alleys: FilterOption[]; lanes: FilterOption[]; gameTypes: FilterOption[] };
  frameBreakdown?: FrameBreakdown;
  recentGames?:    RecentGame[];
  pinLeaveFreq?:   PinLeaveFreq;
  personalRecords?: PersonalRecords;
};

type Filters = { alleyId: string; lane: string; gameType: string };
type Mood    = "celebrate" | "idle" | "thinking";

// ─── Default avatar state ─────────────────────────────────────────────────────
const DEFAULT_AVATAR: AvatarState = {
  skinToneIdx: 3,
  hairStyle:   "short",
  hairColor:   "brown",
  eyeColor:    "brown",
  faceShape:   "oval",
  facialHair:  "none",
  outfit:      "bowling-shirt",
  accessories: [],
  bgColor:     "#1a1a2e",
  gender:      "male",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) { return (Math.round(n * 10) / 10).toString(); }
function clamp01(n: number) { return !Number.isFinite(n) ? 0 : Math.max(0, Math.min(1, n)); }

function computeMood(stats: StatsResponse | null): Mood {
  if (!stats || stats.gamesPlayed === 0) return "thinking";
  const sp = stats.kpi?.strikePct ?? 0;
  if (sp >= 0.38) return "celebrate";
  if (sp < 0.15 && stats.gamesPlayed > 3) return "thinking";
  return "idle";
}

function getBowlerRating(stats: StatsResponse | null): number {
  if (!stats || stats.gamesPlayed === 0) return 0;
  const avgScore  = clamp01((stats.average - 50) / 250) * 40;   // 0-40 pts
  const strikeW   = clamp01(stats.kpi?.strikePct ?? 0) * 30;   // 0-30 pts
  const spareW    = clamp01(stats.kpi?.sparePct  ?? 0) * 20;   // 0-20 pts
  const gamesW    = clamp01(stats.gamesPlayed / 50) * 10;      // 0-10 pts
  return Math.round(avgScore + strikeW + spareW + gamesW);
}

function getAvatarMessage(stats: StatsResponse | null, mood: Mood): string {
  if (!stats) return "Loading your stats…";
  if (stats.gamesPlayed === 0) return "No games yet — bowl a game to unlock your analytics!";
  const sp  = stats.kpi?.strikePct ?? 0;
  const spp = stats.kpi?.sparePct  ?? 0;
  if (mood === "celebrate") return `🔥 ${Math.round(sp * 100)}% strike rate is elite! Keep hammering!`;
  if (mood === "thinking")  return `Let's focus on your approach — spare conversion will lift your average.`;
  if (spp < 0.4) return `Your strikes are solid. Let's clean up those spares to break ${Math.round(stats.average / 10) * 10 + 10}!`;
  return `Avg ${fmt(stats.average)} across ${stats.gamesPlayed} game${stats.gamesPlayed !== 1 ? "s" : ""}. Looking good!`;
}

// ─── PIN POSITIONS (triangle layout, index 1-10) ──────────────────────────────
const PIN_POS: Record<number, [number, number]> = {
  7: [0, 0],  8: [1, 0],  9: [2, 0], 10: [3, 0],
     4: [0.5, 1],  5: [1.5, 1],  6: [2.5, 1],
        2: [1, 2],    3: [2, 2],
           1: [1.5, 3],
};

// ─── Chart helpers ────────────────────────────────────────────────────────────
function gaugeOption(label: string, value01: number) {
  const val = clamp01(value01) * 100;
  return {
    backgroundColor: "transparent",
    series: [
      {
        type: "gauge", startAngle: 210, endAngle: -30,
        radius: "100%", center: ["50%", "58%"], min: 0, max: 100,
        axisLine: { lineStyle: { width: 14, color: [[1, "rgba(255,255,255,0.08)"]] } },
        axisTick: { show: false }, splitLine: { show: false },
        axisLabel: { show: false }, pointer: { show: false },
        detail: { show: false }, title: { show: false },
        data: [{ value: 100 }]
      },
      {
        name: label, type: "gauge", startAngle: 210, endAngle: -30,
        radius: "100%", center: ["50%", "58%"], min: 0, max: 100,
        axisLine: {
          lineStyle: {
            width: 14,
            color: [[val / 100, ORANGE], [1, "rgba(255,255,255,0.08)"]],
            shadowBlur: 20, shadowColor: "rgba(228,106,46,0.4)"
          }
        },
        axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
        pointer: { show: true, length: "65%", width: 4 },
        itemStyle: { color: ORANGE, shadowBlur: 14, shadowColor: "rgba(228,106,46,0.6)" },
        title: {
          show: true, offsetCenter: [0, "72%"],
          color: MUTED, fontSize: 11, fontWeight: 900
        },
        detail: {
          valueAnimation: true, formatter: (v: number) => `${Math.round(v)}%`,
          offsetCenter: [0, "22%"], color: "#fff", fontSize: 26, fontWeight: 950
        },
        data: [{ value: val, name: label }]
      }
    ]
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Shine() {
  return (
    <div aria-hidden style={{
      pointerEvents: "none", position: "absolute", inset: 0, borderRadius: "inherit",
      background:
        "linear-gradient(135deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.02) 25%,transparent 50%)," +
        "radial-gradient(600px 200px at 10% 0%,rgba(228,106,46,0.18),transparent 55%)"
    }} />
  );
}

function ExhibitHeader({ n, title, icon }: { n: number; title: string; icon: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: ".65rem", marginBottom: "1.1rem" }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, background: ORANGE,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 950, fontSize: ".72rem", color: "#fff", flexShrink: 0,
        boxShadow: `0 0 12px rgba(228,106,46,0.5)`
      }}>{n}</div>
      <span style={{ fontSize: ".78rem", color: "rgba(228,106,46,0.7)", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase" }}>
        {icon} {title}
      </span>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)", borderRadius: 1 }} />
    </div>
  );
}

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 20,
      padding: "1.1rem", boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
      backdropFilter: "blur(12px)", position: "relative", overflow: "hidden",
      ...style
    }}>{children}</div>
  );
}

function KpiCard({ label, value, sub, color = TEXT }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div style={{
      background: PANEL2, border: `1px solid ${BORDER}`, borderRadius: 14,
      padding: ".7rem .85rem", position: "relative", overflow: "hidden",
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)"
    }}>
      <Shine />
      <div style={{ fontSize: ".7rem", fontWeight: 900, color: MUTED, textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div>
      <div style={{ fontSize: "1.55rem", fontWeight: 950, color, marginTop: ".2rem", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: ".68rem", color: MUTED, marginTop: ".2rem" }}>{sub}</div>}
    </div>
  );
}

// ─── Pin Leave Map ─────────────────────────────────────────────────────────────
function PinLeaveMap({ freq }: { freq: PinLeaveFreq }) {
  const maxVal = Math.max(...Object.values(freq), 0.001);
  const CELL = 44;
  const cols = 4;
  const rows = 4;

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <svg width={cols * CELL + 20} height={rows * CELL + 20} style={{ overflow: "visible" }}>
        {Object.entries(PIN_POS).map(([pinStr, [col, row]]) => {
          const pin = Number(pinStr);
          const raw = freq[pin] ?? 0;
          const pct = raw / maxVal;
          // Color: low=cyan, mid=orange, high=red
          const r = Math.round(pct < 0.5 ? pct * 2 * (228 - 56) + 56 : 228);
          const g = Math.round(pct < 0.5 ? pct * 2 * (106 - 217) + 217 : Math.max(0, 106 - (pct - 0.5) * 2 * 106));
          const b = Math.round(pct < 0.5 ? (1 - pct * 2) * 245 + pct * 2 * 46 : 46);
          const fill = `rgb(${r},${g},${b})`;
          const cx = col * CELL + 10 + CELL / 2;
          const cy = (3 - row) * CELL + 10 + CELL / 2;
          return (
            <g key={pin}>
              <circle cx={cx} cy={cy} r={16} fill={fill} opacity={0.85}
                style={{ filter: `drop-shadow(0 0 ${6 + pct * 8}px ${fill})` }} />
              <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
                fill="#fff" fontSize={10} fontWeight="900" style={{ pointerEvents: "none" }}>
                {pin}
              </text>
              <text x={cx} y={cy + 13} textAnchor="middle" dominantBaseline="middle"
                fill="rgba(255,255,255,0.7)" fontSize={7} fontWeight="700">
                {raw > 0 ? `${Math.round(pct * 100)}%` : ""}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Recent Games List ────────────────────────────────────────────────────────
function RecentGameRow({ game, rank }: { game: RecentGame; rank: number }) {
  const color = game.score >= 120 ? GOLD : game.score >= 90 ? ORANGE : MUTED;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: ".7rem",
      padding: ".55rem .7rem", borderRadius: 10,
      background: rank % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
    }}>
      <div style={{ fontSize: ".72rem", color: MUTED, width: 18, textAlign: "right", flexShrink: 0 }}>#{rank}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: ".82rem", fontWeight: 900, color }}>{game.score}</div>
        <div style={{ fontSize: ".65rem", color: MUTED }}>{game.gameType} · {game.date}</div>
      </div>
      <div style={{
        fontSize: ".65rem", padding: "2px 8px", borderRadius: 20,
        background: game.score >= 120 ? "rgba(245,200,66,0.15)" : "rgba(228,106,46,0.12)",
        color: game.score >= 120 ? GOLD : ORANGE, fontWeight: 900,
      }}>
        {game.score >= 130 ? "Elite" : game.score >= 110 ? "Great" : game.score >= 90 ? "Good" : "OK"}
      </div>
    </div>
  );
}

// ─── Stat Badge ───────────────────────────────────────────────────────────────
function StatBadge({ icon, label, value, color = ORANGE }: {
  icon: string; label: string; value: string | number; color?: string
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: ".3rem",
      background: "rgba(255,255,255,0.03)", border: `1px solid rgba(255,255,255,0.07)`,
      borderRadius: 14, padding: ".75rem .6rem", flex: "1 1 100px",
    }}>
      <div style={{ fontSize: "1.4rem" }}>{icon}</div>
      <div style={{ fontSize: "1.15rem", fontWeight: 950, color }}>{value}</div>
      <div style={{ fontSize: ".62rem", color: MUTED, textAlign: "center", fontWeight: 700 }}>{label}</div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div style={{ minWidth: 160, flex: "1 1 160px" }}>
      <div style={{ fontSize: ".72rem", fontWeight: 900, color: MUTED, marginBottom: ".3rem", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{
        width: "100%", background: "rgba(0,0,0,0.3)", border: `1px solid ${BORDER}`,
        borderRadius: 10, color: TEXT, padding: ".6rem .7rem",
        fontWeight: 900, outline: "none", appearance: "none", fontFamily: "Montserrat,system-ui"
      }}>
        {options.map((o) => (
          <option key={`${o.label}:${o.value}`} value={o.value} style={{ background: "#111", color: "#fff" }}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Bowler Rating Ring ────────────────────────────────────────────────────────
function BowlerRatingRing({ rating }: { rating: number }) {
  const pct = rating / 100;
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  const color = rating >= 70 ? GOLD : rating >= 45 ? ORANGE : CYAN;
  const label = rating >= 70 ? "Elite" : rating >= 55 ? "Advanced" : rating >= 40 ? "Intermediate" : rating >= 25 ? "Developing" : "Beginner";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: ".35rem" }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} />
        <circle
          cx={50} cy={50} r={r} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: "stroke-dasharray 1.2s ease" }}
        />
        <text x={50} y={47} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={18} fontWeight="900">{rating}</text>
        <text x={50} y={63} textAnchor="middle" dominantBaseline="middle" fill={MUTED} fontSize={8} fontWeight="700">/ 100</text>
      </svg>
      <div style={{ fontSize: ".72rem", fontWeight: 900, color, textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BowlerDashboardPage() {
  const [loading, setLoading]         = useState(true);
  const [loggedIn, setLoggedIn]       = useState(false);
  const [stats, setStats]             = useState<StatsResponse | null>(null);
  const [err, setErr]                 = useState<string | null>(null);
  const [filters, setFilters]         = useState<Filters>({ alleyId: "", lane: "", gameType: "" });
  const [showLaneScanner, setShowLaneScanner] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const meRes = await fetch("/api/auth/me", { cache: "no-store" });
        if (!meRes.ok) { setLoggedIn(false); setStats(null); return; }
        const me = await meRes.json();
        const userId: string | undefined = me?.user?.id;
        if (!userId) { setLoggedIn(false); setStats(null); return; }
        setLoggedIn(true);
        const qs = new URLSearchParams();
        if (filters.alleyId) qs.set("alleyId", filters.alleyId);
        if (filters.lane)    qs.set("lane",    filters.lane);
        if (filters.gameType) qs.set("gameType", filters.gameType);
        const sRes = await fetch(`/api/game/stats?${qs.toString()}`, { cache: "no-store" });
        const data = (await sRes.json()) as StatsResponse;
        if (!sRes.ok || !data?.ok) { setErr("Unable to load stats right now."); setStats(null); return; }
        setStats(data);
      } catch {
        setErr("Unable to load stats right now."); setStats(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters.alleyId, filters.lane, filters.gameType]);

  const mood    = computeMood(stats);
  const rating  = getBowlerRating(stats);
  const message = getAvatarMessage(stats, mood);
  const strikePct = stats?.kpi?.strikePct ?? 0;
  const sparePct  = stats?.kpi?.sparePct  ?? 0;

  // Frame breakdown donut
  const frameDonutOption = useMemo(() => {
    const fb = stats?.frameBreakdown ?? { strikes: 0, spares: 0, opens: 0, splits: 0 };
    const total = fb.strikes + fb.spares + fb.opens + fb.splits || 1;
    return {
      backgroundColor: "transparent",
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: { bottom: 0, textStyle: { color: MUTED, fontWeight: 900, fontSize: 11 } },
      series: [{
        type: "pie", radius: ["42%", "72%"], center: ["50%", "44%"],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 900 } },
        data: [
          { value: fb.strikes, name: "Strike",  itemStyle: { color: GOLD,   shadowBlur: 12, shadowColor: GOLD } },
          { value: fb.spares,  name: "Spare",   itemStyle: { color: ORANGE, shadowBlur: 8,  shadowColor: ORANGE } },
          { value: fb.opens,   name: "Open",    itemStyle: { color: CYAN,   shadowBlur: 6,  shadowColor: CYAN } },
          { value: fb.splits,  name: "Split",   itemStyle: { color: "#a78bfa" } },
        ].filter(d => d.value > 0)
      }]
    };
  }, [stats?.frameBreakdown]);

  // Score histogram
  const histogramOption = useMemo(() => ({
    backgroundColor: "transparent",
    grid: { left: 12, right: 12, top: 12, bottom: 28, containLabel: true },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: {
      type: "category", data: stats?.histogram?.map(b => b.label) ?? [],
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
      axisLabel: { color: MUTED, fontSize: 10 }
    },
    yAxis: {
      type: "value", minInterval: 1, axisLine: { show: false },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
      axisLabel: { color: MUTED, fontSize: 10 }
    },
    series: [{
      type: "bar", data: stats?.histogram?.map(b => b.count) ?? [],
      barWidth: 16,
      itemStyle: { color: ORANGE, borderRadius: [8, 8, 0, 0], shadowBlur: 14, shadowColor: "rgba(228,106,46,0.35)" }
    }]
  }), [stats?.histogram]);

  // Rolling trend
  const rollingOption = useMemo(() => {
    const pts = stats?.rolling ?? [];
    return {
      backgroundColor: "transparent",
      grid: { left: 12, right: 12, top: 14, bottom: 34, containLabel: true },
      tooltip: { trigger: "axis" },
      legend: { top: 0, textStyle: { color: MUTED, fontWeight: 900, fontSize: 11 } },
      xAxis: {
        type: "category", data: pts.map(p => p.t), boundaryGap: false,
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
        axisLabel: { color: MUTED, hideOverlap: true, fontSize: 10 }
      },
      yAxis: {
        type: "value", min: 0, max: 100, axisLine: { show: false },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
        axisLabel: { color: MUTED, formatter: "{value}%", fontSize: 10 }
      },
      series: [
        {
          name: "Strike %", type: "line",
          data: pts.map(p => Math.round(clamp01(p.strikePct) * 1000) / 10),
          smooth: true, symbol: "none",
          lineStyle: { width: 3, color: GOLD }, areaStyle: { opacity: 0.08, color: GOLD }
        },
        {
          name: "Spare %", type: "line",
          data: pts.map(p => Math.round(clamp01(p.sparePct) * 1000) / 10),
          smooth: true, symbol: "none",
          lineStyle: { width: 3, color: ORANGE }, areaStyle: { opacity: 0.06, color: ORANGE }
        }
      ]
    };
  }, [stats?.rolling]);

  function handleLaneScan(text: string) {
    setShowLaneScanner(false);
    try {
      const url = new URL(text);
      const session = url.searchParams.get("session");
      if (session) { window.location.href = `/game?session=${encodeURIComponent(session)}`; return; }
    } catch { /* ignore */ }
    window.location.href = `/game?session=${encodeURIComponent(text)}`;
  }

  // Responsive helper (CSS string only — no matchMedia on server)
  const isStats = !loading && loggedIn && !err && stats;

  return (
    <main ref={mainRef} style={{
      minHeight: "100vh", background: BG, fontFamily: "Montserrat,system-ui",
      color: TEXT, paddingBottom: "4rem"
    }}>
      {showLaneScanner && (
        <QrScannerModal
          title="Scan Lane QR"
          hint="Point at the QR code shown on the lane screen above your lane"
          onScan={handleLaneScan}
          onClose={() => setShowLaneScanner(false)}
        />
      )}

      {/* Background atmosphere */}
      <div aria-hidden style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background:
          "radial-gradient(900px 500px at 15% 0%,  rgba(228,106,46,0.18),  transparent 58%)," +
          "radial-gradient(700px 400px at 85% 20%, rgba(56,217,245,0.08),  transparent 55%)," +
          "radial-gradient(600px 350px at 50% 90%, rgba(245,200,66,0.06),  transparent 60%)"
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1080, margin: "0 auto", padding: "1.5rem 1rem 0" }}>

        {/* ── Logo ── */}
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <img src="/1@300x.png" alt="Dux Bowling" style={{ maxWidth: 140, height: "auto", filter: "drop-shadow(0 14px 32px rgba(0,0,0,0.6))" }} />
        </div>

        {/* ── HERO: Avatar + Rating + KPIs ── */}
        <div data-rsp="hero-2col" style={{
          display: "grid",
          gridTemplateColumns: "clamp(220px,36%,360px) 1fr",
          gap: "1rem",
          marginBottom: "1.2rem",
          alignItems: "start"
        }}>
          {/* Avatar panel */}
          <Panel style={{ padding: 0, overflow: "hidden" }}>
            {/* 3D Canvas */}
            <div style={{ height: 320, position: "relative" }}>
              <DashboardAvatarScene state={DEFAULT_AVATAR} mood={mood} />

              {/* Speech bubble */}
              <div style={{
                position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)",
                background: "rgba(13,13,20,0.92)", border: `1px solid rgba(228,106,46,0.35)`,
                borderRadius: 12, padding: ".55rem .85rem",
                maxWidth: "88%", width: "max-content",
                backdropFilter: "blur(8px)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)"
              }}>
                <div style={{ fontSize: ".72rem", fontWeight: 900, color: ORANGE, marginBottom: ".18rem" }}>Your Bowler</div>
                <div style={{ fontSize: ".68rem", color: TEXT, lineHeight: 1.45 }}>{message}</div>
                {/* Bubble tail */}
                <div style={{
                  position: "absolute", bottom: -9, left: "50%", transform: "translateX(-50%)",
                  width: 0, height: 0,
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderTop: "9px solid rgba(228,106,46,0.35)"
                }} />
              </div>
            </div>

            {/* Rating bar below canvas */}
            <div style={{
              padding: ".9rem 1rem",
              display: "flex", alignItems: "center", gap: "1rem",
              borderTop: `1px solid ${BORDER}`
            }}>
              <BowlerRatingRing rating={rating} />
              <div>
                <div style={{ fontSize: ".72rem", color: MUTED, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em" }}>Bowler Rating</div>
                <div style={{ fontSize: ".65rem", color: MUTED, lineHeight: 1.5, marginTop: ".25rem" }}>
                  Composite score based on average, strike %, spare % and games played.
                </div>
              </div>
            </div>
          </Panel>

          {/* Right: join + filters + quick KPIs */}
          <div style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
            {/* Join a Lane */}
            {loggedIn && (
              <Panel style={{ padding: ".85rem 1rem" }}>
                <Shine />
                <div style={{ display: "flex", alignItems: "center", gap: ".9rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontWeight: 900, fontSize: ".82rem", color: ORANGE, marginBottom: ".2rem" }}>🎳 Ready to bowl?</div>
                    <div style={{ fontSize: ".68rem", color: MUTED, lineHeight: 1.45 }}>
                      Scan the QR on the lane screen to join a session and track your score live.
                    </div>
                  </div>
                  <button onClick={() => setShowLaneScanner(true)} style={{
                    padding: ".6rem 1rem", borderRadius: 10, border: 0,
                    background: ORANGE, color: "#fff", fontWeight: 900, fontSize: ".78rem",
                    cursor: "pointer", fontFamily: "Montserrat,system-ui", whiteSpace: "nowrap"
                  }}>📷 Scan Lane QR</button>
                </div>
              </Panel>
            )}

            {/* Filters */}
            <Panel style={{ padding: ".85rem 1rem" }}>
              <Shine />
              <div style={{ display: "flex", gap: ".65rem", flexWrap: "wrap" }}>
                <FilterSelect
                  label="Alley" value={filters.alleyId}
                  onChange={(v) => setFilters(s => ({ ...s, alleyId: v, lane: "" }))}
                  options={[{ label: "All alleys", value: "" }, ...(stats?.filterOptions?.alleys ?? [])]}
                />
                <FilterSelect
                  label="Lane" value={filters.lane}
                  onChange={(v) => setFilters(s => ({ ...s, lane: v }))}
                  options={[{ label: "All lanes", value: "" }, ...(stats?.filterOptions?.lanes ?? [])]}
                />
                <FilterSelect
                  label="Game Type" value={filters.gameType}
                  onChange={(v) => setFilters(s => ({ ...s, gameType: v }))}
                  options={[{ label: "All types", value: "" }, ...(stats?.filterOptions?.gameTypes ?? [])]}
                />
              </div>
            </Panel>

            {/* Quick KPIs */}
            {isStats && (
              <div data-rsp="kpi-3col" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: ".65rem" }}>
                <KpiCard label="Games" value={stats.gamesPlayed} />
                <KpiCard label="Average" value={fmt(stats.average)} color={ORANGE} />
                <KpiCard label="High Score" value={stats.high} color={GOLD} />
                <KpiCard label="Median" value={fmt(stats.median)} />
                <KpiCard label="Low Score" value={stats.low} />
                <KpiCard label="Std Dev" value={fmt(stats.stddev)} />
              </div>
            )}

            {/* Loading / not logged in states */}
            {loading && <Panel><p style={{ margin: 0, color: MUTED }}>Loading…</p></Panel>}
            {!loading && !loggedIn && <Panel><p style={{ margin: 0 }}>Please log in to view your stats.</p></Panel>}
            {!loading && loggedIn && err && <Panel><p style={{ margin: 0 }}>{err}</p></Panel>}
          </div>
        </div>

        {/* ── EXHIBITS (only show when we have data) ── */}
        {isStats && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Exhibit 1: Accuracy Lab */}
            <Panel>
              <Shine />
              <ExhibitHeader n={1} title="Accuracy Lab" icon="🎯" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: ".85rem" }}>
                <div>
                  <div style={{ fontSize: ".78rem", fontWeight: 900, color: MUTED, marginBottom: ".25rem" }}>Strike Rate</div>
                  <div style={{ height: 200 }}>
                    <ReactECharts option={gaugeOption("Strike %", strikePct)} style={{ height: "100%", width: "100%" }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: ".78rem", fontWeight: 900, color: MUTED, marginBottom: ".25rem" }}>Spare Conversion</div>
                  <div style={{ height: 200 }}>
                    <ReactECharts option={gaugeOption("Spare %", sparePct)} style={{ height: "100%", width: "100%" }} />
                  </div>
                  <div style={{ fontSize: ".67rem", color: MUTED, marginTop: ".25rem" }}>
                    Excludes strikes and split/chop frames.
                  </div>
                </div>
              </div>
            </Panel>

            {/* Exhibit 2: Frame Analysis + Pin Leave Map (side by side) */}
            <div data-rsp="side-by-side" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

              {/* Frame Breakdown */}
              <Panel>
                <Shine />
                <ExhibitHeader n={2} title="Frame Breakdown" icon="📊" />
                {stats.frameBreakdown ? (
                  <>
                    <div style={{ height: 220 }}>
                      <ReactECharts option={frameDonutOption} style={{ height: "100%", width: "100%" }} />
                    </div>
                    <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap", marginTop: ".5rem" }}>
                      {[
                        { label: "Strikes", value: stats.frameBreakdown.strikes, color: GOLD },
                        { label: "Spares",  value: stats.frameBreakdown.spares,  color: ORANGE },
                        { label: "Opens",   value: stats.frameBreakdown.opens,   color: CYAN },
                        { label: "Splits",  value: stats.frameBreakdown.splits,  color: "#a78bfa" },
                      ].map(item => (
                        <div key={item.label} style={{
                          flex: "1 1 60px", padding: ".35rem .4rem", borderRadius: 8,
                          background: "rgba(255,255,255,0.03)", border: `1px solid rgba(255,255,255,0.06)`,
                          textAlign: "center"
                        }}>
                          <div style={{ fontSize: ".95rem", fontWeight: 950, color: item.color }}>{item.value}</div>
                          <div style={{ fontSize: ".58rem", color: MUTED, fontWeight: 700 }}>{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p style={{ color: MUTED, margin: 0, fontSize: ".82rem" }}>Frame-level data not yet available.</p>
                )}
              </Panel>

              {/* Pin Leave Map */}
              <Panel>
                <Shine />
                <ExhibitHeader n={3} title="Pin Leave Map" icon="🎳" />
                {stats.pinLeaveFreq ? (
                  <>
                    <PinLeaveMap freq={stats.pinLeaveFreq} />
                    <div style={{ marginTop: ".65rem", fontSize: ".67rem", color: MUTED, lineHeight: 1.5 }}>
                      Brighter / redder = left standing more often after first ball. Focus on your most common leaves.
                    </div>
                    <div style={{ display: "flex", gap: ".35rem", marginTop: ".5rem" }}>
                      {[{ label: "Rare", color: CYAN }, { label: "Common", color: ORANGE }, { label: "Frequent", color: "#e84040" }].map(l => (
                        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: ".3rem", fontSize: ".62rem", color: MUTED }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                          {l.label}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p style={{ color: MUTED, margin: 0, fontSize: ".82rem" }}>Pin-level data not yet available.</p>
                )}
              </Panel>
            </div>

            {/* Exhibit 4: Score History */}
            <Panel>
              <Shine />
              <ExhibitHeader n={4} title="Score History" icon="📈" />
              <div data-rsp="side-by-side" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: ".72rem", fontWeight: 900, color: MUTED, marginBottom: ".4rem", textTransform: "uppercase", letterSpacing: ".06em" }}>Distribution</div>
                  {stats.histogram.length === 0
                    ? <p style={{ color: MUTED, margin: 0, fontSize: ".82rem" }}>No data yet.</p>
                    : <div style={{ height: 220 }}>
                        <ReactECharts option={histogramOption} style={{ height: "100%", width: "100%" }} />
                      </div>
                  }
                </div>
                <div>
                  <div style={{ fontSize: ".72rem", fontWeight: 900, color: MUTED, marginBottom: ".4rem", textTransform: "uppercase", letterSpacing: ".06em" }}>Rolling Trend</div>
                  {(stats.rolling?.length ?? 0) === 0
                    ? <p style={{ color: MUTED, margin: 0, fontSize: ".82rem" }}>Not enough games yet.</p>
                    : <div style={{ height: 220 }}>
                        <ReactECharts option={rollingOption} style={{ height: "100%", width: "100%" }} />
                      </div>
                  }
                </div>
              </div>
            </Panel>

            {/* Exhibit 5: Recent Games */}
            {stats.recentGames && stats.recentGames.length > 0 && (
              <Panel>
                <Shine />
                <ExhibitHeader n={5} title="Recent Games" icon="🕹️" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: ".4rem" }}>
                  {stats.recentGames.map((g, i) => <RecentGameRow key={i} game={g} rank={i + 1} />)}
                </div>
              </Panel>
            )}

            {/* Exhibit 6: Personal Records */}
            {stats.personalRecords && (
              <Panel>
                <Shine />
                <ExhibitHeader n={6} title="Personal Records" icon="🏆" />
                <div style={{ display: "flex", gap: ".65rem", flexWrap: "wrap" }}>
                  <StatBadge icon="🎳" label="High Game"    value={stats.personalRecords.highGame}          color={GOLD}   />
                  <StatBadge icon="🎯" label="High Series"  value={stats.personalRecords.highSeries}        color={ORANGE} />
                  <StatBadge icon="🔥" label="Best Strike Streak" value={`${stats.personalRecords.bestStrikeStreak}x`} color={GOLD} />
                  <StatBadge icon="✅" label="Best Spare Streak"  value={`${stats.personalRecords.bestSpareStreak}x`}  color={CYAN} />
                </div>
              </Panel>
            )}
          </div>
        )}
      </div>

      {/* Responsive overrides — globals.css handles [data-rsp] rules */}
      <style>{`
        @media (max-width: 640px) {
          /* Compact padding on mobile */
          [data-rsp="hero-2col"] { padding: 0 !important; }
        }
        @media (max-width: 900px) {
          /* Avatar canvas shorter on tablet portrait */
          [data-rsp="hero-2col"] > *:first-child > div[style*="height: 320px"] {
            height: 260px !important;
          }
        }
      `}</style>
    </main>
  );
}
