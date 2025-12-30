"use client";

import { useEffect, useRef } from "react";

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
        src="/under_construction_2.png"
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
        <h1>More to Come</h1>
        <p>
          We appreciate your patience as we build the ultimate experience for Duckpin Bowlers.
        </p>
      </section>
    </main>
  );
}
 