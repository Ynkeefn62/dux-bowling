"use client";

import Link from "next/link";

const TEXT = "#f2f2f2";
const MUTED = "rgba(242,242,242,0.78)";
const ORANGE = "#e46a2e";
const ORANGE_SOFT = "rgba(228,106,46,0.14)";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        fontFamily: "Montserrat, system-ui",
        color: TEXT,
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Background image */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundImage: `url("/lane-wood.PNG")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          transform: "translateZ(0)" // helps smoothness on mobile
        }}
      />

      {/* Dark overlay for readability */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          background:
            "radial-gradient(900px 520px at 18% 10%, rgba(228,106,46,0.14), transparent 58%)," +
            "radial-gradient(900px 520px at 86% 28%, rgba(228,106,46,0.10), transparent 62%)," +
            "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.72) 100%)",
          pointerEvents: "none"
        }}
      />

      {/* Subtle animated grain overlay */}
      <div
        aria-hidden="true"
        className="dux-grain"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          opacity: 0.10, // keep it subtle
          mixBlendMode: "overlay" // gives a natural “wood grain” enhancement
        }}
      />

      <div style={{ position: "relative", zIndex: 3, padding: "2rem 1rem 4rem" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          <img
            src="/1@300x.png"
            alt="Dux Bowling"
            style={{
              maxWidth: 180,
              height: "auto",
              filter: "drop-shadow(0 18px 40px rgba(0,0,0,0.55))"
            }}
          />
        </div>

        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          {/* HERO */}
          <section
            style={{
              margin: "0 auto",
              maxWidth: 900,
              borderRadius: 18,
              padding: "2.25rem 1.75rem",
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
              Duckpin bowling, modernized
            </div>

            <h1
              style={{
                margin: ".9rem 0 .8rem",
                fontSize: "clamp(2.2rem, 4.8vw, 3.3rem)",
                lineHeight: 1.05
              }}
            >
              Making Duckpins Cool Again.
            </h1>

            <p
              style={{
                margin: 0,
                lineHeight: 1.7,
                color: MUTED,
                fontSize: "clamp(1.05rem, 2vw, 1.15rem)",
                maxWidth: 820
              }}
            >
              With us, you’re not just a bowler —{" "}
              <span style={{ color: TEXT, fontWeight: 900 }}>you’re an athlete.</span>
              <br />
              We’re building modern pinsetter technology and a connected digital experience that makes every roll count.
            </p>

            <div
              style={{
                marginTop: "1.6rem",
                display: "flex",
                justifyContent: "center",
                color: "rgba(242,242,242,0.55)",
                fontSize: ".9rem"
              }}
            >
              Scroll to learn more ↓
            </div>
          </section>

          {/* WHAT WE'RE ABOUT */}
          <section
            style={{
              marginTop: "1.5rem",
              background: "rgba(26,26,26,0.85)",
              borderRadius: 18,
              padding: "1.75rem",
              boxShadow: "0 22px 55px rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.08)"
            }}
          >
            <h2 style={{ margin: 0, color: ORANGE, fontSize: "1.6rem" }}>What We’re About</h2>

            <div style={{ marginTop: "1rem", display: "grid", gap: "1rem" }}>
              <p style={{ margin: 0, lineHeight: 1.75, color: MUTED }}>
                Duckpin Bowling is a variant of bowling that is more challenging than traditional ten-pin bowling. There has{" "}
                <strong style={{ color: TEXT }}>never</strong> been a perfect game in the history of duckpin.
                We’d love to see it happen — but without modernizing the sport with new technology, we may never get there.
              </p>

              <p style={{ margin: 0, lineHeight: 1.75, color: MUTED }}>
                Today, there are fewer duckpin bowling alleys remaining, largely concentrated in Maryland, Connecticut,
                and Rhode Island. These centers rely on the Sherman Pinsetter — and many parts are over 50 years old,
                making them harder to maintain over time.
              </p>

              <p style={{ margin: 0, lineHeight: 1.75, color: MUTED }}>
                Our goal is to build a new pinsetter that is{" "}
                <strong style={{ color: TEXT }}>reliable, simple, and cost-effective</strong>.
                It will be designed to retrofit existing duckpin alleys first, with the long-term goal of expanding into
                new geographies.
              </p>

              <p style={{ margin: 0, lineHeight: 1.75, color: MUTED }}>
                While upgrading the pinsetter, we’re also upgrading the bowler experience. Bowling is one of the rare sports
                where the point of impact occurs at the same time and place as scoring — which makes it the perfect foundation
                for a modern stats ecosystem where performance is saved, visualized, and shared.
              </p>

              <p style={{ margin: 0, lineHeight: 1.75, color: MUTED }}>
                Ultimately, we want to grow duckpin bowling across the country — building competition, community, and
                a digital layer of achievements and rewards that makes the sport even more fun for bowlers of all ages.
              </p>
            </div>
          </section>

          {/* WANT TO LEARN MORE */}
          <section
            style={{
              marginTop: "1.5rem",
              background: "rgba(26,26,26,0.85)",
              borderRadius: 18,
              padding: "1.75rem",
              boxShadow: "0 22px 55px rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.08)"
            }}
          >
            <h2 style={{ margin: 0, color: ORANGE, fontSize: "1.6rem" }}>Want to Learn More?</h2>

            <p style={{ margin: ".85rem 0 0", lineHeight: 1.7, color: MUTED, maxWidth: 860 }}>
              Whether you’re a bowler looking for better tracking and competition — or an alley exploring the next era
              of duckpin hardware and software — we’re building for you.
            </p>

            <div
              style={{
                marginTop: "1.1rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1rem"
              }}
            >
              <LearnCard href="/bowlers" title="Bowlers" text="Score tracking, analytics, league tools, and new game modes." />
              <LearnCard href="/alleys" title="Alleys" text="Pinsetter roadmap, expanded formats, and an all-in-one operations app." />
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

      {/* Grain animation CSS */}
      <style>{`
        .dux-grain{
          /* Layered subtle “grain” using gradients (very lightweight) */
          background-image:
            repeating-linear-gradient(
              90deg,
              rgba(255,255,255,0.045) 0px,
              rgba(255,255,255,0.045) 1px,
              rgba(0,0,0,0.0) 2px,
              rgba(0,0,0,0.0) 7px
            ),
            repeating-linear-gradient(
              0deg,
              rgba(0,0,0,0.04) 0px,
              rgba(0,0,0,0.04) 1px,
              rgba(0,0,0,0.0) 3px,
              rgba(0,0,0,0.0) 9px
            );
          background-size: 220px 220px, 340px 340px;
          background-position: 0 0, 0 0;
          animation: duxGrainDrift 14s linear infinite;
          will-change: background-position;
          transform: translateZ(0);
        }

        @keyframes duxGrainDrift {
          0%   { background-position: 0px 0px, 0px 0px; }
          50%  { background-position: 18px -10px, -12px 14px; }
          100% { background-position: 36px -20px, -24px 28px; }
        }

        /* Respect reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .dux-grain { animation: none; }
        }
      `}</style>
    </main>
  );
}

function LearnCard({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <div
        style={{
          height: "100%",
          background: "rgba(18,18,18,0.55)",
          borderRadius: 18,
          padding: "1.25rem",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 18px 45px rgba(0,0,0,0.45)",
          transition: "transform 180ms ease, border-color 180ms ease"
        }}
      >
        <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.15rem" }}>{title}</div>
        <p style={{ margin: ".55rem 0 0", color: "rgba(242,242,242,0.78)", lineHeight: 1.65 }}>{text}</p>
        <div style={{ marginTop: "1rem", color: "rgba(242,242,242,0.6)", fontWeight: 800 }}>Explore →</div>
      </div>
    </Link>
  );
}