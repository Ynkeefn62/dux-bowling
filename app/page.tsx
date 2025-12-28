"use client";

import { useState } from "react";
import Image from "next/image";

const steps = [
  "Register the business as an LLC with the state of Maryland.",
  "File provisional patent approval for the new pinsetter.",
  "Website MVP completion, including scoring & simulator.",
  "Reach out to bowlers, alleys, and NDC to gauge interest.",
  "Finalize business plans and product offerings.",
  "Engage TEDCO for prototyping and funding guidance.",
  "Prototype development and testing.",
  "Initial deployment into pilot bowling alleys.",
  "Broader adoption to retire Sherman Pinsetters.",
  "Expansion into new geographies."
];

export default function HomePage() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  function prev() {
    if (!isFirst) {
      setFlipped(false);
      setIndex((i) => i - 1);
    }
  }

  function next() {
    if (!isLast) {
      setFlipped(false);
      setIndex((i) => i + 1);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#FBF3E6",
        padding: "2rem 1rem"
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <Image
          src="/1@300x.png"
          alt="Dux Bowling"
          width={160}
          height={160}
          priority
        />
      </div>

      {/* Mission */}
      <p
        style={{
          textAlign: "center",
          maxWidth: 640,
          margin: "0 auto 2rem",
          color: "#C45A1A",
          fontSize: "1rem",
          lineHeight: 1.6
        }}
      >
        We are building modern equipment, software, and experiences to
        <strong> save duckpin bowling.</strong>
      </p>

      {/* Card Wrapper */}
      <div style={{ maxWidth: 760, margin: "0 auto", position: "relative" }}>
        {/* Card */}
        <div
          onClick={() => setFlipped((f) => !f)}
          style={{
            position: "relative",
            background: "#fff",
            borderRadius: 18,
            padding: "2.75rem 4rem",
            minHeight: 240,
            boxShadow: "0 14px 36px rgba(0,0,0,0.1)",
            cursor: "pointer",
            color: "#C45A1A",
            textAlign: "center"
          }}
        >
          {!flipped ? (
            <>
              <h2 style={{ marginBottom: "1rem" }}>
                Step {index + 1}
              </h2>
              <p style={{ fontSize: "1.05rem" }}>{steps[index]}</p>
            </>
          ) : (
            <p style={{ fontSize: "1.1rem" }}>
              More information on the way.
            </p>
          )}

          {/* Left Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous"
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              fontSize: "2.25rem",
              color: "#C45A1A",
              opacity: isFirst ? 0.4 : 1,
              cursor: isFirst ? "default" : "pointer"
            }}
          >
            ‹
          </button>

          {/* Right Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Next"
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              fontSize: "2.25rem",
              color: "#C45A1A",
              opacity: isLast ? 0.4 : 1,
              cursor: isLast ? "default" : "pointer"
            }}
          >
            ›
          </button>
        </div>
      </div>
    </main>
  );
}