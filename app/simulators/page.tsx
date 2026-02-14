import Link from "next/link";

export default function SimulatorsHomePage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", background: "#121212", color: "#f5f5f5", fontFamily: "Montserrat, system-ui" }}>
      <div style={{ width: "min(720px, 100%)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: "1.5rem", background: "rgba(255,255,255,0.04)" }}>
        <h1 style={{ marginTop: 0 }}>Simulator Pages</h1>
        <p>Choose a simulator to test lane operations and scoring.</p>
        <div style={{ display: "grid", gap: ".8rem" }}>
          <Link href="/simulators/pinsetter" style={{ padding: ".8rem 1rem", borderRadius: 10, background: "#e46a2e", color: "white", textDecoration: "none", fontWeight: 700 }}>
            Open Pinsetter Simulator
          </Link>
          <Link href="/simulators/lane-screen" style={{ padding: ".8rem 1rem", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", color: "white", textDecoration: "none" }}>
            Open Lane Screen Simulator
          </Link>
        </div>
      </div>
    </main>
  );
}
