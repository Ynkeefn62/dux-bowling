"use client";

import { useState } from "react";

const milestones = [
  {
    title: "Step 1",
    text: "Register the business as an LLC with the state of Maryland."
  },
  {
    title: "Step 2",
    text: "File provisional patent approval for the new pinsetter."
  },
  {
    title: "Step 3",
    text: "Website MVP including scoring, accounts, and stat tracking."
  },
  {
    title: "Step 4",
    text: "Engage bowlers, alleys, and the National Duckpin Congress."
  },
  {
    title: "Step 5",
    text: "Finalize business plans and product offerings."
  },
  {
    title: "Step 6",
    text: "Work with TEDCO on prototyping, execution, and funding."
  },
  {
    title: "Step 7",
    text: "Prototype development and scoring system integration."
  },
  {
    title: "Step 8",
    text: "Initial deployment into real bowling alleys."
  },
  {
    title: "Step 9",
    text: "Broader adoption and retirement of Sherman Pinsetters."
  },
  {
    title: "Step 10",
    text: "Expand duckpin bowling into new geographies."
  }
];

export default function Home() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  function next() {
    setFlipped(false);
    setIndex((i) => Math.min(i + 1, milestones.length - 1));
  }

  function prev() {
    setFlipped(false);
    setIndex((i) => Math.max(i - 1, 0));
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#FBF4E9",
        fontFamily: "Montserrat, system-ui, sans-serif",
        color: "#E86C1A",
        padding: "1.5rem"
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <img
          src="/1@300x.png"
          alt="Dux Bowling"
          style={{ maxWidth: "180px", height: "auto" }}
        />
      </div>

      {/* Mission */}
      <p style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 2rem" }}>
        We’re building the future of duckpin bowling — preserving the game,
        modernizing the experience, and ensuring it survives for generations.
      </p>

      {/* Card */}
      <div
        style={{
          perspective: "1200px",
          maxWidth: 320,
          margin: "0 auto"
        }}
      >
        <div
          onClick={() => setFlipped(!flipped)}
          style={{
            position: "relative",
            width: "100%",
            height: 260,
            transformStyle: "preserve-3d",
            transition: "transform 0.6s",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            cursor: "pointer"
          }}
        >
          {/* Front */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              background: "#fff",
              borderRadius: 16,
              padding: "1.5rem",
              boxShadow: "0 12px 30px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center"
            }}
          >
            <h2>{milestones[index].title}</h2>
            <p style={{ color: "#333" }}>{milestones[index].text}</p>
            <small style={{ marginTop: "1rem" }}>
              Tap to flip →
            </small>
          </div>

          {/* Back */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              background: "#E86C1A",
              color: "#fff",
              borderRadius: 16,
              padding: "1.5rem",
              transform: "rotateY(180deg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center"
            }}
          >
            <strong>More information on the way</strong>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          maxWidth: 320,
          margin: "1.5rem auto 0"
        }}
      >
        <button onClick={prev} disabled={index === 0}>
          ← Prev
        </button>
        <span>
          {index + 1} / {milestones.length}
        </span>
        <button onClick={next} disabled={index === milestones.length - 1}>
          Next →
        </button>
      </div>
    </main>
  );
}