"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDevice } from "@/app/hooks/useDevice";

type Mode = {
  title: string;
  subtitle: string;
  description: string;
};

const BG = "#121212";
const TEXT = "#f2f2f2";
const MUTED = "rgba(242,242,242,0.78)";
const ORANGE = "#e46a2e";
const ORANGE_SOFT = "rgba(228,106,46,0.14)";

const GAME_MODES: Mode[] = [
  {
    title: "Standard Duckpin Bowling",
    subtitle: "Classic rules, modern presentation.",
    description:
      "Duckpin scoring rules. 3 balls per frame. Strike if all pins are knocked down on first ball, and spare if all knocked down on second ball. A strike counts the summation of the next two rolls for the frame the strike was rolled, and a spare counts the amount of the next ball for the frame the spare was rolled. 10th frame: all bowlers get three rolls. If all pins are knocked down on the first or second roll, the bowler gets a new set of pins and rolls again until all three rolls are made."
  },
  {
    title: "Practice Mode",
    subtitle: "Train specific leaves on demand.",
    description:
      "Choose custom pin configurations to practice specific leaves. Practice games do not count towards average, wins, etc."
  },
  {
    title: "S.P.A.R.E.",
    subtitle: "Like H.O.R.S.E., but for bowling.",
    description:
      "Players take turns selecting custom pin configurations. If the shooter knocks down all pins on the first ball, others must match the same shot or take a letter. The last bowler to spell S.P.A.R.E. wins!"
  },
  {
    title: "Strike Derby",
    subtitle: "Early-2000s Home Run Derby energy.",
    description:
      "Bowlers start with 10 rolls, each with a full rack. Earn a point and an extra roll for every strike. Highest score wins. Ties are settled by a strike shootout."
  },
  {
    title: "7/8/9 Pin No-Tap",
    subtitle: "Faster games, more highlights.",
    description:
      "Same rules as standard duckpin, but if 7, 8, or 9 pins are knocked down on the first ball (depending on the selection), it is scored as a strike. If the threshold is reached after the second ball, it is scored as a spare."
  }
];

export default function BowlersPage() {
  const [index, setIndex] = useState(0);
  const { isMobile } = useDevice();

  const isFirst = index === 0;
  const isLast = index === GAME_MODES.length - 1;
  const mode = useMemo(() => GAME_MODES[index], [index]);

  // Arrow positioning to card center (no lag: CSS var + rAF, no React rerenders on scroll)
  const cardWrapRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  function prev() {
    if (isFirst) return;
    setIndex((i) => i - 1);
  }

  function next() {
    if (isLast) return;
    setIndex((i) => i + 1);
  }

  useEffect(() => {
    const setVars = () => {
      const el = cardWrapRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;

      document.documentElement.style.setProperty("--dux-arrow-top", `${centerY}px`);

      const buffer = 140;
      const inRange = rect.bottom > -buffer && rect.top < window.innerHeight + buffer;
      document.documentElement.style.setProperty("--dux-arrows-visible", inRange ? "visible" : "hidden");
      document.documentElement.style.setProperty("--dux-arrows-opacity", inRange ? "1" : "0");
    };

    const schedule = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        setVars();
      });
    };

    setVars();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    let ro: ResizeObserver | null = null;
    if (cardWrapRef.current && "ResizeObserver" in window) {
      ro = new ResizeObserver(() => schedule());
      ro.observe(cardWrapRef.current);
    }

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (ro) ro.disconnect();
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [index]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: BG,
        fontFamily: "Montserrat, system-ui",
        color: TEXT
      }}
    >
      {/* Background accents */}
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
            "linear-gradient(180deg, rgba(255,255,255,0.02), transparent 35%, rgba(0,0,0,0.25) 100%)"
        }}
      />

      <div style={{ position: "relative", zIndex: 1, padding: isMobile ? "1rem 0.75rem 3rem" : "2rem 1rem 4rem" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          <img
            src="/1@300x.png"
            alt="Dux Bowling"
            style={{
              maxWidth: 170,
              height: "auto",
              filter: "drop-shadow(0 18px 40px rgba(0,0,0,0.55))"
            }}
          />
        </div>

        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          {/* Hero */}
          <section
            style={{
              margin: "0 auto",
              maxWidth: 860,
              borderRadius: 18,
              padding: "2rem 1.5rem",
              background: "rgba(26,26,26,0.78)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 22px 55px rgba(0,0,0,0.55)",
              backdropFilter: "blur(10px)"
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: ".55rem",
                padding: ".4rem .75rem",
                borderRadius: 999,
                background: ORANGE_SOFT,
                color: TEXT,
                fontWeight: 900,
                fontSize: ".85rem",
                letterSpacing: ".02em",
                border: "1px solid rgba(228,106,46,0.18)"
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 99,
                  background: ORANGE,
                  display: "inline-block"
                }}
              />
              For Bowlers
            </div>

            <h1
              style={{
                margin: ".9rem 0 .75rem",
                fontSize: "clamp(2rem, 4.5vw, 3rem)",
                lineHeight: 1.05
              }}
            >
              You’re not just a bowler.
              <br />
              <span style={{ color: ORANGE }}>You’re an athlete.</span>
            </h1>

            <p style={{ margin: 0, lineHeight: 1.7, color: MUTED, fontSize: "1.05rem" }}>
              We’re building software and experiences that modernize duckpin bowling—tracking performance,
              fueling competition, and making every game feel like it matters.
            </p>
          </section>

          {/* What bowlers can expect */}
          <section style={{ marginTop: "1.5rem" }}>
            <h2 style={{ margin: "0 0 .75rem", color: TEXT, fontSize: "1.35rem" }}>
              What bowlers can expect
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "1rem"
              }}
            >
              {[
                {
                  title: "Score Tracking & Analytics",
                  text:
                    "Track games over time with frame-by-frame breakdowns and performance insights."
                },
                {
                  title: "League & Tournament Scoring",
                  text:
                    "Standings, averages, head-to-head results, and modern scoring workflows."
                },
                {
                  title: "Follow Other Bowlers",
                  text:
                    "Connect with friends, teammates, and rivals—compare stats and progress."
                },
                {
                  title: "New Game Modes",
                  text:
                    "Practice formats and competitive mini-games designed to keep duckpins fresh."
                }
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    background: "rgba(26,26,26,0.85)",
                    borderRadius: 18,
                    padding: "1.25rem",
                    boxShadow: "0 22px 55px rgba(0,0,0,0.55)",
                    border: "1px solid rgba(255,255,255,0.08)"
                  }}
                >
                  <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.05rem" }}>
                    {item.title}
                  </div>
                  <p style={{ margin: ".6rem 0 0", lineHeight: 1.7, color: MUTED }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Expanded Game Options (same sliding card) */}
          <section style={{ marginTop: "1.5rem" }}>
            <h2 style={{ margin: "0 0 .5rem", color: TEXT, fontSize: "1.35rem" }}>
              Expanded Game Options
            </h2>

            <div style={{ position: "relative", marginTop: "1rem" }}>
              <div
                ref={cardWrapRef}
                style={{
                  width: "min(680px, 94vw)",
                  height: "min(520px, 72vh)",
                  margin: "0 auto",
                  background: "rgba(26,26,26,0.9)",
                  borderRadius: 18,
                  padding: "1.25rem",
                  boxShadow: "0 22px 55px rgba(0,0,0,0.55)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: ".55rem",
                  overflow: "hidden"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: ".75rem" }}>
                  <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.15rem" }}>
                    {mode.title}
                  </div>
                  <div style={{ fontSize: ".9rem", color: "rgba(242,242,242,0.65)", fontWeight: 800 }}>
                    {index + 1} / {GAME_MODES.length}
                  </div>
                </div>

                <div style={{ color: MUTED, fontWeight: 700 }}>{mode.subtitle}</div>

                <div
                  style={{
                    color: MUTED,
                    lineHeight: 1.65,
                    overflowY: "auto",
                    WebkitOverflowScrolling: "touch",
                    paddingRight: ".35rem",
                    flex: 1,
                    minHeight: 0
                  }}
                >
                  {mode.description}
                </div>
              </div>

              {/* Arrows: fixed left/right, centered to card center via CSS var */}
              <button
                onClick={prev}
                disabled={isFirst}
                aria-label="Previous mode"
                style={{
                  position: "fixed",
                  left: isMobile ? 4 : 12,
                  top: "var(--dux-arrow-top, 50%)",
                  transform: "translateY(-50%)",
                  width: isMobile ? 38 : 48,
                  height: isMobile ? 38 : 48,
                  borderRadius: "50%",
                  border: "none",
                  background: ORANGE,
                  color: "#fff",
                  fontSize: isMobile ? "1.2rem" : "1.5rem",
                  opacity: isFirst ? 0.5 : 1,
                  cursor: isFirst ? "default" : "pointer",
                  zIndex: 50,
                  boxShadow: "0 16px 34px rgba(0,0,0,0.55)",
                  visibility: "var(--dux-arrows-visible, hidden)" as any,
                  touchAction: "manipulation",
                }}
              >
                ‹
              </button>

              <button
                onClick={next}
                disabled={isLast}
                aria-label="Next mode"
                style={{
                  position: "fixed",
                  right: isMobile ? 4 : 12,
                  top: "var(--dux-arrow-top, 50%)",
                  transform: "translateY(-50%)",
                  width: isMobile ? 38 : 48,
                  height: isMobile ? 38 : 48,
                  borderRadius: "50%",
                  border: "none",
                  background: ORANGE,
                  color: "#fff",
                  fontSize: isMobile ? "1.2rem" : "1.5rem",
                  opacity: isLast ? 0.5 : 1,
                  cursor: isLast ? "default" : "pointer",
                  zIndex: 50,
                  boxShadow: "0 16px 34px rgba(0,0,0,0.55)",
                  visibility: "var(--dux-arrows-visible, hidden)" as any,
                  touchAction: "manipulation",
                }}
              >
                ›
              </button>
            </div>
          </section>

          {/* Score tracker CTA */}
          <section
            style={{
              marginTop: "1.5rem",
              background: "rgba(26,26,26,0.85)",
              borderRadius: 18,
              padding: "1.5rem",
              boxShadow: "0 22px 55px rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.08)",
              textAlign: "center"
            }}
          >
            <h3 style={{ margin: "0 0 .5rem", color: ORANGE, fontSize: "1.35rem" }}>
              Start tracking your scores today
            </h3>

            <p style={{ margin: "0 auto", maxWidth: 760, lineHeight: 1.7, color: MUTED }}>
              While we continue developing the pinsetter hardware, we’ve built a score tracker so bowlers can
              begin logging games and tracking progress.
            </p>

            <a
              href="/game"
              style={{
                display: "inline-block",
                marginTop: "1rem",
                textDecoration: "none",
                borderRadius: 999,
                padding: ".9rem 1.25rem",
                background: ORANGE,
                color: "#fff",
                fontWeight: 900,
                boxShadow: "0 16px 34px rgba(0,0,0,0.55)"
              }}
            >
              Go to Score Tracker
            </a>
          </section>

          {/* Demo in progress + Contact (same style as Alleys) */}
          <section
            style={{
              marginTop: "1.5rem",
              background: "rgba(26,26,26,0.85)",
              borderRadius: 18,
              padding: "1.5rem",
              boxShadow: "0 22px 55px rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.08)",
              textAlign: "center"
            }}
          >
            <h3 style={{ margin: "0 0 .5rem", color: ORANGE, fontSize: "1.35rem" }}>
              Demo in progress
            </h3>
            <p style={{ margin: "0 auto", maxWidth: 760, lineHeight: 1.7, color: MUTED }}>
              We’re working on a demo that showcases score tracking, analytics, expanded game modes, and the full
              bowler experience. If you have ideas that would make this more fun, more competitive, or easier to use,
              we’d love your feedback.
            </p>

            <a
              href="mailto:andrew@duxbowling.com"
              style={{
                display: "inline-block",
                marginTop: "1rem",
                textDecoration: "none",
                borderRadius: 999,
                padding: ".9rem 1.25rem",
                background: ORANGE,
                color: "#fff",
                fontWeight: 900,
                boxShadow: "0 16px 34px rgba(0,0,0,0.55)"
              }}
            >
              Email andrew@duxbowling.com
            </a>

            <div style={{ marginTop: ".85rem", color: "rgba(242,242,242,0.75)", fontSize: ".92rem" }}>
              Questions, comments, or suggestions welcome.
            </div>
          </section>

          <footer
            style={{
              marginTop: "1.75rem",
              textAlign: "center",
              color: "rgba(242,242,242,0.65)",
              fontSize: ".9rem"
            }}
          >
            © {new Date().getFullYear()} Dux Bowling LLC
          </footer>
        </div>
      </div>
    </main>
  );
}