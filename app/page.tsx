"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const ORANGE      = "#e46a2e";
const ORANGE_SOFT = "rgba(228,106,46,0.14)";
const ORANGE_MID  = "rgba(228,106,46,0.22)";
const BG          = "#121212";
const PANEL       = "rgba(26,26,26,0.88)";
const PANEL_SOLID = "#1a1a1a";
const BORDER      = "rgba(255,255,255,0.08)";
const TEXT        = "#f2f2f2";
const MUTED       = "rgba(242,242,242,0.72)";
const SHADOW      = "0 22px 55px rgba(0,0,0,0.55)";
const WOOD_BG     = "/lane-wood.png.PNG";

// ── Scroll-reveal wrapper ──────────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        filter: visible ? "blur(0)" : "blur(4px)",
        transition: `opacity 700ms ${delay}ms cubic-bezier(.16,1,.3,1),
                     transform 700ms ${delay}ms cubic-bezier(.16,1,.3,1),
                     filter 800ms ${delay}ms cubic-bezier(.16,1,.3,1)`,
        willChange: "opacity,transform,filter",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Dark glass card ────────────────────────────────────────────────────────────
function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: PANEL,
        border: `1px solid ${BORDER}`,
        borderRadius: 20,
        boxShadow: SHADOW,
        backdropFilter: "blur(8px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Orange pill badge ──────────────────────────────────────────────────────────
function Badge({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: ".5rem",
        padding: ".38rem .8rem",
        borderRadius: 999,
        background: ORANGE_SOFT,
        border: "1px solid rgba(228,106,46,0.22)",
        fontWeight: 900,
        fontSize: ".82rem",
        letterSpacing: ".03em",
        color: TEXT,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 99,
          background: ORANGE,
          display: "inline-block",
        }}
      />
      {label}
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionH2({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <h2
      style={{
        margin: "0 0 1rem",
        fontSize: "clamp(1.3rem, 3vw, 1.65rem)",
        fontWeight: 900,
        color: TEXT,
        lineHeight: 1.2,
        ...style,
      }}
    >
      {children}
    </h2>
  );
}

// ── Inline SVG pin diagram (10-pin triangle) ──────────────────────────────────
function PinDiagram({
  fallen = [],
  size = 80,
}: {
  fallen?: number[];
  size?: number;
}) {
  // Standard duckpin layout — row 4 is the front
  const positions: [number, number][] = [
    [50, 10],           // 7
    [30, 30], [70, 30], // 8, 9
    [10, 50], [50, 50], [90, 50], // 4, 5, 6
    [30, 70], [50, 70], [70, 70], [50, 90], // 1, 2, 3, 10 — approximate
  ];
  const pinNums = [7, 8, 9, 4, 5, 6, 1, 2, 3, 10];

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ display: "block", overflow: "visible" }}
    >
      {positions.map(([cx, cy], i) => {
        const num = pinNums[i];
        const isFallen = fallen.includes(num);
        return (
          <circle
            key={num}
            cx={cx}
            cy={cy}
            r={9}
            fill={isFallen ? "rgba(228,106,46,0.3)" : ORANGE}
            stroke={isFallen ? "rgba(228,106,46,0.4)" : "rgba(255,200,150,0.6)"}
            strokeWidth={1.5}
          />
        );
      })}
    </svg>
  );
}

// ── Simulated scoreboard row ──────────────────────────────────────────────────
function Scoreboard() {
  const frames = [
    { b1: "X", b2: "", b3: "", score: "24" },
    { b1: "7", b2: "/", b3: "", score: "41" },
    { b1: "8", b2: "1", b3: "0", score: "50" },
    { b1: "X", b2: "", b3: "", score: "68" },
    { b1: "6", b2: "/", b3: "", score: "80" },
    { b1: "5", b2: "3", b3: "1", score: "89" },
    { b1: "X", b2: "", b3: "", score: "107" },
    { b1: "8", b2: "/", b3: "", score: "120" },
    { b1: "9", b2: "0", b3: "0", score: "129" },
    { b1: "X", b2: "7", b3: "2", score: "148" },
  ];

  const cellStyle: React.CSSProperties = {
    minWidth: 52,
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    background: "rgba(0,0,0,0.35)",
    padding: "6px 4px",
    textAlign: "center",
    flexShrink: 0,
  };

  return (
    <div style={{ overflowX: "auto", width: "100%" }}>
      <div style={{ display: "flex", gap: 4, minWidth: 560, padding: "2px 0" }}>
        {frames.map((f, i) => (
          <div key={i} style={cellStyle}>
            <div
              style={{
                fontSize: ".65rem",
                color: MUTED,
                marginBottom: 2,
                letterSpacing: ".06em",
              }}
            >
              {i + 1}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                fontSize: ".75rem",
                fontWeight: 900,
                marginBottom: 3,
              }}
            >
              <span style={{ color: f.b1 === "X" ? ORANGE : TEXT }}>{f.b1}</span>
              <span style={{ color: f.b2 === "/" ? ORANGE : TEXT }}>{f.b2}</span>
              {f.b3 && (
                <span style={{ color: f.b3 === "X" || f.b3 === "/" ? ORANGE : TEXT }}>
                  {f.b3}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: ".8rem",
                fontWeight: 900,
                color: f.b1 === "X" ? ORANGE : TEXT,
              }}
            >
              {f.score}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 6,
          textAlign: "right",
          fontSize: ".75rem",
          color: MUTED,
          letterSpacing: ".02em",
        }}
      >
        Final: <strong style={{ color: ORANGE }}>148</strong>
      </div>
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
          fontWeight: 900,
          color: ORANGE,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: ".3rem",
          fontSize: ".8rem",
          color: MUTED,
          fontWeight: 700,
          letterSpacing: ".04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ── Feature row (icon + text) ─────────────────────────────────────────────────
function FeatureItem({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: ORANGE_SOFT,
          border: "1px solid rgba(228,106,46,0.22)",
          display: "grid",
          placeItems: "center",
          fontSize: "1.3rem",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 900, color: TEXT, marginBottom: ".25rem" }}>{title}</div>
        <div style={{ color: MUTED, lineHeight: 1.65, fontSize: ".92rem" }}>{text}</div>
      </div>
    </div>
  );
}

// ── CTA button ────────────────────────────────────────────────────────────────
function CTAButton({
  href,
  children,
  outlined = false,
}: {
  href: string;
  children: React.ReactNode;
  outlined?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        textDecoration: "none",
        borderRadius: 999,
        padding: ".85rem 1.4rem",
        fontWeight: 900,
        fontSize: ".95rem",
        background: outlined ? "transparent" : ORANGE,
        color: outlined ? ORANGE : "#fff",
        border: outlined ? `2px solid ${ORANGE}` : "2px solid transparent",
        boxShadow: outlined ? "none" : "0 12px 28px rgba(228,106,46,0.35)",
        transition: "opacity 150ms",
      }}
    >
      {children}
    </Link>
  );
}

// ── Game mode card ────────────────────────────────────────────────────────────
function GameModeCard({
  emoji,
  title,
  subtitle,
  desc,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  desc: string;
}) {
  return (
    <Card
      style={{
        padding: "1.25rem",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: ".6rem",
      }}
    >
      <div style={{ fontSize: "2rem" }}>{emoji}</div>
      <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1rem" }}>{title}</div>
      <div style={{ fontWeight: 700, color: TEXT, fontSize: ".88rem" }}>{subtitle}</div>
      <div style={{ color: MUTED, lineHeight: 1.65, fontSize: ".88rem", flex: 1 }}>{desc}</div>
    </Card>
  );
}

// ── Timeline step ─────────────────────────────────────────────────────────────
function TimelineStep({
  step,
  title,
  desc,
  done = false,
  active = false,
}: {
  step: string;
  title: string;
  desc: string;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: done ? ORANGE : active ? ORANGE_SOFT : "rgba(255,255,255,0.06)",
            border: `2px solid ${done || active ? ORANGE : "rgba(255,255,255,0.14)"}`,
            display: "grid",
            placeItems: "center",
            fontWeight: 900,
            fontSize: ".82rem",
            color: done ? "#fff" : active ? ORANGE : MUTED,
            flexShrink: 0,
          }}
        >
          {done ? "✓" : step}
        </div>
        <div
          style={{
            width: 2,
            flex: 1,
            minHeight: 24,
            background: done ? ORANGE : "rgba(255,255,255,0.08)",
            marginTop: 4,
          }}
        />
      </div>
      <div style={{ paddingBottom: "1.25rem", flex: 1 }}>
        <div
          style={{
            fontWeight: 900,
            color: active ? ORANGE : done ? TEXT : MUTED,
            marginBottom: ".3rem",
          }}
        >
          {title}
        </div>
        <div style={{ color: MUTED, fontSize: ".88rem", lineHeight: 1.65 }}>{desc}</div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: BG,
        fontFamily: "Montserrat, system-ui",
        color: TEXT,
      }}
    >
      {/* Fixed orange gradient glows */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background:
            "radial-gradient(900px 520px at 15% 8%, rgba(228,106,46,0.18), transparent 58%)," +
            "radial-gradient(700px 400px at 88% 20%, rgba(228,106,46,0.10), transparent 60%)," +
            "radial-gradient(600px 350px at 50% 90%, rgba(228,106,46,0.07), transparent 55%)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── HERO ───────────────────────────────────────────────────────────── */}
        <section
          style={{
            minHeight: "92vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "6rem 1.25rem 4rem",
            backgroundImage: `url("${WOOD_BG}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
          }}
        >
          {/* Dark overlay on wood so text is readable */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(18,18,18,0.72) 0%, rgba(18,18,18,0.55) 50%, rgba(18,18,18,0.88) 100%)",
            }}
          />

          <div
            style={{
              position: "relative",
              textAlign: "center",
              maxWidth: 820,
              width: "100%",
            }}
          >
            <Reveal>
              <img
                src="/1@300x.png"
                alt="Dux Bowling"
                style={{
                  width: "min(200px, 52vw)",
                  height: "auto",
                  filter: "drop-shadow(0 16px 36px rgba(0,0,0,0.7))",
                  marginBottom: "1.5rem",
                }}
              />
            </Reveal>

            <Reveal delay={80}>
              <Badge label="Duckpin bowling, modernized" />
            </Reveal>

            <Reveal delay={160}>
              <h1
                style={{
                  margin: "1rem 0 .75rem",
                  fontSize: "clamp(2.4rem, 7vw, 4.2rem)",
                  lineHeight: 1.03,
                  fontWeight: 900,
                  letterSpacing: "-.01em",
                }}
              >
                Making Duckpins
                <br />
                <span style={{ color: ORANGE }}>Cool Again.</span>
              </h1>
            </Reveal>

            <Reveal delay={220}>
              <p
                style={{
                  margin: "0 auto 2rem",
                  maxWidth: 640,
                  lineHeight: 1.75,
                  color: MUTED,
                  fontSize: "clamp(1rem, 2.2vw, 1.15rem)",
                }}
              >
                We're building the first new duckpin pinsetter in over 50 years — paired with a
                modern software platform that tracks scores, powers new game modes, and gives
                bowlers and alleys tools they've never had.
              </p>
            </Reveal>

            <Reveal delay={280}>
              <div
                style={{
                  display: "flex",
                  gap: ".85rem",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <CTAButton href="/bowlers">For Bowlers</CTAButton>
                <CTAButton href="/alleys" outlined>For Alleys</CTAButton>
              </div>
            </Reveal>
          </div>

          {/* Scroll indicator */}
          <div
            style={{
              position: "absolute",
              bottom: "2rem",
              left: "50%",
              transform: "translateX(-50%)",
              color: MUTED,
              fontSize: ".85rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: ".4rem",
            }}
          >
            <span>Scroll to explore</span>
            <span style={{ fontSize: "1.2rem" }}>↓</span>
          </div>
        </section>

        {/* ── STATS BAR ──────────────────────────────────────────────────────── */}
        <section style={{ background: PANEL_SOLID, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
          <div
            style={{
              maxWidth: 900,
              margin: "0 auto",
              padding: "2rem 1.25rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "1.5rem",
            }}
          >
            <Reveal><Stat value="50+" label="Years overdue" /></Reveal>
            <Reveal delay={60}><Stat value="41" label="Alleys remaining" /></Reveal>
            <Reveal delay={120}><Stat value="8" label="Game modes" /></Reveal>
            <Reveal delay={180}><Stat value="0" label="Perfect games ever" /></Reveal>
          </div>
        </section>

        {/* ── THE PROBLEM ────────────────────────────────────────────────────── */}
        <section style={{ padding: "5rem 1.25rem" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <Reveal>
              <Badge label="The Problem" />
              <SectionH2 style={{ marginTop: ".75rem" }}>
                The last duckpin pinsetter was built in 1973.
              </SectionH2>
            </Reveal>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1.25rem",
                marginTop: "1.5rem",
              }}
            >
              {[
                {
                  icon: "🔧",
                  title: "Aging machines with no replacement",
                  text: "Every operating duckpin alley in the country runs Sherman pinsetters over 50 years old. When they break beyond repair, the alley closes — permanently.",
                },
                {
                  icon: "📉",
                  title: "100 alleys → 41 in 60 years",
                  text: "Maryland alone went from over 100 sanctioned alleys in the 1960s to 19 today. Nationally, fewer than 41 NDBC-certified venues remain.",
                },
                {
                  icon: "🚫",
                  title: "No new equipment has ever been made",
                  text: "The inventor refused to sell his patent. His last machine was built in 1973. No manufacturer has ever produced a new duckpin pinsetter since.",
                },
              ].map((item, i) => (
                <Reveal key={item.title} delay={i * 60}>
                  <Card style={{ padding: "1.5rem" }}>
                    <FeatureItem icon={item.icon} title={item.title} text={item.text} />
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── OUR SOLUTION ───────────────────────────────────────────────────── */}
        <section
          style={{
            padding: "5rem 1.25rem",
            background: "rgba(228,106,46,0.04)",
            borderTop: `1px solid ${BORDER}`,
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <Reveal>
              <Badge label="Our Solution" />
              <SectionH2 style={{ marginTop: ".75rem" }}>
                A new pinsetter. A connected software platform.
                <br />
                <span style={{ color: ORANGE }}>Built from scratch.</span>
              </SectionH2>
              <p style={{ color: MUTED, lineHeight: 1.75, maxWidth: 680, marginTop: ".5rem" }}>
                We're developing both simultaneously — a patent-pending hardware pinsetter that any
                alley can lease-to-own, and a software layer that modernizes the entire duckpin
                experience for bowlers and operators.
              </p>
            </Reveal>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1.25rem",
                marginTop: "2rem",
              }}
            >
              <Reveal>
                <Card style={{ padding: "1.75rem" }}>
                  <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.1rem", marginBottom: ".75rem" }}>
                    🎳 The Dux Pinsetter
                  </div>
                  <div style={{ display: "grid", gap: ".65rem" }}>
                    {[
                      "Patent-pending design — the first new duckpin pinsetter since 1973",
                      "Lease-to-own over 36 months — no large upfront capital required",
                      "Sets any arbitrary pin configuration for custom game modes",
                      "Computer vision pin detection — automatic, real-time scoring",
                      "Ball speed tracking and trajectory visualization",
                      "Overhead camera replay for every roll",
                    ].map((f) => (
                      <div
                        key={f}
                        style={{
                          display: "flex",
                          gap: ".6rem",
                          color: MUTED,
                          fontSize: ".88rem",
                          lineHeight: 1.6,
                        }}
                      >
                        <span style={{ color: ORANGE, flexShrink: 0, marginTop: "2px" }}>✓</span>
                        {f}
                      </div>
                    ))}
                  </div>
                </Card>
              </Reveal>

              <Reveal delay={80}>
                <Card style={{ padding: "1.75rem" }}>
                  <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.1rem", marginBottom: ".75rem" }}>
                    💻 The Dux Platform
                  </div>
                  <div style={{ display: "grid", gap: ".65rem" }}>
                    {[
                      "Real-time lane screen with scoring, animations, and replays",
                      "Bowler accounts — stats, avatars, achievements, social features",
                      "8 game modes including arcade and board game adaptations",
                      "Venue admin console — lane health, analytics, service requests",
                      "League and tournament management with NDBC certification support",
                      "Merch store — physical gear linked to digital avatar cosmetics",
                    ].map((f) => (
                      <div
                        key={f}
                        style={{
                          display: "flex",
                          gap: ".6rem",
                          color: MUTED,
                          fontSize: ".88rem",
                          lineHeight: 1.6,
                        }}
                      >
                        <span style={{ color: ORANGE, flexShrink: 0, marginTop: "2px" }}>✓</span>
                        {f}
                      </div>
                    ))}
                  </div>
                </Card>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── SCORING PREVIEW ─────────────────────────────────────────────────── */}
        <section style={{ padding: "5rem 1.25rem" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "2rem",
                alignItems: "center",
              }}
            >
              <Reveal>
                <Badge label="Live Scoring" />
                <SectionH2 style={{ marginTop: ".75rem" }}>
                  Every roll tracked.
                  <br />
                  <span style={{ color: ORANGE }}>Every stat counted.</span>
                </SectionH2>
                <div style={{ display: "grid", gap: "1rem", marginTop: "1.25rem" }}>
                  <FeatureItem
                    icon="📊"
                    title="Frame-by-frame breakdown"
                    text="Strike %, spare conversion, first-ball average, and trend charts — all from real game data."
                  />
                  <FeatureItem
                    icon="⚡"
                    title="Under 500ms from pin fall to screen"
                    text="Camera detects pins, scoring engine calculates, lane screen and your phone update — all in under half a second."
                  />
                  <FeatureItem
                    icon="🎯"
                    title="Chop and split markers"
                    text="Track difficult leaves, conversion rates, and the moments that define your game."
                  />
                </div>
                <div style={{ marginTop: "1.5rem" }}>
                  <CTAButton href="/game">Try the Score Tracker →</CTAButton>
                </div>
              </Reveal>

              <Reveal delay={100}>
                <Card style={{ padding: "1.5rem" }}>
                  <div
                    style={{
                      fontSize: ".75rem",
                      color: MUTED,
                      fontWeight: 700,
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      marginBottom: "1rem",
                    }}
                  >
                    Live Lane Screen — Game in Progress
                  </div>

                  {/* Player row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: ".75rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: ORANGE,
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 900,
                        color: "#fff",
                        fontSize: ".85rem",
                        flexShrink: 0,
                      }}
                    >
                      AB
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, color: TEXT }}>Andrew B.</div>
                      <div style={{ fontSize: ".78rem", color: MUTED }}>
                        Walkersville Lanes · Lane 4
                      </div>
                    </div>
                    <div
                      style={{
                        marginLeft: "auto",
                        fontWeight: 900,
                        color: ORANGE,
                        fontSize: "1.3rem",
                      }}
                    >
                      148
                    </div>
                  </div>

                  <Scoreboard />

                  {/* Pin diagram */}
                  <div
                    style={{
                      marginTop: "1.25rem",
                      display: "flex",
                      gap: "1.5rem",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: ".72rem", color: MUTED, marginBottom: ".4rem", fontWeight: 700 }}>
                        CURRENT DECK
                      </div>
                      <PinDiagram fallen={[1, 2, 3, 4, 5, 6, 8, 9]} size={70} />
                    </div>
                    <div>
                      <div
                        style={{
                          display: "inline-block",
                          background: ORANGE_SOFT,
                          border: "1px solid rgba(228,106,46,0.3)",
                          borderRadius: 10,
                          padding: ".5rem .8rem",
                          fontSize: ".8rem",
                          fontWeight: 900,
                          color: TEXT,
                        }}
                      >
                        7 & 10 leave
                      </div>
                      <div style={{ marginTop: ".4rem", fontSize: ".75rem", color: MUTED }}>
                        Ball speed: <strong style={{ color: TEXT }}>14.2 mph</strong>
                      </div>
                    </div>
                  </div>
                </Card>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── GAME MODES ─────────────────────────────────────────────────────── */}
        <section
          style={{
            padding: "5rem 1.25rem",
            background: "rgba(228,106,46,0.04)",
            borderTop: `1px solid ${BORDER}`,
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <Reveal>
              <Badge label="Game Modes" />
              <SectionH2 style={{ marginTop: ".75rem" }}>
                8 ways to play.
                <br />
                <span style={{ color: ORANGE }}>All on the same lane.</span>
              </SectionH2>
              <p style={{ color: MUTED, lineHeight: 1.75, maxWidth: 640, marginTop: ".5rem" }}>
                The Dux Pinsetter can set any pin configuration on demand. That unlocks game modes
                that have never existed in duckpin bowling before.
              </p>
            </Reveal>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1rem",
                marginTop: "2rem",
              }}
            >
              {[
                {
                  emoji: "🎳",
                  title: "Traditional Duckpin",
                  subtitle: "NDBC official rules",
                  desc: "3 balls per frame, 10 frames, max 300. Strike and spare bonuses apply. Fully certified for league and tournament play.",
                },
                {
                  emoji: "🎯",
                  title: "No-Tap (7/8/9-Pin)",
                  subtitle: "Beginner-friendly variant",
                  desc: "Knock 7, 8, or 9+ pins on ball 1 and it counts as a strike. Same scoring structure, lower threshold. Great for casual nights.",
                },
                {
                  emoji: "⚡",
                  title: "Strike Derby",
                  subtitle: "Home Run Derby energy",
                  desc: "10 starting rolls, full rack every time. Each strike earns a bonus roll. Most strikes wins. Tied? Bowl Off to decide.",
                },
                {
                  emoji: "🧠",
                  title: "S.P.A.R.E.",
                  subtitle: "H.O.R.S.E. for bowling",
                  desc: "Set a challenge, make the shot, dare opponents to match it. Miss someone else's challenge and earn a letter. Spell S.P.A.R.E. and you're out.",
                },
                {
                  emoji: "🦆",
                  title: "Dux Hunt",
                  subtitle: "Duck Hunt, live on your lane",
                  desc: "The pinsetter sets random 'duck' configurations. Knock them all down before the timer. Miss and the dog laughs at you.",
                },
                {
                  emoji: "🏦",
                  title: "Monopoly Bowling",
                  subtitle: "Roll the dice by bowling",
                  desc: "6 pins set per ball. Pins knocked = your die value. The board plays on the alley screen. Property management on your phone.",
                },
                {
                  emoji: "⛵",
                  title: "Catan Bowling",
                  subtitle: "Bowl to gather resources",
                  desc: "Same 6-pin dice mechanic as Monopoly. Total roll distributes resources to all players. Full Catan on screen + phone.",
                },
                {
                  emoji: "🎓",
                  title: "Practice Mode",
                  subtitle: "Solo skill training",
                  desc: "Choose any pin configuration. The pinsetter resets it after every roll. Track your success rate and improve over time.",
                },
              ].map((m, i) => (
                <Reveal key={m.title} delay={i * 40}>
                  <GameModeCard {...m} />
                </Reveal>
              ))}
            </div>

            <Reveal style={{ marginTop: "2rem", textAlign: "center" }}>
              <CTAButton href="/bowlers">See All Game Modes →</CTAButton>
            </Reveal>
          </div>
        </section>

        {/* ── FOR BOWLERS ─────────────────────────────────────────────────────── */}
        <section style={{ padding: "5rem 1.25rem" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "2rem",
                alignItems: "start",
              }}
            >
              <Reveal>
                <Badge label="For Bowlers" />
                <SectionH2 style={{ marginTop: ".75rem" }}>
                  You're not just a bowler.
                  <br />
                  <span style={{ color: ORANGE }}>You're an athlete.</span>
                </SectionH2>
                <p style={{ color: MUTED, lineHeight: 1.75, marginTop: ".5rem" }}>
                  Dux Bowling gives you the tools that serious athletes in every other sport already
                  have — stat tracking, performance trends, social competition, and a digital
                  identity that travels with you lane to lane.
                </p>
                <div style={{ marginTop: "1.5rem" }}>
                  <CTAButton href="/bowlers">Explore Bowler Features →</CTAButton>
                </div>
              </Reveal>

              <Reveal delay={80}>
                <div style={{ display: "grid", gap: "1rem" }}>
                  {[
                    {
                      icon: "📈",
                      title: "Stats dashboard",
                      text: "Average, high game, strike %, spare conversion, distribution charts — filterable by alley, lane, game type, and date range.",
                    },
                    {
                      icon: "🧑‍🎨",
                      title: "Retro avatar builder",
                      text: "Build a customizable retro-cartoon avatar. Earn skins and cosmetics through achievements. Wear your merch purchases on your avatar.",
                    },
                    {
                      icon: "🏆",
                      title: "Trophies and achievements",
                      text: "Convert the 7-10 split. Bowl a personal best. Win a tournament. Every achievement unlocks a permanent trophy in your cabinet.",
                    },
                    {
                      icon: "👥",
                      title: "Follow friends and rivals",
                      text: "Compare stats, see activity feeds, and track each other's progress. League nights just got more competitive.",
                    },
                  ].map((item, i) => (
                    <Card key={item.title} style={{ padding: "1.1rem" }}>
                      <FeatureItem {...item} />
                    </Card>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── FOR ALLEYS ──────────────────────────────────────────────────────── */}
        <section
          style={{
            padding: "5rem 1.25rem",
            background: "rgba(228,106,46,0.04)",
            borderTop: `1px solid ${BORDER}`,
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <Reveal>
              <Badge label="For Bowling Alleys" />
              <SectionH2 style={{ marginTop: ".75rem" }}>
                Keep your alley open.
                <br />
                <span style={{ color: ORANGE }}>Keep the sport alive.</span>
              </SectionH2>
              <p style={{ color: MUTED, lineHeight: 1.75, maxWidth: 680, marginTop: ".5rem" }}>
                Your Sherman pinsetter will eventually fail. There is no replacement — until now. The
                Dux pinsetter is designed specifically for bowling alleys that want to modernize
                without disrupting their existing operations.
              </p>
            </Reveal>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1.25rem",
                marginTop: "2rem",
              }}
            >
              {[
                {
                  icon: "💰",
                  title: "Lease-to-own pricing",
                  text: "No large upfront capital. Lease your pinsetters over 36 months — then own them outright. Pair with a $100/lane/month software subscription.",
                },
                {
                  icon: "🖥️",
                  title: "Lane screen system",
                  text: "Interactive displays for scoring, game mode selection, animations, replays, and bowler login via QR code.",
                },
                {
                  icon: "📡",
                  title: "Real-time lane analytics",
                  text: "Games played, uptime, fault counts, anomaly detection — know when a lane is underperforming before bowlers tell you.",
                },
                {
                  icon: "🔔",
                  title: "Push notifications",
                  text: "Send league reminders, event promotions, and food specials to opted-in bowlers. Targeted by league membership or subscription.",
                },
                {
                  icon: "🏅",
                  title: "Create venue trophies and skins",
                  text: "Award custom trophies and avatar cosmetics for league champions, attendance milestones, and promotional events.",
                },
                {
                  icon: "🛠️",
                  title: "Service request portal",
                  text: "Submit maintenance requests, schedule routine service visits, and track resolution history — all in one place.",
                },
              ].map((item, i) => (
                <Reveal key={item.title} delay={i * 50}>
                  <Card style={{ padding: "1.25rem" }}>
                    <FeatureItem {...item} />
                  </Card>
                </Reveal>
              ))}
            </div>

            <Reveal style={{ marginTop: "2rem", textAlign: "center" }}>
              <CTAButton href="/alleys">Explore Alley Features →</CTAButton>
            </Reveal>
          </div>
        </section>

        {/* ── ROADMAP / TIMELINE ───────────────────────────────────────────────── */}
        <section style={{ padding: "5rem 1.25rem" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "2rem",
                alignItems: "start",
              }}
            >
              <Reveal>
                <Badge label="Where We Are" />
                <SectionH2 style={{ marginTop: ".75rem" }}>
                  Building in the open.
                  <br />
                  <span style={{ color: ORANGE }}>Progress you can follow.</span>
                </SectionH2>
                <p style={{ color: MUTED, lineHeight: 1.75, marginTop: ".5rem" }}>
                  We're not hiding behind a waitlist. Here's exactly where we stand and what comes
                  next. If you're a bowling alley operator or an NDBC bowler, we want to hear from you
                  right now.
                </p>
                <div style={{ marginTop: "1.5rem" }}>
                  <CTAButton href="/about-us">Our Full Story →</CTAButton>
                </div>
              </Reveal>

              <Reveal delay={80}>
                <Card style={{ padding: "1.5rem" }}>
                  <TimelineStep
                    step="1"
                    done
                    title="Pinsetter concept complete"
                    desc="Initial engineering model finished. Patent filing in progress."
                  />
                  <TimelineStep
                    step="2"
                    done
                    title="Software platform launched"
                    desc="Score tracking, auth, stats dashboard, and lane simulator live at duxbowling.com."
                  />
                  <TimelineStep
                    step="3"
                    active
                    title="Alley outreach underway"
                    desc="Reaching out to Walkersville, Mt. Airy, and Taneytown. Gathering feedback from the community."
                  />
                  <TimelineStep
                    step="4"
                    title="Prototype build & testing"
                    desc="Construct working prototype, test at partner alley, refine based on real-world use."
                  />
                  <TimelineStep
                    step="5"
                    title="Frederick pilot facility"
                    desc="4-lane NDBC-certified venue in Frederick, MD. Birthday parties, corporate events, and an invite-only elite evening league."
                  />
                  <TimelineStep
                    step="6"
                    title="Commercial rollout"
                    desc="Lease-to-own pinsetters available to existing alleys. Software subscription live nationwide."
                  />
                </Card>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── CONTACT / CTA ────────────────────────────────────────────────────── */}
        <section
          style={{
            padding: "5rem 1.25rem 6rem",
            background: "rgba(228,106,46,0.04)",
            borderTop: `1px solid ${BORDER}`,
          }}
        >
          <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
            <Reveal>
              <Badge label="Get Involved" />
              <SectionH2 style={{ marginTop: ".75rem" }}>
                Help us save duckpin bowling.
              </SectionH2>
              <p style={{ color: MUTED, lineHeight: 1.8, marginTop: ".5rem" }}>
                Whether you're a bowler with feedback, an alley operator who wants to be first in
                line, or an investor or partner who believes in the mission — we want to hear from
                you. The sport has been on a 60-year decline. We're doing something about it.
              </p>
            </Reveal>

            <Reveal delay={80}>
              <div
                style={{
                  marginTop: "2rem",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "1rem",
                }}
              >
                <Card style={{ padding: "1.5rem", textAlign: "left" }}>
                  <div style={{ fontWeight: 900, color: ORANGE, marginBottom: ".4rem" }}>
                    🎳 Bowlers
                  </div>
                  <p style={{ margin: "0 0 1rem", color: MUTED, fontSize: ".88rem", lineHeight: 1.65 }}>
                    Create an account, start tracking scores, and be the first to experience new game
                    modes when we launch.
                  </p>
                  <CTAButton href="/bowlers">Get Started</CTAButton>
                </Card>

                <Card style={{ padding: "1.5rem", textAlign: "left" }}>
                  <div style={{ fontWeight: 900, color: ORANGE, marginBottom: ".4rem" }}>
                    🏠 Alley Operators
                  </div>
                  <p style={{ margin: "0 0 1rem", color: MUTED, fontSize: ".88rem", lineHeight: 1.65 }}>
                    We're reaching out to existing alleys now. Share your situation and let's talk
                    about what a transition could look like.
                  </p>
                  <CTAButton href="/alleys">Talk to Us</CTAButton>
                </Card>

                <Card style={{ padding: "1.5rem", textAlign: "left" }}>
                  <div style={{ fontWeight: 900, color: ORANGE, marginBottom: ".4rem" }}>
                    💼 Investors & Partners
                  </div>
                  <p style={{ margin: "0 0 1rem", color: MUTED, fontSize: ".88rem", lineHeight: 1.65 }}>
                    We're pursuing TEDCO Seed Fund support and strategic partnerships. Reach out
                    directly to discuss.
                  </p>
                  <a
                    href="mailto:andrew@duxbowling.com"
                    style={{
                      display: "inline-block",
                      textDecoration: "none",
                      borderRadius: 999,
                      padding: ".85rem 1.4rem",
                      fontWeight: 900,
                      fontSize: ".95rem",
                      background: ORANGE,
                      color: "#fff",
                      boxShadow: "0 12px 28px rgba(228,106,46,0.35)",
                    }}
                  >
                    Email Andrew
                  </a>
                </Card>
              </div>
            </Reveal>
          </div>
        </section>

      </div>
    </main>
  );
}
