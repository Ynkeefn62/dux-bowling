export default function Footer() {
  return (
    <footer
      className="site-footer"
      style={{
        marginTop: "4rem",
        padding: "2rem 1rem",
        borderTop: "1px solid #e5e5e5",
        textAlign: "center",
        fontSize: "0.9rem",
      }}
    >
      <nav style={{ marginBottom: "0.5rem" }}>
        <a href="/privacy">Privacy Policy</a>
        <span> | </span>
        <a href="/terms">Terms of Service</a>
      </nav>
      <p style={{ margin: 0 }}>© 2026 Dux Bowling LLC</p>
    </footer>
  );
}