"use client";

import { useState } from "react";
import Link from "next/link";
import { useDevice } from "@/app/hooks/useDevice";

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const { isMobile, isTablet } = useDevice();

  // Button sits just inside the banner height
  const btnSize = 44;
  const btnTop  = isMobile ? "6px" : isTablet ? "10px" : "14px";
  // Panel is wider on mobile to feel native
  const panelW  = isMobile ? "min(78vw, 280px)" : "260px";

  function close() { setOpen(false); }

  return (
    <>
      {/* Hamburger / Close button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        style={{
          position: "fixed",
          top: btnTop,
          left: "1rem",
          width: btnSize,
          height: btnSize,
          borderRadius: "50%",
          background: "#E86A33",
          border: "none",
          cursor: "pointer",
          zIndex: 1100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px rgba(232,106,51,0.45)",
          touchAction: "manipulation",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <div style={{ width: 20, display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{
            ...barStyle,
            transform: open ? "rotate(45deg) translate(4px, 4px)" : "none",
            transition: "transform 0.22s ease",
          }} />
          <span style={{
            ...barStyle,
            opacity: open ? 0 : 1,
            transform: open ? "scaleX(0)" : "none",
            transition: "opacity 0.15s ease, transform 0.15s ease",
          }} />
          <span style={{
            ...barStyle,
            transform: open ? "rotate(-45deg) translate(4px, -4px)" : "none",
            transition: "transform 0.22s ease",
          }} />
        </div>
      </button>

      {/* Backdrop overlay */}
      <div
        onClick={close}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(3px)",
          zIndex: 1050,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
          transition: "opacity 0.22s ease",
        }}
      />

      {/* Slide-in nav panel */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: panelW,
          height: "100dvh",
          background: "#F6EFE7",
          padding: isMobile ? "4rem 1.25rem 2rem" : "5rem 1.5rem 2rem",
          transform: open ? "translateX(0)" : "translateX(-105%)",
          transition: "transform 0.25s cubic-bezier(0.16,1,0.3,1)",
          zIndex: 1100,
          boxShadow: "6px 0 24px rgba(0,0,0,0.18)",
          fontFamily: "Montserrat, system-ui",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Primary navigation */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <NavLink href="/"          label="Home"     onNav={close} />
          <NavLink href="/bowlers"   label="Bowlers"  onNav={close} />
          <NavLink href="/alleys"    label="Alleys"   onNav={close} />
          <NavLink href="/shop"      label="Shop"     onNav={close} />
          <NavLink href="/about-us"  label="About Us" onNav={close} />
        </div>

        {/* Secondary links — more useful on mobile where navigation is harder */}
        <div style={{
          marginTop: "auto",
          paddingTop: "1.25rem",
          borderTop: "1px solid rgba(232,106,51,0.15)",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}>
          <NavLink href="/bowlers/dashboard" label="My Dashboard" onNav={close} small />
          <NavLink href="/simulators"        label="Simulators"   onNav={close} small />
        </div>
      </nav>
    </>
  );
}

function NavLink({
  href,
  label,
  onNav,
  small = false,
}: {
  href: string;
  label: string;
  onNav: () => void;
  small?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onNav}
      style={{
        display: "block",
        padding: small ? ".6rem 0" : ".75rem 0",
        borderBottom: "1px solid rgba(232,106,51,0.10)",
        fontSize: small ? ".9rem" : "1.08rem",
        color: "#E86A33",
        textDecoration: "none",
        fontWeight: small ? 600 : 700,
        letterSpacing: small ? 0 : ".01em",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {label}
    </Link>
  );
}

const barStyle: React.CSSProperties = {
  display: "block",
  height: "2px",
  width: "100%",
  background: "#fff",
  borderRadius: 2,
  transformOrigin: "center",
};
