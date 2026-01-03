"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const CREAM = "#f5f0e6";
const ORANGE = "#e46a2e";
const TEXT = "#5b3b25";
const TEXT_ORANGE = "#c75a1d";

type SectionKey = "hero" | "about" | "learn";

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Compute a 0..1 "reveal progress" for a section element.
 * 0 when section is below viewport, 1 when it's comfortably in view.
 */
function useSectionProgress() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const getProgress = (el: HTMLElement | null) => {
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || 800;

    // Start animating when top is 80% down the viewport, finish when top reaches 25%
    const start = vh * 0.8;
    const end = vh * 0.25;

    const raw = (start - r.top) / (start - end);
    return clamp01(raw);
  };

  return { scrollY, getProgress };
}

function Section({
  id,
  title,
  kicker,
  children
}: {
  id: SectionKey;
  title: string;
  kicker?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { getProgress } = useSectionProgress();

  // Recompute on each render (scroll state updates through hook)
  const p = useMemo(() => easeOutCubic(getProgress(ref.current)), [getProgress, ref.current]);

  const y = (1 - p) * 22; // px drop-in
  const opacity = 0.15 + p * 0.85;

  return (
    <section
      id={id}
      ref={ref}
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: "3.25rem 1rem",
        transform: `translateY(${y}px)`,
        opacity,
        transition: "opacity 120ms linear",
        scrollMarginTop: 100
      }}
    >
      {kicker && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: ".5rem",
            padding: ".4rem .75rem",
            borderRadius: 999,
            background: "rgba(228,106,46,0.12)",
            color: TEXT_ORANGE,
            fontWeight: 800,
            fontSize: ".85rem",
            letterSpacing: ".02em",
            marginBottom: ".9rem"
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
          {kicker}
        </div>
      )}

      <h2
        style={{
          margin: 0,
          color: TEXT,
          fontSize: "clamp(1.35rem, 2.2vw, 2rem)",
          lineHeight: 1.1
        }}
      >
        {title}
      </h2>

      <div style={{ marginTop: "1.25rem" }}>{children}</div>
    </section>
  );
}

function NavDots({
  active,
  onJump
}: {
  active: SectionKey;
  onJump: (id: SectionKey) => void;
}) {
  const items: { id: SectionKey; label: string }[] = [
    { id: "hero", label: "Top" },
    { id: "about", label: "What We’re About" },
    { id: "learn", label: "Want to Learn More" }
  ];

  return (
    <div
      aria-label="Page sections"
      style={{
        position: "fixed",
        right: 14,
        top: "50%",
        transform: "translateY(-50%)",
        display: "grid",
        gap: 10,
        zIndex: 40
      }}
    >
      {items.map((it) => {
        const isActive = it.id === active;
        return (
          <button
            key={it.id}
            onClick={() => onJump(it.id)}
            aria-label={it.label}
            title={it.label}
            style={{
              width: 12,
              height: 12,
              borderRadius: 99,
              border: "none",
              background: isActive ? ORANGE : "rgba(228,106,46,0.28)",
              boxShadow: isActive ? "0 10px 25px rgba(0,0,0,0.12)" : "none",
              cursor: "pointer"
            }}
          />
        );
      })}
    </div>
  );
}

export default function Home() {
  // Track which section is active for the scroll narrative (dots + subtle highlight)
  const [active, setActive] = useState<SectionKey>("hero");

  const heroRef = useRef<HTMLElement | null>(null);
  const aboutRef = useRef<HTMLElement | null>(null);
  const learnRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const sections = [
      { id: "hero" as const, el: heroRef.current },
      { id: "about" as const, el: aboutRef.current },
      { id: "learn" as const, el: learnRef.current }
    ];

    const obs = new IntersectionObserver(
      (entries) => {
        // pick the most visible intersecting entry
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        if (visible?.target) {
          const id = (visible.target as HTMLElement).id as SectionKey;
          if (id) setActive(id);
        }
      },
      {
        root: null,
        threshold: [0.2, 0.35, 0.5, 0.65]
      }
    );

    for (const s of sections) {
      if (s.el) obs.observe(s.el);
    }
    return () => obs.disconnect();
  }, []);

  function jumpTo(id: SectionKey) {
    const el =
      id === "hero" ? heroRef.current : id === "about" ? aboutRef.current : learnRef.current;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: CREAM,
        fontFamily: "Montserrat, system-ui",
        color: TEXT
      }}
    >
      {/* Subtle background accents */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background:
            "radial-gradient(800px 500px at 15% 10%, rgba(228,106,46,0.18), transparent 55%)," +
            "radial-gradient(900px 550px at 85% 25%, rgba(199,90,29,0.12), transparent 60%)"
        }}
      />

      {/* Scroll navigation dots */}
      <NavDots active={active} onJump={jumpTo} />

      {/* HERO */}
      <section
        id="hero"
        ref={(el) => {
          heroRef.current = el;
        }}
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 980,
          margin: "0 auto",
          padding: "2rem 1rem 3rem",
          scrollMarginTop: 100
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          <img
            src="/1@300x.png"
            alt="Dux Bowling"
            style={{
              maxWidth: 190,
              height: "auto",
              filter: "drop-shadow(0 14px 26px rgba(0,0,0,0.10))"
            }}
          />
        </div>

        {/* Hero Card */}
        <div
          style={{
            margin: "0 auto",
            maxWidth: 820,
            borderRadius: 18,
            padding: "2.25rem 1.5rem",
            background: "rgba(255,255,255,0.75)",
            border: "1px solid rgba(255,255,255,0.9)",
            boxShadow: "0 20px 45px rgba(0,0,0,0.10)",
            backdropFilter: "blur(8px)"
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: ".55rem",
              padding: ".4rem .75rem",
              borderRadius: 999,
              background: "rgba(228,106,46,0.12)",
              color: TEXT_ORANGE,
              fontWeight: 900,
              fontSize: ".85rem",
              letterSpacing: ".02em"
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
            Dux Bowling
          </div>

          <h1
            style={{
              margin: ".9rem 0 .6rem",
              fontSize: "clamp(2.2rem, 5.2vw, 3.6rem)",
              lineHeight: 1.05,
              color: TEXT
            }}
          >
            Making Duckpins Cool Again
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "clamp(1.05rem, 2.2vw, 1.35rem)",
              lineHeight: 1.6,
              color: TEXT_ORANGE,
              fontWeight: 700
            }}
          >
            You’re not just a bowler — you’re an athlete.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: ".75rem",
              justifyContent: "center",
              marginTop: "1.5rem"
            }}
          >
            <button
              onClick={() => jumpTo("about")}
              style={{
                border: "none",
                borderRadius: 999,
                padding: ".85rem 1.1rem",
                background: ORANGE,
                color: "#fff",
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "0 14px 28px rgba(0,0,0,0.14)"
              }}
            >
              What We’re About
            </button>

            <button
              onClick={() => jumpTo("learn")}
              style={{
                border: `2px solid ${ORANGE}`,
                borderRadius: 999,
                padding: ".85rem 1.1rem",
                background: "transparent",
                color: ORANGE,
                fontWeight: 900,
                cursor: "pointer"
              }}
            >
              Want to Learn More
            </button>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ display: "grid", placeItems: "center", marginTop: "2.1rem" }}>
          <div
            aria-hidden="true"
            style={{
              width: 28,
              height: 44,
              borderRadius: 999,
              border: "2px solid rgba(199,90,29,0.55)",
              position: "relative"
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 99,
                background: ORANGE,
                position: "absolute",
                left: "50%",
                top: 10,
                transform: "translateX(-50%)",
                animation: "duxScrollDot 1.25s ease-in-out infinite"
              }}
            />
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <div
        id="about"
        ref={(el) => {
          aboutRef.current = el;
        }}
        style={{ position: "relative", zIndex: 1 }}
      >
        <Section id="about" kicker="What We’re About" title="A classic sport deserves modern tools.">
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              padding: "1.5rem",
              boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0,0,0,0.04)"
            }}
          >
            <p style={{ margin: 0, lineHeight: 1.75, color: TEXT }}>
              Duckpin bowling is one of the most challenging forms of bowling in the world. In its entire
              history, there has <strong>never</strong> been a perfect game.
            </p>

            <p style={{ margin: "1rem 0 0", lineHeight: 1.75, color: TEXT }}>
              Today, fewer than 50 duckpin bowling alleys remain, concentrated primarily in Maryland,
              Connecticut, and Rhode Island. These alleys rely on the Sherman pinsetter — a mechanical
              system whose parts are over 50 years old and increasingly difficult to maintain.
            </p>

            <p style={{ margin: "1rem 0 0", lineHeight: 1.75, color: TEXT }}>
              We’re building a new duckpin pinsetter that is <strong>reliable</strong>,{" "}
              <strong>simple</strong>, and <strong>cost-effective</strong>, designed to retrofit into
              existing bowling alleys — with a long-term path for expansion into new geographies.
            </p>

            <div
              style={{
                marginTop: "1.25rem",
                padding: "1rem",
                borderRadius: 16,
                background: "rgba(228,106,46,0.10)",
                border: "1px solid rgba(228,106,46,0.16)"
              }}
            >
              <p style={{ margin: 0, lineHeight: 1.75, color: TEXT }}>
                But modernizing the sport goes beyond hardware. Bowling is unique — it’s one of the few
                sports where the moment of impact and the moment of scoring happen at the same place and
                time. That makes it the perfect foundation for a connected digital experience.
              </p>
            </div>

            <p style={{ margin: "1rem 0 0", lineHeight: 1.75, color: TEXT }}>
              Our goal is simple: to grow duckpin bowling by making it more accessible, more competitive,
              and more fun — building a spirit of competition and community for bowlers of all ages.
            </p>
          </div>

          {/* Feature strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: "1rem",
              marginTop: "1.25rem"
            }}
          >
            {[
              { title: "Modern Pinsetter", desc: "Reliable, retrofit-friendly hardware built for today." },
              { title: "Digital Scoring", desc: "A single home for scores, stats, and progress." },
              { title: "Community", desc: "Friends, competition, and shared milestones." }
            ].map((f) => (
              <div
                key={f.title}
                style={{
                  gridColumn: "span 12",
                  background: "rgba(255,255,255,0.75)",
                  border: "1px solid rgba(255,255,255,0.9)",
                  borderRadius: 16,
                  padding: "1rem",
                  boxShadow: "0 12px 26px rgba(0,0,0,0.06)"
                }}
              >
                <div style={{ fontWeight: 900, color: ORANGE, marginBottom: ".25rem" }}>{f.title}</div>
                <div style={{ color: TEXT, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* LEARN MORE */}
      <div
        id="learn"
        ref={(el) => {
          learnRef.current = el;
        }}
        style={{ position: "relative", zIndex: 1 }}
      >
        <Section id="learn" kicker="Want to Learn More" title="Choose your path.">
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              padding: "1.5rem",
              boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0,0,0,0.04)"
            }}
          >
            <p style={{ margin: 0, lineHeight: 1.7, color: TEXT }}>
              We’re building for both the people who love duckpins and the places that keep it alive.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(12, 1fr)",
                gap: "1rem",
                marginTop: "1.25rem"
              }}
            >
              <a
                href="/bowlers"
                style={{
                  gridColumn: "span 12",
                  textDecoration: "none",
                  borderRadius: 16,
                  padding: "1.1rem",
                  border: `2px solid ${ORANGE}`,
                  background: "rgba(228,106,46,0.06)",
                  color: TEXT,
                  boxShadow: "0 12px 26px rgba(0,0,0,0.06)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.05rem" }}>Bowlers</div>
                    <div style={{ marginTop: ".25rem", lineHeight: 1.55 }}>
                      Track games, build your profile, and compete with friends.
                    </div>
                  </div>
                  <div aria-hidden="true" style={{ color: ORANGE, fontSize: "1.5rem", fontWeight: 900 }}>
                    →
                  </div>
                </div>
              </a>

              <a
                href="/alleys"
                style={{
                  gridColumn: "span 12",
                  textDecoration: "none",
                  borderRadius: 16,
                  padding: "1.1rem",
                  border: `2px solid ${ORANGE}`,
                  background: "rgba(228,106,46,0.06)",
                  color: TEXT,
                  boxShadow: "0 12px 26px rgba(0,0,0,0.06)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.05rem" }}>Alleys</div>
                    <div style={{ marginTop: ".25rem", lineHeight: 1.55 }}>
                      Learn about retrofit pinsetters and modern scoring experiences.
                    </div>
                  </div>
                  <div aria-hidden="true" style={{ color: ORANGE, fontSize: "1.5rem", fontWeight: 900 }}>
                    →
                  </div>
                </div>
              </a>
            </div>
          </div>

          <footer
            style={{
              marginTop: "1.5rem",
              textAlign: "center",
              color: "rgba(91,59,37,0.7)",
              fontSize: ".9rem"
            }}
          >
            © {new Date().getFullYear()} Dux Bowling LLC
          </footer>
        </Section>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes duxScrollDot {
          0%   { transform: translate(-50%, 0); opacity: 0.9; }
          60%  { transform: translate(-50%, 16px); opacity: 0.9; }
          100% { transform: translate(-50%, 0); opacity: 0.6; }
        }
      `}</style>
    </main>
  );
}