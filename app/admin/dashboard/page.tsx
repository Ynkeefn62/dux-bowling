"use client";

const BG = "#121212"; // near-black
const PANEL = "#1a1a1a";
const TEXT = "#f2f2f2";
const MUTED = "rgba(242,242,242,0.78)";
const ORANGE = "#e46a2e";
const ORANGE_SOFT = "rgba(228,106,46,0.14)";

export default function AboutUsPage() {
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
              About Us
            </div>

            <h1
              style={{
                margin: ".9rem 0 .6rem",
                fontSize: "clamp(2rem, 4.5vw, 3rem)",
                lineHeight: 1.05,
                color: TEXT
              }}
            >
              The story behind <span style={{ color: ORANGE }}>Dux Bowling</span>
            </h1>

            <p style={{ margin: 0, lineHeight: 1.7, color: MUTED, fontSize: "1.05rem" }}>
              Dux Bowling is a mission to modernize duckpin bowling—starting with the pinsetter and building
              an experience that helps the sport grow for the next generation.
            </p>
          </div>

          {/* Narrative */}
          <section
            style={{
              marginTop: "1.5rem",
              background: "rgba(26,26,26,0.85)",
              borderRadius: 18,
              padding: "1.5rem",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 22px 55px rgba(0,0,0,0.55)"
            }}
          >
            <h2 style={{ margin: "0 0 .75rem", color: ORANGE, fontSize: "1.35rem" }}>
              Why we’re doing this
            </h2>

            <div style={{ display: "grid", gap: ".9rem", color: MUTED, lineHeight: 1.8, fontSize: "1.03rem" }}>
              <p style={{ margin: 0 }}>
                In the summer of 2022, I joined my first duckpin bowling league in Walkersville, Maryland.
                It quickly became one of my favorite weekly routines—an outlet to be competitive and a reason
                to see friends and family every week. I’ve been bowling in Mount Airy and Walkersville ever since.
              </p>

              <p style={{ margin: 0 }}>
                One of the first things my father-in-law told me after joining the league was that duckpin bowling
                has been on the decline over the past few years, largely because of outdated pinsetter technology.
                To my surprise, he was absolutely right. While the sport remains wildly popular for those who play it,
                the opportunity to grow the game cannot happen at scale until a new pinsetter is developed.
              </p>

              <p style={{ margin: 0 }}>
                In late 2025, I decided it was time for someone to do something about it. Since then, I’ve been working
                with an engineer to bring the dream of developing a new pinsetter into reality.
              </p>

              <p style={{ margin: 0 }}>
                I can’t do this alone. It will require cooperation and patience from bowling alleys and bowlers to adopt
                new technology. It won’t be perfect (nobody bowls a 300), but if we can grow the sport and pass it on to
                the next generation better than we found it, I will consider it a resounding success.
              </p>
            </div>

            {/* NEW: Where we are */}
            <div
              style={{
                marginTop: "1.25rem",
                padding: "1.1rem",
                borderRadius: 16,
                background: "rgba(0,0,0,0.30)",
                border: "1px solid rgba(228,106,46,0.18)"
              }}
            >
              <div style={{ fontWeight: 900, color: TEXT, marginBottom: ".35rem" }}>
                Where we are
              </div>

              <p style={{ margin: 0, lineHeight: 1.75, color: MUTED }}>
                Our engineer has an initial model that now requires us to build a prototype to test the
                functionality of the pinsetter. Before we progress any further with the prototype, we want
                to ensure there is ample demand from existing duckpin bowling alleys to justify the expense
                of moving forward. Additionally, we would like to use this time to continue building out our
                software to maximize the experience for bowlers and bowling alleys to complement the
                improvements the new pinsetter will have on the game. As we go through the process, we plan
                to gather feedback from bowling alleys, bowlers, and potential lenders to provide the best
                product possible.
              </p>
            </div>

            <div
              style={{
                marginTop: "1.25rem",
                paddingTop: "1.1rem",
                borderTop: "1px solid rgba(255,255,255,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap"
              }}
            >
              <div style={{ fontWeight: 900, color: TEXT }}>
                Andrew Boller <span style={{ color: "rgba(242,242,242,0.65)" }}>— Founder, Dux Bowling</span>
              </div>

              <a
                href="mailto:andrew@duxbowling.com"
                style={{
                  textDecoration: "none",
                  borderRadius: 999,
                  padding: ".85rem 1.1rem",
                  background: ORANGE,
                  color: "#fff",
                  fontWeight: 900,
                  boxShadow: "0 16px 34px rgba(0,0,0,0.55)"
                }}
              >
                Contact Andrew
              </a>
            </div>
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
              Want to get involved?
            </h3>
            <p style={{ margin: "0 auto", maxWidth: 760, lineHeight: 1.7, color: MUTED }}>
              If you’re a bowler, a bowling alley operator, or someone who cares about keeping duckpin alive,
              we’d love your input. We’re also building demos that show where the product is headed.
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