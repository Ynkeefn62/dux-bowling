"use client";

const CREAM = "#f5f0e6";
const ORANGE = "#e46a2e";
const TEXT = "#5b3b25";
const TEXT_ORANGE = "#c75a1d";

export default function ShopPage() {
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
              Shop
            </div>

            <h1
              style={{
                margin: ".9rem 0 .6rem",
                fontSize: "clamp(2rem, 4.5vw, 3rem)",
                lineHeight: 1.05,
                color: TEXT
              }}
            >
              Dux Bowling Merch
              <span style={{ color: ORANGE }}> (Coming Soon)</span>
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: "clamp(1.02rem, 2vw, 1.2rem)",
                lineHeight: 1.7,
                color: TEXT
              }}
            >
              We’re building a shop with branded duckpin gear—designed to look great on the lanes and help
              fund the next generation of duckpin technology.
            </p>
          </div>

          {/* What we plan to sell */}
          <section style={{ marginTop: "1.5rem" }}>
            <h2 style={{ margin: "0 0 .75rem", color: TEXT, fontSize: "1.35rem" }}>
              What will be available
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(12, 1fr)",
                gap: "1rem"
              }}
            >
              {[
                { t: "Branded T-Shirts", d: "Retro-inspired designs made for bowlers." },
                { t: "Lane Towels", d: "Classic, durable towels for practice and league nights." },
                { t: "Hats", d: "Clean, everyday hats with Dux Bowling branding." },
                { t: "Bowling Balls", d: "Limited runs and collaborations (details coming soon)." }
              ].map((x) => (
                <div
                  key={x.t}
                  style={{
                    gridColumn: "span 12",
                    background: "#fff",
                    borderRadius: 18,
                    padding: "1.25rem",
                    boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
                    border: "1px solid rgba(0,0,0,0.04)"
                  }}
                >
                  <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.05rem" }}>{x.t}</div>
                  <p style={{ margin: ".55rem 0 0", lineHeight: 1.7 }}>{x.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Why it matters + avatar linking */}
          <section
            style={{
              marginTop: "1.5rem",
              background: "rgba(228,106,46,0.08)",
              borderRadius: 18,
              padding: "1.5rem",
              border: "1px solid rgba(228,106,46,0.14)"
            }}
          >
            <h3 style={{ margin: 0, color: ORANGE, fontSize: "1.35rem" }}>
              Every purchase supports the mission
            </h3>

            <p style={{ margin: ".6rem 0 0", lineHeight: 1.7 }}>
              Proceeds from merch will go directly toward developing the Mother Dux Pinsetter and the
              scoring + community software that powers the modern duckpin experience.
            </p>

            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                borderRadius: 16,
                background: "rgba(255,255,255,0.70)",
                boxShadow: "0 10px 22px rgba(0,0,0,0.06)"
              }}
            >
              <div style={{ fontWeight: 900, color: TEXT_ORANGE }}>
                Avatar-linked memorabilia
              </div>
              <p style={{ margin: ".45rem 0 0", lineHeight: 1.7 }}>
                Everything you purchase will also be linked to your Dux Bowling avatar—so your real-world
                gear becomes part of your digital identity (skins, cosmetics, trophies, and more).
              </p>
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
              Shop demo in progress
            </h3>
            <p style={{ margin: "0 auto", maxWidth: 760, lineHeight: 1.7 }}>
              We’re building a demo view of the shop experience and how purchases will connect to avatars.
              More details coming soon.
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