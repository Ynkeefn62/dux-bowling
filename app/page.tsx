"use client";

import { useState } from "react";
import Image from "next/image";

const ORANGE = "#E46C2A";
const CREAM = "#FBF4E9";

const milestones = [
  "Register the business as an LLC with the state of Maryland.",
  "File provisional patent approval for the new pinsetter.",
  "Website MVP completion, including a bowling simulator and scoring.",
  "Gauge interest with bowlers, alleys, and the National Duckpin Congress.",
  "Finalize business plans and product offerings.",
  "Engage TEDCO for guidance on prototyping and funding.",
  "Prototype development and testing.",
  "Initial deployment in a bowling alley.",
  "Broader adoption to retire Sherman Pinsetters.",
  "Expansion into new geographies."
];

export default function HomePage() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  function prev() {
    if (index > 0) {
      setIndex(index - 1);
      setFlipped(false);
    }
  }

  function next() {
    if (index < milestones.length - 1) {
      setIndex(index + 1);
      setFlipped(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: CREAM,
        padding: "2rem 1rem",
        fontFamily: "Montserrat, system-ui"
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <Image
          src="/1@300x.png"
          alt="Dux Bowling"
          width={180}
          height={180}
          priority
        />
      </div>

      {/* Mission */}
      <p
        style={{
          maxWidth: 600,
          margin: "0 auto 2rem",
          textAlign: "center",
          fontSize: "1.05rem",
          lineHeight: 1.6,
          color: "#333"
        }}
      >
        Dux Bowling exists to preserve and modernize duckpin bowling —
        ensuring its survival through better technology, better experiences,
        and better access.
      </p>

      {/* Card Container */}
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          perspective: "1000px"
        }}
      >
        <div
          onClick={() => setFlipped(!flipped)}
          style={{
            position: "relative",
            height: 240,
            cursor: "pointer",
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
              borderRadius: 16,
              padding: "2.5rem 3.5rem",
              backfaceVisibility: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontSize: "1.2rem",
              color: ORANGE
            }}
          >
            {milestones[index]}

            {/* Left Arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "2rem",
                color: ORANGE,
                background: "none",
                border: "none",
                cursor: index === 0 ? "default" : "pointer",
                opacity: index === 0 ? 0.4 : 1
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
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "2rem",
                color: ORANGE,
                background: "none",
                border: "none",
                cursor:
                  index === milestones.length - 1 ? "default" : "pointer",
                opacity: index === milestones.length - 1 ? 0.4 : 1
              }}
              aria-label="Next"
            >
              ›
            </button>
          </div>

          {/* Back */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: ORANGE,
              borderRadius: 16,
              padding: "2.5rem",
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontSize: "1.2rem"
            }}
          >
            More information on the way.
          </div>
        </div>
      </div>
    </main>
  );
}