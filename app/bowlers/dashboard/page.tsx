"use client";

import { useEffect, useMemo, useState } from "react";

const ORANGE = "#e46a2e";
const BG = "#121212";
const PANEL = "rgba(26,26,26,0.88)";
const BORDER = "rgba(255,255,255,0.10)";
const TEXT = "#f2f2f2";
const MUTED = "rgba(242,242,242,0.75)";

type HistogramBucket = { label: string; start: number; end: number; count: number };

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
};

export default function BowlerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

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

        const sRes = await fetch(`/api/dev/bowler-stats?userId=${encodeURIComponent(userId)}`, {
          cache: "no-store"
        });

        const data = (await sRes.json()) as StatsResponse;

        if (!sRes.ok || !data?.ok) {
          setErr("Unable to load stats right now.");
          setStats(null);
          return;
        }

        setStats(data);
      } catch (e: any) {
        setErr("Unable to load stats right now.");
        setStats(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const maxCount = useMemo(() => {
    if (!stats?.histogram?.length) return 1;
    return Math.max(1, ...stats.histogram.map((b) => b.count));
  }, [stats]);

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
            Your stats based on completed games recorded in the dev tables.
          </p>
        </header>

        {/* States */}
        {loading && (
          <Panel>
            <p style={{ margin: 0, color: MUTED }}>Loading…</p>
          </Panel>
        )}

        {!loading && !loggedIn && (
          <Panel>
            <p style={{ margin: 0, color: TEXT, fontWeight: 850 }}>
              Please log in to view stats.
            </p>
          </Panel>
        )}

        {!loading && loggedIn && err && (
          <Panel>
            <p style={{ margin: 0, color: TEXT, fontWeight: 850 }}>{err}</p>
          </Panel>
        )}

        {!loading && loggedIn && !err && stats && (
          <>
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

            {/* Histogram */}
            <Panel style={{ marginTop: "1rem" }}>
              <h2 style={{ margin: "0 0 .75rem", color: ORANGE, fontWeight: 950, fontSize: "1.05rem" }}>
                Score Histogram
              </h2>

              {stats.histogram.length === 0 ? (
                <p style={{ margin: 0, color: MUTED }}>No games found yet.</p>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: ".45rem",
                      height: 180,
                      padding: ".5rem .25rem",
                      borderRadius: 14,
                      background: "rgba(0,0,0,0.22)",
                      border: `1px solid ${BORDER}`,
                      overflowX: "auto"
                    }}
                  >
                    {stats.histogram.map((b) => {
                      const h = Math.round((b.count / maxCount) * 160);
                      return (
                        <div key={b.label} style={{ minWidth: 34, textAlign: "center" }}>
                          <div
                            title={`${b.label}: ${b.count}`}
                            style={{
                              height: h,
                              borderRadius: 10,
                              background: ORANGE,
                              boxShadow: "0 14px 30px rgba(0,0,0,0.35)"
                            }}
                          />
                          <div style={{ marginTop: ".35rem", fontSize: ".7rem", color: MUTED, lineHeight: 1.1 }}>
                            {b.label}
                          </div>
                          <div style={{ fontSize: ".75rem", color: TEXT, fontWeight: 900, marginTop: ".15rem" }}>
                            {b.count}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p style={{ margin: ".75rem 0 0", color: MUTED, fontSize: ".85rem", lineHeight: 1.5 }}>
                    Buckets are grouped in ranges of 10 (e.g., 90–99).
                  </p>
                </>
              )}
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
      <div style={{ color: "rgba(242,242,242,0.80)", fontSize: ".85rem", fontWeight: 900 }}>
        {label}
      </div>
      <div style={{ marginTop: ".4rem", fontSize: "1.6rem", fontWeight: 950, color: "#fff" }}>
        {value}
      </div>
    </Panel>
  );
}

function fmt(n: number) {
  // 1 decimal for readability
  return (Math.round(n * 10) / 10).toString();
}