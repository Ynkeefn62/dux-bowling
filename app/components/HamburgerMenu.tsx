"use client";

import { useState } from "react";
import Link from "next/link";

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Open menu"
        style={{
          position: "fixed",
          top: "1rem",
          left: "1rem",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "#E86A33", // brand orange
          border: "none",
          cursor: "pointer",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: 22 }}>
          <span style={lineStyle} />
          <span style={lineStyle} />
          <span style={lineStyle} />
        </div>
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 999,
          }}
        />
      )}

      {/* Menu Panel */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: open ? 0 : "-260px",
          width: "260px",
          height: "100vh",
          background: "#F6EFE7", // cream background
          padding: "5rem 1.5rem",
          transition: "left 0.25s ease",
          zIndex: 1000,
          boxShadow: "2px 0 10px rgba(0,0,0,0.15)",
          fontFamily: "Montserrat, system-ui",
        }}
      >
        <MenuLink href="/" label="Home" />
        <MenuLink href="/bowlers" label="Bowlers" />
        <MenuLink href="/alleys" label="Alleys" />
        <MenuLink href="/shop" label="Shop" />
        <MenuLink href="/about-us" label="About Us" />
      </nav>
    </>
  );
}

function MenuLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        marginBottom: "1.25rem",
        fontSize: "1.1rem",
        color: "#E86A33",
        textDecoration: "none",
        fontWeight: 600,
      }}
    >
      {label}
    </Link>
  );
}

const lineStyle = {
  display: "block",
  height: "2px",
  background: "#fff",
  margin: "5px 0",
};