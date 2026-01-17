"use client";

export default function TopBanner() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 72,
        backgroundColor: "#000",
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <img
        src="/5@300x.png" // update path if needed
        alt="Dux Bowling"
        style={{
          height: 42,
          width: "auto",
          pointerEvents: "none",
          userSelect: "none"
        }}
      />
    </div>
  );
}