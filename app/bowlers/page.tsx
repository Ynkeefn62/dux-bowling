"use client";

export default function BowlersPage() {
  const BG = "#121212";
  const PANEL = "#1a1a1a";
  const TEXT = "#f2f2f2";
  const MUTED = "rgba(242,242,242,0.78)";
  const ORANGE = "#e46a2e";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: BG,
        fontFamily: "Montserrat, system-ui",
        color: TEXT
      }}
    >
      {/* Background glow */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(800px 420px at 20% 10%, rgba(228,106,46,0.18), transparent 60%)," +
            "radial-gradient(700px 420px at 85% 25%, rgba(228,106,46,0.10), transparent 65%)"
        }}
      />

      <div style={{ position: "relative", zIndex: 1, padding: "2rem 1rem 4rem" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
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
              background: PANEL,
              borderRadius: 18,
              padding: "2rem 1.75rem",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 22px 55px rgba(0,0,0,0.55)"
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: ".55rem",
                padding: ".4rem .75rem",
                borderRadius: 999,
                background: "rgba(228,106,46,0.15)",
                fontWeight: 900,
                fontSize: ".85rem"
              }}
            >
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
              Duckpin bowling is one of the most challenging forms of bowling—and yet it’s been stuck with
              outdated tools for decades. We’re building modern software and experiences that treat your
              performance like it matters.
            </p>
          </section>

          {/* Features */}
          <section style={{ marginTop: "1.5rem" }}>
            <h2 style={{ marginBottom: ".75rem", fontSize: "1.4rem" }}>
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
                    "Automatically track every game you bowl. See trends over time, frame-by-frame breakdowns, and performance insights that go far beyond a paper score sheet."
                },
                {
                  title: "League & Tournament Support",
                  text:
                    "League standings, averages, head-to-head results, and tournament scoring—all in one place."
                },
                {
                  title: "Follow Other Bowlers",
                  text:
                    "See how your friends, teammates, and rivals are bowling. Compare stats, track progress, and fuel competition."
                },
                {
                  title: "Expanded Game Modes",
                  text:
                    "Practice modes, alternative scoring formats, and competitive mini-games designed to make duckpins more engaging for bowlers of all skill levels."
                }
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    background: PANEL,
                    borderRadius: 16,
                    padding: "1.25rem",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 18px 45px rgba(0,0,0,0.45)"
                  }}
                >
                  <h3 style={{ margin: "0 0 .5rem", color: ORANGE }}>
                    {item.title}
                  </h3>
                  <p style={{ margin: 0, lineHeight: 1.6, color: MUTED }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Score tracker CTA */}
          <section
            style={{
              marginTop: "1.75rem",
              background: PANEL,
              borderRadius: 18,
              padding: "1.75rem",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 22px 55px rgba(0,0,0,0.55)",
              textAlign: "center"
            }}
          >
            <h3 style={{ margin: "0 0 .6rem", color: ORANGE, fontSize: "1.4rem" }}>
              Start tracking your scores today
            </h3>

            <p style={{ margin: "0 auto", maxWidth: 760, lineHeight: 1.7, color: MUTED }}>
              While we continue developing the pinsetter hardware, we’ve already built a digital
              score tracker so bowlers can begin logging games, tracking progress, and building a history
              of their performance.
            </p>

            <a
              href="/game"
              style={{
                display: "inline-block",
                marginTop: "1rem",
                padding: ".9rem 1.4rem",
                borderRadius: 999,
                background: ORANGE,
                color: "#fff",
                fontWeight: 900,
                textDecoration: "none",
                boxShadow: "0 16px 34px rgba(0,0,0,0.55)"
              }}
            >
              Go to Score Tracker
            </a>

            <p
              style={{
                marginTop: ".85rem",
                fontSize: ".9rem",
                color: "rgba(242,242,242,0.75)"
              }}
            >
              A full demo showcasing all planned features is currently in development.
            </p>
          </section>

          {/* Contact */}
          <section
            style={{
              marginTop: "1.5rem",
              textAlign: "center",
              color: MUTED
            }}
          >
            <p style={{ marginBottom: ".5rem" }}>
              Questions, comments, or suggestions?
            </p>
            <a
              href="mailto:andrew@duxbowling.com"
              style={{
                color: ORANGE,
                fontWeight: 900,
                textDecoration: "none"
              }}
            >
              andrew@duxbowling.com
            </a>
          </section>

          <footer
            style={{
              marginTop: "2rem",
              textAlign: "center",
              fontSize: ".9rem",
              color: "rgba(242,242,242,0.55)"
            }}
          >
            © {new Date().getFullYear()} Dux Bowling LLC
          </footer>
        </div>
      </div>
    </main>
  );
}