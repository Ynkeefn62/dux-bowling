"use client";

import { useEffect, useState } from "react";

const milestones = [
  { title: "Step 1", text: "Register the business as an LLC with the state of Maryland." },
  { title: "Step 2", text: "File provisional patent approval for the new pinsetter." },
  { title: "Step 3", text: "Website MVP completion with scoring simulator and user accounts." },
  { title: "Step 4", text: "Engage bowlers, alleys, and the National Duckpin Congress." },
  { title: "Step 5", text: "Finalize business plans and product offerings." },
  { title: "Step 6", text: "Work with TEDCO on prototyping, execution, and funding." },
  { title: "Step 7", text: "Prototype development and testing." },
  { title: "Step 8", text: "Initial deployment in live bowling alleys." },
  { title: "Step 9", text: "Broader adoption and retirement of Sherman Pinsetters." },
  { title: "Step 10", text: "Expansion into new geographies." }
];

export default function Home() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const isFirst = index === 0;
  const isLast = index === milestones.length - 1;

  function prev() {
    if (!isFirst) {
      setIndex(i => i - 1);
      setFlipped(false);
    }
  }

  function next() {
    if (!isLast) {
      setIndex(i => i + 1);
      setFlipped(false);
    }
  }

  // Optional: keyboard support (nice on desktop)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirst, isLast]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f0e6",
        fontFamily: "Montserrat, system-ui",
        padding: "2rem 1.25rem",
        position: "relative"
      }}
    >
      {/* Fixed Left Arrow */}
      <button
        onClick={prev}
        disabled={isFirst}
        aria-label="Previous milestone"
        style={{
          position: "fixed",
          left: 16,
          top: "50%",
          transform: "translateY(-50%)",
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: "none",
          background: "#e46a2e",
          color: "#fff",
          fontSize: "1.6rem",
          opacity: isFirst ? 0.5 : 1,
          cursor: isFirst ? "default" : "pointer",
          zIndex: 50,
          boxShadow: "0 10px 25px rgba(0,0,0,0.14)"
        }}
      >
        ←
      </button>

      {/* Fixed Right Arrow */}
      <button
        onClick={next}
        disabled={isLast}
        aria-label="Next milestone"
        style={{
          position: "fixed",
          right: 16,
          top: "50%",
          transform: "translateY(-50%)",
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: "none",
          background: "#e46a2e",
          color: "#fff",
          fontSize: "1.6rem",
          opacity: isLast ? 0.5 : 1,
          cursor: isLast ? "default" : "pointer",
          zIndex: 50,
          boxShadow: "0 10px 25px rgba(0,0,0,0.14)"
        }}
      >
        →
      </button>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <img
          src="/1@300x.png"
          alt="Dux Bowling"
          style={{ maxWidth: 180, width: "100%", height: "auto" }}
        />
      </div>

      {/* Mission */}
      <p
        style={{
          textAlign: "center",
          maxWidth: 700,
          margin: "0 auto 3rem",
          color: "#c75a1d",
          fontSize: "1.1rem",
          lineHeight: 1.7,
          padding: "0 0.25rem"
        }}
      >
        Dux Bowling exists to preserve and modernize duckpin bowling for future
        generations through technology, equipment, and community.
      </p>

      {/* Card */}
      <div
        style={{
          display: "flex",
          justifyContent: "center"
        }}
      >
        <div
          onClick={() => setFlipped(v => !v)}
          style={{
            width: "min(520px, 100%)",
            height: 240,
            perspective: 1000,
            cursor: "pointer"
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              transformStyle: "preserve-3d",
              transition: "transform 0.6s",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)"
            }}
          >
            {/* Front */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#fff",
                borderRadius: 14,
                padding: "1.5rem",
                backfaceVisibility: "hidden",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                textAlign: "center"
              }}
            >
              <h2 style={{ color: "#e46a2e", marginBottom: "0.85rem" }}>
                {milestones[index].title}
              </h2>
              <p style={{ margin: 0, lineHeight: 1.6 }}>
                {milestones[index].text}
              </p>
              <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#a24a1c" }}>
                Tap card to flip
              </p>
            </div>

            {/* Back */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#e46a2e",
                color: "#fff",
                borderRadius: 14,
                padding: "1.5rem",
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
              }}
            >
              <p style={{ margin: 0, fontSize: "1.1rem", lineHeight: 1.6 }}>
                More information on the way.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile spacing so fixed arrows don't cover content */}
      <div style={{ height: 24 }} />
    </main>
  );
}