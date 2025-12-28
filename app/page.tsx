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
    text: "Website MVP completion with scoring simulator and user accounts."
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
    text: "Prototype development and testing."
  },
  {
    title: "Step 8",
    text: "Initial deployment in live bowling alleys."
  },
  {
    title: "Step 9",
    text: "Broader adoption and retirement of Sherman Pinsetters."
  },
  {
    title: "Step 10",
    text: "Expansion into new geographies."
  }
];

export default function Home() {
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
        background: "#f5f0e6",
        fontFamily: "Montserrat, system-ui",
        padding: "2rem"
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <img
          src="/1@300x.png"
          alt="Dux Bowling"
          style={{ maxWidth: 180 }}
        />
      </div>

      {/* Mission */}
      <p style={{
        textAlign: "center",
        maxWidth: 700,
        margin: "0 auto 3rem",
        color: "#c75a1d",
        fontSize: "1.1rem"
      }}>
        Dux Bowling exists to preserve and modernize duckpin bowling for future
        generations through technology, equipment, and community.
      </p>

      {/* Carousel */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem"
      }}>
        {/* Left Arrow */}
        <button
          onClick={prev}
          disabled={index === 0}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "none",
            background: "#e46a2e",
            color: "#fff",
            fontSize: "1.25rem",
            opacity: index === 0 ? 0.5 : 1,
            cursor: "pointer"
          }}
        >
          ←
        </button>

        {/* Card */}
        <div
          onClick={() => setFlipped(!flipped)}
          style={{
            width: 300,
            height: 220,
            perspective: 1000,
            cursor: "pointer"
          }}
        >
          <div style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            transition: "transform 0.6s",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)"
          }}>
            {/* Front */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: "#fff",
              borderRadius: 12,
              padding: "1.25rem",
              backfaceVisibility: "hidden",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              textAlign: "center"
            }}>
              <h2 style={{ color: "#e46a2e", marginBottom: "0.75rem" }}>
                {milestones[index].title}
              </h2>
              <p>{milestones[index].text}</p>
            </div>

            {/* Back */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: "#e46a2e",
              color: "#fff",
              borderRadius: 12,
              padding: "1.5rem",
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center"
            }}>
              <p>More information on the way.</p>
            </div>
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={next}
          disabled={index === milestones.length - 1}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "none",
            background: "#e46a2e",
            color: "#fff",
            fontSize: "1.5rem",
            opacity: index === milestones.length - 1 ? 0.5 : 1,
            cursor: "pointer"
          }}
        >
          →
        </button>
      </div>
    </main>
  );
}