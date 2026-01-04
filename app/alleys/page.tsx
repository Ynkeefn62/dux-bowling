"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Mode = {
  title: string;
  subtitle: string;
  description: string;
};

const BG = "#121212"; // near-black
const PANEL = "#1a1a1a";
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
      "Bowler can choose custom pin configurations to practice. Does not count towards average, wins, etc."
  },
  {
    title: "S.P.A.R.E.",
    subtitle: "Like H.O.R.S.E., but for bowling.",
    description:
      "The bowling version of the popular basketball game, H.O.R.S.E. Bowlers take turns selecting custom pin configurations. If they knock down all pins on their first throw, the other bowlers must make the same shot to avoid taking a letter. The last bowler to spell S.P.A.R.E. wins!"
  },
  {
    title: "Strike Derby",
    subtitle: "Early-2000s Home Run Derby energy.",
    description:
      "Bowlers get 10 rolls, each with a full set of pins. They get a point and an extra roll for each strike thrown. The bowler with the most points wins. If it is a tie, it is settled by a bowl-off where bowlers alternate turns rolling for a strike to determine a winner."
  },
  {
    title: "7/8/9 Pin No-Tap",
    subtitle: "Faster games, more highlights.",
    description:
      "Same rules as standard duckpin bowling, but if a bowler has 7, 8, or 9 pins (depending on which selection is chosen) remaining after the first ball, it is considered a strike. If the same threshold is reached after the second ball, it is considered a spare."
  }
];

export default function AlleysPage() {
  // Carousel index + flip
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const isFirst = index === 0;
  const isLast = index === GAME_MODES.length - 1;

  // Dynamic arrow vertical positioning (match your homepage pattern)
  const cardWrapRef = useRef<HTMLDivElement | null>(null);
  const [arrowTop, setArrowTop] = useState<number | null>(null);

  function prev() {
    if (isFirst) return;
    setIndex((i) => i - 1);
    setFlipped(false);
  }

  function next() {
    if (isLast) return;
    setIndex((i) => i + 1);
    setFlipped(false);
  }

  useEffect(() => {
    const update = () => {
      if (!cardWrapRef.current) return;
      const rect = cardWrapRef.current.getBoundingClientRect();
      setArrowTop(rect.top + rect.height / 2);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    const t = window.setTimeout(update, 50);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.clearTimeout(t);
    };
  }, [index, flipped]);

  const mode = useMemo(() => GAME_MODES[index], [index]);

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

      <div style={{ position: "relative", zIndex: 1, padding: "2rem 1rem 4rem" }}>
        {/* Header / Logo */}
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
          <div
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
              For Bowling Alleys
            </div>

            <h1
              style={{
                margin: ".9rem 0 .6rem",
                fontSize: "clamp(2rem, 4.5vw, 3rem)",
                lineHeight: 1.05,
                color: TEXT
              }}
            >
              Modern hardware + modern experience,
              <span style={{ color: ORANGE }}> built for duckpin alleys.</span>
            </h1>

            <p style={{ margin: 0, lineHeight: 1.7, color: MUTED, fontSize: "1.05rem" }}>
              We’re building a retrofit-first solution for duckpin bowling alleys: a next-generation
              pinsetter and an all-in-one software experience designed to boost uptime, simplify operations,
              and give bowlers more reasons to come back.
            </p>
          </div>

          {/* Offerings (kept from earlier page, updated theme) */}
          <section style={{ marginTop: "1.5rem" }}>
            <h2 style={{ margin: "0 0 .75rem", color: TEXT, fontSize: "1.35rem" }}>
              What we plan to provide
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "1rem" }}>
              {/* Mother Dux Pinsetter */}
              <div
                style={{
                  gridColumn: "span 12",
                  background: "rgba(26,26,26,0.85)",
                  borderRadius: 18,
                  padding: "1.25rem",
                  boxShadow: "0 22px 55px rgba(0,0,0,0.55)",
                  border: "1px solid rgba(255,255,255,0.08)"
                }}
              >
                <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.05rem" }}>
                  Mother Dux Pinsetter
                </div>

                <p style={{ margin: ".6rem 0 0", lineHeight: 1.7, color: MUTED }}>
                  Precise measurements, costs, and timing are still being determined. We want to work with
                  bowling alleys to identify the best transition path to new pinsetters—including options like
                  leasing and temporary storage for Sherman Pinsetters while your team gets comfortable with the
                  new system.
                </p>
              </div>

              {/* All In One App */}
              <div
                style={{
                  gridColumn: "span 12",
                  background: "rgba(26,26,26,0.85)",
                  borderRadius: 18,
                  padding: "1.25rem",
                  boxShadow: "0 22px 55px rgba(0,0,0,0.55)",
                  border: "1px solid rgba(255,255,255,0.08)"
                }}
              >
                <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.05rem" }}>
                  All In One App
                </div>

                <ul style={{ margin: ".75rem 0 0", paddingLeft: "1.15rem", lineHeight: 1.7, color: MUTED }}>
                  <li>
                    <strong style={{ color: TEXT }}>League Management</strong>
                    <span style={{ color: MUTED }}> — schedules, rosters, standings, scoring flows.</span>
                  </li>
                  <li>
                    <strong style={{ color: TEXT }}>Lane Analytics</strong>
                    <span style={{ color: MUTED }}> — usage, downtime, performance trends.</span>
                  </li>
                  <li>
                    <strong style={{ color: TEXT }}>Service Requests</strong>
                    <span style={{ color: MUTED }}> — track issues, assign tasks, keep history.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Sliding cards: Game Modes */}
          <section style={{ marginTop: "1.5rem" }}>
            <h2 style={{ margin: "0 0 .5rem", color: TEXT, fontSize: "1.35rem" }}>
              Expanded Game Options
            </h2>
            <p style={{ margin: "0 0 1rem", color: MUTED, lineHeight: 1.7, maxWidth: 860 }}>
              Swipe through modes to see what we’re building. Tap the card to flip it.
            </p>

            {/* Center row */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div ref={cardWrapRef} style={{ position: "relative" }}>
                <div
                  onClick={() => setFlipped((f) => !f)}
                  style={{
                    width: "min(560px, 92vw)",
                    height: 300,
                    perspective: 1100,
                    cursor: "pointer"
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
                    {/* FRONT */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(26,26,26,0.9)",
                        borderRadius: 18,
                        padding: "1.25rem",
                        backfaceVisibility: "hidden",
                        boxShadow: "0 22px 55px rgba(0,0,0,0.55)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        display: "grid",
                        gridTemplateRows: "auto auto 1fr auto",
                        gap: ".55rem"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: ".75rem"
                        }}
                      >
                        <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.15rem" }}>
                          {mode.title}
                        </div>
                        <div
                          style={{
                            fontSize: ".9rem",
                            color: "rgba(242,242,242,0.65)",
                            fontWeight: 800
                          }}
                        >
                          {index + 1} / {GAME_MODES.length}
                        </div>
                      </div>

                      <div style={{ color: MUTED, fontWeight: 700 }}>{mode.subtitle}</div>

                      <div
                        style={{
                          color: MUTED,
                          lineHeight: 1.65,
                          overflow: "auto",
                          paddingRight: ".25rem"
                        }}
                      >
                        {mode.description}
                      </div>

                      <div style={{ color: "rgba(242,242,242,0.65)", fontSize: ".92rem" }}>
                        Tap to flip for “More information on the way”
                      </div>
                    </div>

                    {/* BACK */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: ORANGE,
                        color: "#fff",
                        borderRadius: 18,
                        padding: "1.25rem",
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        boxShadow: "0 22px 55px rgba(0,0,0,0.55)",
                        display: "grid",
                        placeItems: "center",
                        textAlign: "center"
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 900, fontSize: "1.25rem" }}>More information on the way</div>
                        <div style={{ marginTop: ".5rem", opacity: 0.9 }}>
                          We’ll share rulesets, formats, and operator controls as demos go live.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed arrows aligned to card center */}
            <button
              onClick={prev}
              disabled={isFirst}
              aria-label="Previous mode"
              style={{
                position: "fixed",
                left: 12,
                top: arrowTop ?? "50%",
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
                boxShadow: "0 16px 34px rgba(0,0,0,0.55)"
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
                right: 12,
                top: arrowTop ?? "50%",
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
                boxShadow: "0 16px 34px rgba(0,0,0,0.55)"
              }}
            >
              ›
            </button>
          </section>

          {/* Bottom CTA */}
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
              We’re building demos that show how the pinsetter + software experience will work end-to-end.
              If you’re an alley operator and want to provide input or shape the rollout, we’d love to hear from you.
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