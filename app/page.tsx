"use client";

import { useEffect, useRef } from "react";

const steps = [
  "Register the business as an LLC with the state of Maryland.",
  "File provisional patent approval for the new pinsetter.",
  "Complete the website MVP, including a bowling simulator and player accounts.",
  "Engage bowlers, bowling alleys, and the National Duckpin Congress.",
  "Finalize business plans and product offerings.",
  "Work with TEDCO on prototyping, execution, and funding.",
  "Develop and test prototypes integrated with scoring systems.",
  "Deploy initial systems to partner bowling alleys.",
  "Expand adoption and retire legacy Sherman pinsetters.",
  "Grow into new geographic markets."
];

export default function Home() {
  const itemsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
          }
        });
      },
      { threshold: 0.2 }
    );

    itemsRef.current.forEach(el => el && observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <main
      style={{
        background: "#f8eddc",
        minHeight: "100vh",
        padding: "3rem 1.25rem",
        fontFamily: "'Montserrat', system-ui"
      }}
    >
      {/* Logo */}
      <img
        src="/1@300x.png"
        alt="Dux Bowling Logo"
        style={{
          maxWidth: "420px",
          width: "100%",
          display: "block",
          margin: "0 auto 2rem"
        }}
      />

      {/* Mission */}
      <section
        style={{
          maxWidth: 720,
          margin: "0 auto 3rem",
          textAlign: "center",
          color: "#d9772b"
        }}
      >
        <h1>Saving Duckpin Bowling</h1>
        <p>
          Dux Bowling exists to modernize duckpin bowling while preserving
          its heritage — through new technology, new equipment, and new
          player experiences.
        </p>
      </section>

      {/* Steps */}
      <section style={{ maxWidth: 900, margin: "0 auto" }}>
        {steps.map((text, i) => (
          <div
            key={i}
            ref={el => {
              if (el) itemsRef.current[i] = el;
            }}
            className="step"
            style={{
              opacity: 0,
              transform: "translateX(-40px)",
              transition: "all 0.6s ease-out",
              background: "#fff",
              borderRadius: 12,
              padding: "1.25rem 1.5rem",
              marginBottom: "1.25rem",
              color: "#d9772b",
              boxShadow: "0 6px 18px rgba(0,0,0,0.08)"
            }}
          >
            <strong>Step {i + 1}</strong>
            <p style={{ marginTop: ".5rem" }}>{text}</p>
          </div>
        ))}
      </section>

      {/* Animation styles */}
      <style jsx>{`
        .show {
          opacity: 1 !important;
          transform: translateX(0) !important;
        }
      `}</style>
    </main>
  );
}