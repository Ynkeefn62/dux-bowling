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
      setIndex(index - 1);
    }
  }

  function next() {
    if (!isLast) {
      setFlipped(false);
      setIndex(index + 1);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#FBF3E6",
        padding: "2rem 1rem",
        fontFamily: "'Montserrat', system-ui"
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
          maxWidth: 600,
          margin: "0 auto 2rem",
          color: "#C45A1A",
          fontSize: "1rem"
        }}
      >
        We are building modern equipment, software, and experiences to
        <strong> save duckpin bowling.</strong>
      </p>

      {/* Card Container */}
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          position: "relative"
        }}
      >
        {/* Card */}
        <div
          onClick={() => setFlipped(!flipped)}
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "2.5rem 3.5rem",
            textAlign: "center",
            minHeight: 220,
            boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
            cursor: "pointer",
            transition: "transform 0.4s",
            color: "#C45A1A"
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
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "2rem",
              background: "none",
              border: "none",
              color: "#C45A1A",
              opacity: isFirst ? 0.5 : 1,
              cursor: isFirst ? "default" : "pointer"
            }}
            aria-label="Previous"
          >
            ‹
          </button>

          {/* Right Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "2rem",
              background: "none",
              border: "none",
              color: "#C45A1A",
              opacity: isLast ? 0.5 : 1,
              cursor: isLast ? "default" : "pointer"
            }}
            aria-label="Next"
          >
            ›
          </button>
        </div>
      </div>
    </main>
  );
}