export default function Home() {
  return (
    <main style={{ 
      maxWidth: "800px", 
      margin: "0 auto", 
      padding: "4rem 1.5rem",
      fontFamily: "system-ui, sans-serif"
    }}>
      <h1>Dux Bowling</h1>

      <p style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>
        Dux Bowling is focused on modernizing duckpin bowling through
        custom equipment, technology, and new player experiences.
      </p>

      <p style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>
        We’re currently building out our pinsetter systems, scoring
        software, and supporting tools.
      </p>

      <div style={{
        marginTop: "2.5rem",
        padding: "1.5rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
        background: "#E07A2F"
      }}>
        <strong>More updates coming soon.</strong>
        <p>
          Follow along as we continue development and prepare for
          upcoming announcements.
        </p>
      </div>
    </main>
  );
}
