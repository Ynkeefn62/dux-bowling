"use client";

import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const acknowledged = localStorage.getItem("dux_cookie_notice");
    if (!acknowledged) {
      setVisible(true);
    }
  }, []);

  const acknowledge = () => {
    localStorage.setItem("dux_cookie_notice", "acknowledged");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        width: "100%",
        background: "#111",
        color: "#fff",
        padding: "1rem",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.9rem" }}>
          We use essential cookies to operate and secure the Dux Bowling website.
          These cookies are required for core functionality such as account
          access and scoring features. Learn more in our{" "}
          <a href="/privacy" style={{ color: "#fff", textDecoration: "underline" }}>
            Privacy Policy
          </a>.
        </p>

        <button
          onClick={acknowledge}
          style={{
            background: "#fff",
            color: "#000",
            border: "none",
            padding: "0.5rem 1rem",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}