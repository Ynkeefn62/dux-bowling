"use client";

const CREAM = "#f5f0e6";
const ORANGE = "#e46a2e";
const TEXT = "#5b3b25";
const TEXT_ORANGE = "#c75a1d";

export default function AlleysPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: CREAM,
        fontFamily: "Montserrat, system-ui",
        color: TEXT
      }}
    >
      {/* Subtle background accents (match homepage vibe) */}
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

      {/* Page content */}
      <div style={{ position: "relative", zIndex: 1, padding: "2rem 1rem 4rem" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          <img
            src="/1@300x.png"
            alt="Dux Bowling"
            style={{
              maxWidth: 170,
              height: "auto",
              filter: "drop-shadow(0 14px 26px rgba(0,0,0,0.10))"
            }}
          />
        </div>

        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          {/* Title */}
          <div
            style={{
              margin: "0 auto",
              maxWidth: 860,
              borderRadius: 18,
              padding: "2rem 1.5rem",
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
              <span style={{ color: ORANGE }}> without losing duckpin’s soul.</span>
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: "clamp(1.02rem, 2vw, 1.2rem)",
                lineHeight: 1.7,
                color: TEXT
              }}
            >
              We’re building a retrofit-first solution for duckpin bowling alleys: a next-generation
              pinsetter and an all-in-one software experience designed to boost uptime, simplify league
              operations, and give bowlers more reasons to come back.
            </p>
          </div>

          {/* Offerings grid */}
          <section style={{ marginTop: "1.5rem" }}>
            <h2 style={{ margin: "0 0 .75rem", color: TEXT, fontSize: "1.35rem" }}>
              What we plan to provide
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(12, 1fr)",
                gap: "1rem"
              }}
            >
              {/* Mother Dux Pinsetter */}
              <div
                style={{
                  gridColumn: "span 12",
                  background: "#fff",
                  borderRadius: 18,
                  padding: "1.25rem",
                  boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
                  border: "1px solid rgba(0,0,0,0.04)"
                }}
              >
                <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.05rem" }}>
                  Mother Dux Pinsetter
                </div>

                <p style={{ margin: ".6rem 0 0", lineHeight: 1.7 }}>
                  A new duckpin pinsetter designed to retrofit into existing alleys—built for reliability,
                  maintainability, and cost-effective operation. Precise measurements, pricing, and timing
                  are still being determined.
                </p>

                <ul style={{ margin: ".75rem 0 0", paddingLeft: "1.15rem", lineHeight: 1.7 }}>
                  <li>
                    <strong>Transition planning with alleys:</strong> we want to work with you to identify
                    the easiest path to adoption based on your lanes, workflow, and staffing.
                  </li>
                  <li>
                    <strong>Flexible paths:</strong> we’re exploring options like leasing, phased rollouts,
                    and service programs.
                  </li>
                  <li>
                    <strong>Temporary Sherman storage:</strong> we’re considering temporary storage options
                    so alleys can keep legacy equipment on-hand while getting comfortable with new pinsetters.
                  </li>
                </ul>
              </div>

              {/* NEW: What sets our pinsetter apart */}
              <div
                style={{
                  gridColumn: "span 12",
                  background: "rgba(228,106,46,0.08)",
                  borderRadius: 18,
                  padding: "1.25rem",
                  border: "1px solid rgba(228,106,46,0.14)"
                }}
              >
                <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.05rem" }}>
                  What sets our pinsetter apart
                </div>

                <p style={{ margin: ".6rem 0 0", lineHeight: 1.7 }}>
                  We’re building a pinsetter that improves consistency on the lane while unlocking modern
                  experiences for bowlers and operators.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(12, 1fr)",
                    gap: ".9rem",
                    marginTop: ".9rem"
                  }}
                >
                  {[
                    {
                      t: "Precise pin setting",
                      d: "More consistent setups mean fewer surprises and less bowler frustration. Consistency improves fairness and helps bowlers trust what they’re practicing."
                    },
                    {
                      t: "Custom pin configurations",
                      d: "Set up specific leave patterns intentionally—enabling new game modes and letting bowlers practice targeted pin combinations (instead of hoping they happen)."
                    },
                    {
                      t: "One-tap reset to last configuration",
                      d: "A reset button that returns the lane to the pin configuration prior to the last roll—so corrections can happen quickly without manual pin resets."
                    },
                    {
                      t: "Roll-by-roll data capture",
                      d: "Designed to tie into a backend database so every roll can be logged, analyzed, and used to power stats, diagnostics, and a better overall lane experience."
                    },
                    {
                      t: "Connected bowlers + digital rewards",
                      d: "Bowlers can link their account to the lane to track progress over time and earn digital rewards for hitting milestones—bringing a modern, motivating layer to duckpins."
                    }
                  ].map((x) => (
                    <div
                      key={x.t}
                      style={{
                        gridColumn: "span 12",
                        background: "rgba(255,255,255,0.72)",
                        borderRadius: 14,
                        padding: "1rem",
                        boxShadow: "0 10px 22px rgba(0,0,0,0.06)"
                      }}
                    >
                      <div style={{ fontWeight: 900, color: TEXT_ORANGE }}>{x.t}</div>
                      <div style={{ marginTop: ".25rem", lineHeight: 1.65, color: TEXT }}>{x.d}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expanded Game Options */}
              <div
                style={{
                  gridColumn: "span 12",
                  background: "rgba(255,255,255,0.75)",
                  borderRadius: 18,
                  padding: "1.25rem",
                  border: "1px solid rgba(255,255,255,0.9)",
                  boxShadow: "0 12px 26px rgba(0,0,0,0.06)"
                }}
              >
                <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.05rem" }}>
                  Expanded Game Options
                </div>

                <p style={{ margin: ".6rem 0 0", lineHeight: 1.7 }}>
                  Bring variety to open play and leagues with built-in modes that keep casual bowlers engaged
                  and give competitive bowlers new formats to chase.
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", marginTop: ".85rem" }}>
                  {[
                    "Standard Duckpin Bowling",
                    "Practice Mode",
                    "S.P.A.R.E.",
                    "Strike Derby",
                    "7/8/9 Pin No-Tap"
                  ].map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: ".45rem .7rem",
                        borderRadius: 999,
                        background: "rgba(228,106,46,0.10)",
                        border: "1px solid rgba(228,106,46,0.16)",
                        color: TEXT_ORANGE,
                        fontWeight: 800,
                        fontSize: ".9rem"
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* All-in-One App */}
              <div
                style={{
                  gridColumn: "span 12",
                  background: "#fff",
                  borderRadius: 18,
                  padding: "1.25rem",
                  boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
                  border: "1px solid rgba(0,0,0,0.04)"
                }}
              >
                <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.05rem" }}>
                  All-in-One App
                </div>

                <p style={{ margin: ".6rem 0 0", lineHeight: 1.7 }}>
                  Software that helps alley operators run smoother day-to-day operations—while also powering
                  a modern scoring experience for bowlers.
                </p>

                <ul style={{ margin: ".75rem 0 0", paddingLeft: "1.15rem", lineHeight: 1.7 }}>
                  <li>
                    <strong>League Management:</strong> schedules, rosters, standings, and score verification.
                  </li>
                  <li>
                    <strong>Lane Analytics:</strong> usage, downtime, performance trends, and reporting.
                  </li>
                  <li>
                    <strong>Service Requests:</strong> track issues, assign tasks, and keep maintenance history.
                  </li>
                </ul>

                <p style={{ margin: ".85rem 0 0", lineHeight: 1.7 }}>
                  We also plan to support integrations over time (scoring displays, payment flows, and more),
                  with a focus on keeping the tech simple and reliable for staff.
                </p>
              </div>

              {/* Extra: What we care about */}
              <div
                style={{
                  gridColumn: "span 12",
                  background: "rgba(228,106,46,0.08)",
                  borderRadius: 18,
                  padding: "1.25rem",
                  border: "1px solid rgba(228,106,46,0.14)"
                }}
              >
                <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.05rem" }}>
                  What matters most to us
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(12, 1fr)",
                    gap: ".9rem",
                    marginTop: ".75rem"
                  }}
                >
                  {[
                    { t: "Uptime first", d: "A pinsetter has to be dependable. Everything else is second." },
                    { t: "Retrofit-friendly", d: "Designed to work with existing alleys—not require a rebuild." },
                    { t: "Operator-simple", d: "Easy for staff to run, troubleshoot, and service." },
                    { t: "Bowler experience", d: "Better scoring, better engagement, and reasons to return." }
                  ].map((x) => (
                    <div
                      key={x.t}
                      style={{
                        gridColumn: "span 12",
                        background: "rgba(255,255,255,0.7)",
                        borderRadius: 14,
                        padding: "1rem",
                        boxShadow: "0 10px 22px rgba(0,0,0,0.06)"
                      }}
                    >
                      <div style={{ fontWeight: 900, color: TEXT_ORANGE }}>{x.t}</div>
                      <div style={{ marginTop: ".25rem", lineHeight: 1.6, color: TEXT }}>{x.d}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Bottom CTA */}
          <section
            style={{
              marginTop: "1.5rem",
              background: "#fff",
              borderRadius: 18,
              padding: "1.5rem",
              boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0,0,0,0.04)",
              textAlign: "center"
            }}
          >
            <h3 style={{ margin: "0 0 .5rem", color: ORANGE, fontSize: "1.35rem" }}>
              Demo in progress
            </h3>
            <p style={{ margin: "0 auto", maxWidth: 760, lineHeight: 1.7 }}>
              We’re actively building a demo that shows what the alley experience will look like—from game
              modes to operations tooling. If you’d like to help shape what we build (or share what your
              alley needs most), we’d love to hear from you.
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
                boxShadow: "0 14px 28px rgba(0,0,0,0.14)"
              }}
            >
              Email andrew@duxbowling.com
            </a>

            <div style={{ marginTop: ".85rem", color: "rgba(91,59,37,0.7)", fontSize: ".92rem" }}>
              Questions, comments, or suggestions welcome.
            </div>
          </section>

          <footer
            style={{
              marginTop: "1.75rem",
              textAlign: "center",
              color: "rgba(91,59,37,0.7)",
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