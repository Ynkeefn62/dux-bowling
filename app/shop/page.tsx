"use client";

const BG = "#121212";          // near-black (better than pure black)
const PANEL = "#1a1a1a";       // dark panel
const CARD = "#ffffff";        // white cards
const TEXT = "#f2f2f2";        // primary light text
const MUTED = "rgba(242,242,242,0.78)";
const ORANGE = "#e46a2e";
const ORANGE_SOFT = "rgba(228,106,46,0.14)";

export default function ShopPage() {
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
          {/* Title / Hero */}
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
              Dux Bowling Merch <span style={{ color: ORANGE }}>(Coming Soon)</span>
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: "clamp(1.02rem, 2vw, 1.2rem)",
                lineHeight: 1.7,
                color: MUTED
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
                    background: PANEL,
                    borderRadius: 18,
                    padding: "1.25rem",
                    boxShadow: "0 18px 40px rgba(0,0,0,0.50)",
                    border: "1px solid rgba(255,255,255,0.08)"
                  }}
                >
                  <div style={{ fontWeight: 900, color: ORANGE, fontSize: "1.05rem" }}>{x.t}</div>
                  <p style={{ margin: ".55rem 0 0", lineHeight: 1.7, color: MUTED }}>{x.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Why it matters + avatar linking */}
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
            <h3 style={{ margin: 0, color: ORANGE, fontSize: "1.35rem" }}>
              Every purchase supports the mission
            </h3>

            <p style={{ margin: ".6rem 0 0", lineHeight: 1.7, color: MUTED }}>
              Proceeds from merch will go directly toward developing the Mother Dux Pinsetter and the
              scoring + community software that powers the modern duckpin experience.
            </p>

            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                borderRadius: 16,
                background: "rgba(0,0,0,0.30)",
                border: "1px solid rgba(228,106,46,0.18)"
              }}
            >
              <div style={{ fontWeight: 900, color: TEXT }}>Avatar-linked memorabilia</div>
              <p style={{ margin: ".45rem 0 0", lineHeight: 1.7, color: MUTED }}>
                Everything you purchase will also be linked to your Dux Bowling avatar—so your real-world
                gear becomes part of your digital identity (skins, cosmetics, trophies, and more).
              </p>
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
              Shop demo in progress
            </h3>
            <p style={{ margin: "0 auto", maxWidth: 760, lineHeight: 1.7, color: MUTED }}>
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