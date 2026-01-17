"use client";

import Link from "next/link";

const TEXT = "#f2f2f2";
const MUTED = "rgba(242,242,242,0.78)";
const ORANGE = "#e46a2e";
const ORANGE_SOFT = "rgba(228,106,46,0.14)";

// Your generated bowling lane wood image
// Place this file in /public
const WOOD_BG_URL = "/lane-wood.png.PNG";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        fontFamily: "Montserrat, system-ui",
        color: TEXT,
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
          <section
            style={{
              maxWidth: 900,
              margin: "0 auto",
              borderRadius: 18,
              padding: "2.25rem 1.75rem",
              background: "#1c1c1c",
              boxShadow: "0 18px 40px rgba(0,0,0,0.6)"
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
                fontWeight: 900,
                fontSize: ".85rem"
              }}
            >
              <span
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
                fontSize: "clamp(1.05rem, 2vw, 1.15rem)"
              }}
            >
              With us, you’re not just a bowler —{" "}
              <strong style={{ color: TEXT }}>you’re an athlete.</strong>
              <br />
              We’re building modern pinsetter technology and a connected digital experience
              that makes every roll count.
            </p>

            <div
              style={{
                marginTop: "1.6rem",
                textAlign: "center",
                color: "rgba(242,242,242,0.6)",
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
              background: "#1c1c1c",
              borderRadius: 18,
              padding: "1.75rem",
              boxShadow: "0 18px 40px rgba(0,0,0,0.6)"
            }}
          >
            <h2 style={{ margin: 0, color: ORANGE, fontSize: "1.6rem" }}>
              What We’re About
            </h2>

            <div style={{ marginTop: "1rem", display: "grid", gap: "1rem" }}>
              <p style={{ margin: 0, lineHeight: 1.75, color: MUTED }}>
                Duckpin bowling is more challenging than ten-pin bowling, and no one has
                ever rolled a perfect game. Without modern technology, the sport cannot grow.
              </p>

              <p style={{ margin: 0, lineHeight: 1.75, color: MUTED }}>
                Most duckpin alleys rely on Sherman pinsetters built over 50 years ago.
                Maintaining them is increasingly difficult.
              </p>

              <p style={{ margin: 0, lineHeight: 1.75, color: MUTED }}>
                We’re building a new pinsetter that is{" "}
                <strong style={{ color: TEXT }}>reliable, simple, and cost-effective</strong>,
                while upgrading the digital experience for bowlers.
              </p>
            </div>
          </section>

          {/* WANT TO LEARN MORE */}
          <section
            style={{
              marginTop: "1.5rem",
              background: "#1c1c1c",
              borderRadius: 18,
              padding: "1.75rem",
              boxShadow: "0 18px 40px rgba(0,0,0,0.6)"
            }}
          >
            <h2 style={{ margin: 0, color: ORANGE, fontSize: "1.6rem" }}>
              Want to Learn More?
            </h2>

            <p style={{ margin: ".85rem 0 0", lineHeight: 1.7, color: MUTED }}>
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
              <LearnCard
                href="/bowlers"
                title="Bowlers"
                text="Score tracking, analytics, and new game modes."
              />
              <LearnCard
                href="/alleys"
                title="Alleys"
                text="Pinsetter roadmap and an all-in-one operations platform."
              />
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

function LearnCard({
  href,
  title,
  text
}: {
  href: string;
  title: string;
  text: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <div
        style={{
          height: "100%",
          background: "#151515",
          borderRadius: 18,
          padding: "1.25rem",
          boxShadow: "0 14px 32px rgba(0,0,0,0.55)"
        }}
      >
        <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.15rem" }}>
          {title}
        </div>
        <p style={{ margin: ".55rem 0 0", color: MUTED, lineHeight: 1.65 }}>
          {text}
        </p>
        <div style={{ marginTop: "1rem", color: "rgba(242,242,242,0.6)", fontWeight: 800 }}>
          Explore →
        </div>
      </div>
    </Link>
  );
}