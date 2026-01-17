"use client";

import Link from "next/link";

export default function TopBanner() {
  return (
    <div
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
        justifyContent: "center"
      }}
    >
      {/* Clickable centered logo */}
      <Link
        href="/"
        aria-label="Go to homepage"
        style={{
          maxWidth: "60%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <img
          src="/5@300x.png"
          alt="Dux Bowling"
          style={{
            height: 36,
            width: "auto",
            maxWidth: "100%",
            objectFit: "contain",
            cursor: "pointer"
          }}
        />
      </Link>
    </div>
  );
}