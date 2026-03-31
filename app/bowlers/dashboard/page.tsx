"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import ReactECharts from "echarts-for-react";

const QrScannerModal = dynamic(() => import("@/app/components/QrScannerModal"), { ssr: false });

const ORANGE = "#e46a2e";
const BG = "#121212";
const PANEL = "rgba(26,26,26,0.88)";
const BORDER = "rgba(255,255,255,0.10)";
const TEXT = "#f2f2f2";
const MUTED = "rgba(242,242,242,0.75)";

type HistogramBucket = { label: string; start: number; end: number; count: number };

type RollingPoint = {
  t: string; // "YYYY-MM-DD"
  strikePct: number; // 0..1
  sparePct: number; // 0..1
};

type FilterOption = { label: string; value: string };

type StatsResponse = {
  ok: boolean;
  gamesPlayed: number;
  average: number;
  median: number;
  high: number;
  low: number;
  stddev: number;
  scores: number[];
  histogram: HistogramBucket[];

  kpi?: { strikePct: number; sparePct: number };
  rolling?: RollingPoint[];
  filterOptions?: {
    alleys: FilterOption[];
    lanes: FilterOption[];
    gameTypes: FilterOption[];
  };
};

type Filters = {
  alleyId: string;
  lane: string;
  gameType: string;
};

export default function BowlerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({ alleyId: "", lane: "", gameType: "" });
  const [showLaneScanner, setShowLaneScanner] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const meRes = await fetch("/api/auth/me", { cache: "no-store" });
        if (!meRes.ok) {
          setLoggedIn(false);
          setStats(null);
          return;
        }

        const me = await meRes.json();
        const userId: string | undefined = me?.user?.id;

        if (!userId) {
          setLoggedIn(false);
          setStats(null);
          return;
        }

        setLoggedIn(true);

        const qs = new URLSearchParams();
        if (filters.alleyId) qs.set("alleyId", filters.alleyId);
        if (filters.lane) qs.set("lane", filters.lane);
        if (filters.gameType) qs.set("gameType", filters.gameType);

        const sRes = await fetch(`/api/game/stats?${qs.toString()}`, { cache: "no-store" });
        const data = (await sRes.json()) as StatsResponse;

        if (!sRes.ok || !data?.ok) {
          setErr("Unable to load stats right now.");
          setStats(null);
          return;
        }

        setStats(data);
      } catch {
        setErr("Unable to load stats right now.");
        setStats(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters.alleyId, filters.lane, filters.gameType]);

  const strikePct = stats?.kpi?.strikePct ?? 0;
  const sparePct = stats?.kpi?.sparePct ?? 0;

  const gaugeOption = (label: string, value01: number) => {
    const val = clamp01(value01) * 100;

    return {
      backgroundColor: "transparent",
      tooltip: { formatter: "{b}: {c}%" },
      series: [
        {
          // faint track ring
          type: "gauge",
          startAngle: 210,
          endAngle: -30,
          radius: "100%",
          center: ["50%", "58%"],
          min: 0,
          max: 100,
          axisLine: { lineStyle: { width: 12, color: [[1, "rgba(255,255,255,0.10)"]] } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          pointer: { show: false },
          detail: { show: false },
          title: { show: false },
          data: [{ value: 100 }]
        },
        {
          name: label,
          type: "gauge",
          startAngle: 210,
          endAngle: -30,
          radius: "100%",
          center: ["50%", "58%"],
          min: 0,
          max: 100,
          axisLine: {
            lineStyle: {
              width: 12,
              color: [[val / 100, ORANGE], [1, "rgba(255,255,255,0.10)"]],
              shadowBlur: 18,
              shadowColor: "rgba(228,106,46,0.35)"
            }
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          pointer: { show: true, length: "68%", width: 4 },
          itemStyle: { color: ORANGE, shadowBlur: 12, shadowColor: "rgba(228,106,46,0.50)" },
          title: {
            show: true,
            offsetCenter: [0, "70%"],
            color: "rgba(242,242,242,0.85)",
            fontSize: 12,
            fontWeight: 900
          },
          detail: {
            valueAnimation: true,
            formatter: (v: number) => `${Math.round(v)}%`,
            offsetCenter: [0, "22%"],
            color: "#fff",
            fontSize: 22,
            fontWeight: 950
          },
          data: [{ value: val, name: label }]
        }
      ]
    };
  };

  const histogramOption = useMemo(() => {
    const labels = stats?.histogram?.map((b) => b.label) ?? [];
    const values = stats?.histogram?.map((b) => b.count) ?? [];

    return {
      backgroundColor: "transparent",
      grid: { left: 12, right: 12, top: 18, bottom: 28, containLabel: true },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      xAxis: {
        type: "category",
        data: labels,
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.18)" } },
        axisLabel: { color: "rgba(242,242,242,0.70)" }
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
        axisLabel: { color: "rgba(242,242,242,0.65)" }
      },
      series: [
        {
          type: "bar",
          data: values,
          barWidth: 18,
          itemStyle: {
            color: ORANGE,
            borderRadius: [10, 10, 10, 10],
            shadowBlur: 18,
            shadowColor: "rgba(0,0,0,0.35)"
          }
        }
      ]
    };
  }, [stats?.histogram]);

  const rollingOption = useMemo(() => {
    const pts = stats?.rolling ?? [];
    const x = pts.map((p) => p.t);
    const s = pts.map((p) => Math.round(clamp01(p.strikePct) * 1000) / 10);
    const sp = pts.map((p) => Math.round(clamp01(p.sparePct) * 1000) / 10);

    return {
      backgroundColor: "transparent",
      grid: { left: 12, right: 12, top: 18, bottom: 34, containLabel: true },
      tooltip: { trigger: "axis" },
      legend: { top: 0, textStyle: { color: "rgba(242,242,242,0.75)", fontWeight: 900 } },
      xAxis: {
        type: "category",
        data: x,
        boundaryGap: false,
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.18)" } },
        axisLabel: { color: "rgba(242,242,242,0.70)", hideOverlap: true }
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
        axisLabel: { color: "rgba(242,242,242,0.65)", formatter: "{value}%" }
      },
      series: [
        {
          name: "Strike %",
          type: "line",
          data: s,
          smooth: true,
          symbol: "none",
          lineStyle: { width: 3, color: ORANGE },
          areaStyle: { opacity: 0.08 }
        },
        {
          name: "Spare % (Clean)",
          type: "line",
          data: sp,
          smooth: true,
          symbol: "none",
          lineStyle: { width: 3, color: "rgba(242,242,242,0.75)" },
          areaStyle: { opacity: 0.05 }
        }
      ]
    };
  }, [stats?.rolling]);

  function handleLaneScan(text: string) {
    setShowLaneScanner(false);
    // The lane screen QR encodes /game?session=xxx — navigate directly
    try {
      const url = new URL(text);
      // Accept both /game?session= and /simulators/lane-screen?session= QR codes
      const session = url.searchParams.get("session");
      if (session) {
        window.location.href = `/game?session=${encodeURIComponent(session)}`;
      } else {
        window.location.href = text;
      }
    } catch {
      window.location.href = `/game?session=${encodeURIComponent(text)}`;
    }
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
      {showLaneScanner && (
        <QrScannerModal
          title="Scan Lane QR"
          hint="Point at the QR code shown on the lane screen above your lane"
          onScan={handleLaneScan}
          onClose={() => setShowLaneScanner(false)}
        />
      )}
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

      <div style={{ position: "relative", zIndex: 1, maxWidth: 980, margin: "0 auto" }}>
        {/* Logo */}
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

        <header style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          <h1 style={{ margin: 0, color: ORANGE, fontWeight: 950, letterSpacing: "-0.02em" }}>
            Bowler Dashboard
          </h1>
          <p style={{ margin: ".5rem 0 0", color: MUTED, lineHeight: 1.6 }}>
            Your stats based on completed games recorded to your account.
          </p>
        </header>

        {/* Join a Lane */}
        {loggedIn && (
          <div style={{
            marginBottom: "1rem",
            padding: ".75rem 1rem",
            background: "rgba(228,106,46,0.08)",
            border: "1px solid rgba(228,106,46,0.25)",
            borderRadius: 12,
            display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
          }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontWeight: 900, fontSize: ".88rem", color: ORANGE, marginBottom: 2 }}>
                🎳 Ready to bowl?
              </div>
              <div style={{ fontSize: ".72rem", color: MUTED, lineHeight: 1.5 }}>
                Scan the QR code on the lane screen above your lane to join the session and track your score in real time.
              </div>
            </div>
            <button
              onClick={() => setShowLaneScanner(true)}
              style={{
                padding: ".65rem 1.1rem", borderRadius: 10, border: 0,
                background: ORANGE, color: "#fff",
                fontWeight: 900, fontSize: ".82rem", cursor: "pointer",
                fontFamily: "Montserrat, system-ui", whiteSpace: "nowrap",
              }}
            >
              📷 Scan Lane QR
            </button>
          </div>
        )}

        {/* Filters */}
        <Panel style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
            <FilterSelect
              label="Alley"
              value={filters.alleyId}
              onChange={(v) => setFilters((s) => ({ ...s, alleyId: v, lane: "" }))}
              options={[
                { label: "All alleys", value: "" },
                ...(stats?.filterOptions?.alleys ?? [])
              ]}
            />
            <FilterSelect
              label="Lane"
              value={filters.lane}
              onChange={(v) => setFilters((s) => ({ ...s, lane: v }))}
              options={[
                { label: "All lanes", value: "" },
                ...(stats?.filterOptions?.lanes ?? [])
              ]}
            />
            <FilterSelect
              label="Game Type"
              value={filters.gameType}
              onChange={(v) => setFilters((s) => ({ ...s, gameType: v }))}
              options={[
                { label: "All types", value: "" },
                ...(stats?.filterOptions?.gameTypes ?? [])
              ]}
            />
          </div>
        </Panel>

        {/* States */}
        {loading && (
          <Panel>
            <p style={{ margin: 0, color: MUTED }}>Loading…</p>
          </Panel>
        )}

        {!loading && !loggedIn && (
          <Panel>
            <p style={{ margin: 0, color: TEXT, fontWeight: 850 }}>Please log in to view stats.</p>
          </Panel>
        )}

        {!loading && loggedIn && err && (
          <Panel>
            <p style={{ margin: 0, color: TEXT, fontWeight: 850 }}>{err}</p>
          </Panel>
        )}

        {!loading && loggedIn && !err && stats && (
          <>
            {/* KPI Dials */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: ".85rem",
                marginTop: "1rem"
              }}
            >
              <Panel>
                <div style={{ position: "relative" }}>
                  <Shine />
                  <div style={{ color: "rgba(242,242,242,0.80)", fontSize: ".85rem", fontWeight: 900 }}>
                    Strike % (Frames)
                  </div>
                  <div style={{ height: 190, marginTop: ".25rem" }}>
                    <ReactECharts option={gaugeOption("Strike %", strikePct)} style={{ height: "100%", width: "100%" }} />
                  </div>
                </div>
              </Panel>

              <Panel>
                <div style={{ position: "relative" }}>
                  <Shine />
                  <div style={{ color: "rgba(242,242,242,0.80)", fontSize: ".85rem", fontWeight: 900 }}>
                    Spare % (Clean)
                  </div>
                  <div style={{ height: 190, marginTop: ".25rem" }}>
                    <ReactECharts option={gaugeOption("Spare %", sparePct)} style={{ height: "100%", width: "100%" }} />
                  </div>
                  <div style={{ marginTop: ".15rem", color: MUTED, fontSize: ".78rem", lineHeight: 1.35 }}>
                    Excludes strikes + frames where ball 1 was marked Chop or Split.
                  </div>
                </div>
              </Panel>
            </div>

            {/* Stat grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: ".85rem",
                marginTop: "1rem"
              }}
            >
              <StatCard label="Games Played" value={stats.gamesPlayed} />
              <StatCard label="Average" value={fmt(stats.average)} />
              <StatCard label="Median" value={fmt(stats.median)} />
              <StatCard label="High Score" value={stats.high} />
              <StatCard label="Low Score" value={stats.low} />
              <StatCard label="Std. Deviation" value={fmt(stats.stddev)} />
            </div>

            {/* Rolling Trend */}
            <Panel style={{ marginTop: "1rem" }}>
              <div style={{ position: "relative" }}>
                <Shine />
                <h2 style={{ margin: "0 0 .75rem", color: ORANGE, fontWeight: 950, fontSize: "1.05rem" }}>
                  Rolling Average Over Time (last 50 frames)
                </h2>

                {(stats.rolling?.length ?? 0) === 0 ? (
                  <p style={{ margin: 0, color: MUTED }}>No rolling data yet.</p>
                ) : (
                  <div style={{ height: 260 }}>
                    <ReactECharts option={rollingOption} style={{ height: "100%", width: "100%" }} />
                  </div>
                )}
              </div>
            </Panel>

            {/* Histogram */}
            <Panel style={{ marginTop: "1rem" }}>
              <div style={{ position: "relative" }}>
                <Shine />
                <h2 style={{ margin: "0 0 .75rem", color: ORANGE, fontWeight: 950, fontSize: "1.05rem" }}>
                  Score Histogram
                </h2>

                {stats.histogram.length === 0 ? (
                  <p style={{ margin: 0, color: MUTED }}>No games found yet.</p>
                ) : (
                  <>
                    <div style={{ height: 240 }}>
                      <ReactECharts option={histogramOption} style={{ height: "100%", width: "100%" }} />
                    </div>

                    <p style={{ margin: ".75rem 0 0", color: MUTED, fontSize: ".85rem", lineHeight: 1.5 }}>
                      Buckets are grouped in ranges of 10 (e.g., 90–99).
                    </p>
                  </>
                )}
              </div>
            </Panel>
          </>
        )}
      </div>
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
        position: "relative",
        overflow: "hidden",
        ...style
      }}
    >
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Panel>
      <Shine />
      <div style={{ color: "rgba(242,242,242,0.80)", fontSize: ".85rem", fontWeight: 900 }}>
        {label}
      </div>
      <div style={{ marginTop: ".4rem", fontSize: "1.6rem", fontWeight: 950, color: "#fff" }}>
        {value}
      </div>
    </Panel>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div style={{ minWidth: 180, flex: "1 1 180px" }}>
      <div style={{ fontSize: ".8rem", fontWeight: 900, color: "rgba(242,242,242,0.75)", marginBottom: ".35rem" }}>
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          background: "rgba(0,0,0,0.25)",
          border: `1px solid ${BORDER}`,
          borderRadius: 12,
          color: TEXT,
          padding: ".65rem .75rem",
          fontWeight: 900,
          outline: "none",
          boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
          appearance: "none"
        }}
      >
        {options.map((o) => (
          <option key={`${o.label}:${o.value}`} value={o.value} style={{ background: "#111", color: "#fff" }}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Shine() {
  return (
    <div
      aria-hidden="true"
      style={{
        pointerEvents: "none",
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 22%, rgba(255,255,255,0.00) 45%)," +
          "radial-gradient(700px 260px at 12% 0%, rgba(228,106,46,0.20), transparent 60%)"
      }}
    />
  );
}

function fmt(n: number) {
  return (Math.round(n * 10) / 10).toString();
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}