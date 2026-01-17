"use client";

import Image from "next/image";

const ORANGE = "#e46a2e";

export default function TopBanner() {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 72,
        background: "#000",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.45)"
      }}
    >
      {/* Left: Menu */}
      <div style={{ width: 56, display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
        <button
          aria-label="Menu"
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            border: "none",
            background: ORANGE,
            color: "#fff",
            fontSize: 22,
            fontWeight: 900,
            cursor: "pointer"
          }}
          onClick={() => {
            // TODO: open your menu drawer
          }}
        >
          ≡
        </button>
      </div>

      {/* Center: Banner */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 0
        }}
      >
        <div
          style={{
            height: 46,
            width: "min(520px, 60vw)",
            position: "relative"
          }}
        >
          <Image
            src="/5@300x.png"
            alt="Dux Bowling"
            fill
            priority
            sizes="(max-width: 768px) 60vw, 520px"
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>

      {/* Right: Login */}
      <div style={{ width: 56, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <button
          aria-label="Account"
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            border: "none",
            background: ORANGE,
            color: "#fff",
            fontSize: 22,
            fontWeight: 900,
            cursor: "pointer"
          }}
          onClick={() => {
            // TODO: go to login/profile
            // router.push("/login") etc.
          }}
        >
          👤
        </button>
      </div>
    </header>
  );
}