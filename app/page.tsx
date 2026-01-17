"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const ORANGE = "#e46a2e";
const ORANGE_SOFT = "rgba(228,106,46,0.14)";

// White card theme
const CARD_BG = "#ffffff";
const CARD_TEXT = "#121212";
const CARD_MUTED = "rgba(18,18,18,0.72)";
const CARD_BORDER = "rgba(0,0,0,0.08)";

// Put your generated wood image in /public
const WOOD_BG_URL = "/lane-wood.png.PNG";

/**
 * Reveal-once wrapper:
 * - Starts slightly blurred + lower opacity
 * - Smoothly fades in and clears blur when it enters viewport
 * - Once revealed, it stays visible (no fade-out)
 */
function RevealOnce({
  children,
  style,
  threshold = 0.2,
  rootMargin = "0px 0px -10% 0px"
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  threshold?: number;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (revealed) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e.isIntersecting) {
          setRevealed(true);
          obs.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [revealed, threshold, rootMargin]);

  return (
    <div
      ref={ref}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0px)" : "translateY(14px)",
        filter: revealed ? "blur(0px)" : "blur(6px)",
        transition:
          "opacity 800ms cubic-bezier(0.16, 1, 0.3, 1), transform 800ms cubic-bezier(0.16, 1, 0.3, 1), filter 900ms cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: "opacity, transform, filter",
        ...style
      }}
    >
      {children}
    </div>
  );
}

/**
 * PaperCard:
 * White card + subtle paper grain overlay.
 * Uses multiple gradients (no extra asset needed).
 */
function PaperCard({
  children,
  style
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        background: CARD_BG,
        color: CARD_TEXT,
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 18,
        boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
        overflow: "hidden",
        ...style
      }}
    >
      {/* subtle paper grain */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.18,
          mixBlendMode: "multiply",
          background:
            // tiny fibers + soft mottling
            "radial-gradient(circle at 20% 30%, rgba(0,0,0,0.06), transparent 45%)," +
            "radial-gradient(circle at 80% 20%, rgba(0,0,0,0.05), transparent 50%)," +
            "radial-gradient(circle at 60% 85%, rgba(0,0,0,0.05), transparent 55%)," +
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.018) 0px, rgba(0,0,0,0.018) 1px, transparent 1px, transparent 4px)," +
            "repeating-linear-gradient(90deg, rgba(0,0,0,0.012) 0px, rgba(0,0,0,0.012) 1px, transparent 1px, transparent 5px)"
        }}
      />
      {/* content */}
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        fontFamily: "Montserrat, system-ui",

        // Background as-is (no blur/transparency)
        backgroundImage: `url("${WOOD_BG_URL}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div style={{ padding: "2rem 1rem 4rem" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          <img
            src="/1@300x.png"
            alt="Dux Bowling"
            style={{
              maxWidth: 180,
              height: "auto",
              filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.6))"
            }}
          />
        </div>

        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          {/* HERO */}
          <RevealOnce>
            <PaperCard
              style={{
                maxWidth: 900,
                margin: "0 auto",
                padding: "2.25rem 1.75rem"
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
                  color: CARD_TEXT,
                  fontWeight: 900,
                  fontSize: ".85rem",
                  letterSpacing: ".02em",
                  border: "1px solid rgba(228,106,46,0.22)"
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    background: ORANGE
                  }}
                />
                Duckpin bowling, modernized
              </div>

              <h1
                style={{
                  margin: ".9rem 0 .8rem",
                  fontSize: "clamp(2.2rem, 4.8vw, 3.3rem)",
                  lineHeight: 1.05,
                  color: CARD_TEXT
                }}
              >
                Making Duckpins Cool Again.
              </h1>

              <p
                style={{
                  margin: 0,
                  lineHeight: 1.7,
                  color: CARD_MUTED,
                  fontSize: "clamp(1.05rem, 2vw, 1.15rem)",
                  maxWidth: 820
                }}
              >
                With us, you’re not just a bowler —{" "}
                <span style={{ color: CARD_TEXT, fontWeight: 900 }}>you’re an athlete.</span>
                <br />
                We’re building modern pinsetter technology and a connected digital experience that makes every roll count.
              </p>

              <div
                style={{
                  marginTop: "1.6rem",
                  textAlign: "center",
                  color: "rgba(18,18,18,0.55)",
                  fontSize: ".9rem"
                }}
              >
                Scroll to learn more ↓
              </div>
            </PaperCard>
          </RevealOnce>

          {/* WHAT WE'RE ABOUT */}
          <RevealOnce style={{ marginTop: "1.5rem" }}>
            <PaperCard style={{ padding: "1.75rem" }}>
              <h2 style={{ margin: 0, color: ORANGE, fontSize: "1.6rem" }}>What We’re About</h2>

              <div style={{ marginTop: "1rem", display: "grid", gap: "1rem" }}>
                <p style={{ margin: 0, lineHeight: 1.75, color: CARD_MUTED }}>
                  Duckpin bowling is more challenging than ten-pin bowling, and no one has ever rolled a perfect game.
                  Without modern technology, the sport cannot grow.
                </p>

                <p style={{ margin: 0, lineHeight: 1.75, color: CARD_MUTED }}>
                  Most duckpin alleys rely on Sherman pinsetters built over 50 years ago. Maintaining them is increasingly
                  difficult.
                </p>

                <p style={{ margin: 0, lineHeight: 1.75, color: CARD_MUTED }}>
                  We’re building a new pinsetter that is{" "}
                  <strong style={{ color: CARD_TEXT }}>reliable, simple, and cost-effective</strong>, while upgrading the
                  digital experience for bowlers.
                </p>
              </div>
            </PaperCard>
          </RevealOnce>

          {/* WANT TO LEARN MORE */}
          <RevealOnce style={{ marginTop: "1.5rem" }}>
            <PaperCard style={{ padding: "1.75rem" }}>
              <h2 style={{ margin: 0, color: ORANGE, fontSize: "1.6rem" }}>Want to Learn More?</h2>

              <p style={{ margin: ".85rem 0 0", lineHeight: 1.7, color: CARD_MUTED, maxWidth: 860 }}>
                Whether you’re a bowler or an alley owner, we’re building for you.
              </p>

              <div
                style={{
                  marginTop: "1.1rem",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "1rem"
                }}
              >
                <RevealOnce threshold={0.1}>
                  <LearnCard href="/bowlers" title="Bowlers" text="Score tracking, analytics, and new game modes." />
                </RevealOnce>

                <RevealOnce threshold={0.1}>
                  <LearnCard href="/alleys" title="Alleys" text="Pinsetter roadmap and an all-in-one operations platform." />
                </RevealOnce>
              </div>
            </PaperCard>
          </RevealOnce>


        </div>
      </div>
    </main>
  );
}

function LearnCard({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <PaperCard
        style={{
          height: "100%",
          padding: "1.25rem",
          transition: "transform 180ms ease, box-shadow 180ms ease",
          boxShadow: "0 14px 32px rgba(0,0,0,0.28)"
        }}
      >
        <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.15rem" }}>{title}</div>
        <p style={{ margin: ".55rem 0 0", color: CARD_MUTED, lineHeight: 1.65 }}>{text}</p>
        <div style={{ marginTop: "1rem", color: "rgba(18,18,18,0.55)", fontWeight: 800 }}>Explore →</div>
      </PaperCard>
    </Link>
  );
}