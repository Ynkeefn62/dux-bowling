"use client";

import { useEffect, useRef, useState } from "react";

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

  // dynamic vertical positioning for fixed left/right buttons
  const cardWrapRef = useRef<HTMLDivElement | null>(null);
  const [arrowTop, setArrowTop] = useState<number | null>(null);

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

  useEffect(() => {
    const update = () => {
      if (!cardWrapRef.current) return;
      const rect = cardWrapRef.current.getBoundingClientRect();
      // center of the card on screen
      const centerY = rect.top + rect.height / 2;
      setArrowTop(centerY);
    };

    // Run once on mount + whenever the milestone changes (card can reflow)
    update();

    // Update on scroll + resize
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    // Also update after fonts/images settle
    const t = window.setTimeout(update, 50);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.clearTimeout(t);
    };
  }, [index, flipped]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f0e6",
        fontFamily: "Montserrat, system-ui",
        padding: "2rem 1rem 4rem"
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <img src="/1@300x.png" alt="Dux Bowling" style={{ maxWidth: 180, height: "auto" }} />
      </div>

      {/* Mission */}
      <p
        style={{
          textAlign: "center",
          maxWidth: 700,
          margin: "0 auto 3rem",
          color: "#c75a1d",
          fontSize: "1.1rem",
          lineHeight: 1.6
        }}
      >
        Dux Bowling exists to preserve and modernize duckpin bowling for future
        generations through technology, equipment, and community.
      </p>

      {/* Carousel row (card in the center) */}
      <div
        style={{
          display: "flex",
          justifyContent: "center"
        }}
      >
        {/* Card wrapper ref used to position the fixed arrow buttons */}
        <div ref={cardWrapRef} style={{ position: "relative" }}>
          <div
            onClick={() => setFlipped(f => !f)}
            style={{
              width: 320,
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
                  borderRadius: 12,
                  padding: "1.25rem",
                  backfaceVisibility: "hidden",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.10)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  textAlign: "center"
                }}
              >
                <h2 style={{ color: "#e46a2e", marginBottom: "0.75rem" }}>
                  {milestones[index].title}
                </h2>
                <p style={{ margin: 0, lineHeight: 1.5 }}>{milestones[index].text}</p>
              </div>

              {/* Back */}
              <div
                style={{
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
                  textAlign: "center",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.10)"
                }}
              >
                <p style={{ margin: 0, fontSize: "1.05rem" }}>More information on the way.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed-left/right buttons with dynamic vertical position */}
      <button
        onClick={prev}
        disabled={isFirst}
        aria-label="Previous"
        style={{
          position: "fixed",
          left: 12,
          top: arrowTop ?? "50%",
          transform: "translateY(-50%)",
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "none",
          background: "#e46a2e",
          color: "#fff",
          fontSize: "1.5rem",
          opacity: isFirst ? 0.5 : 1,
          cursor: isFirst ? "default" : "pointer",
          zIndex: 50
        }}
      >
        ‹
      </button>

      <button
        onClick={next}
        disabled={isLast}
        aria-label="Next"
        style={{
          position: "fixed",
          right: 12,
          top: arrowTop ?? "50%",
          transform: "translateY(-50%)",
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "none",
          background: "#e46a2e",
          color: "#fff",
          fontSize: "1.5rem",
          opacity: isLast ? 0.5 : 1,
          cursor: isLast ? "default" : "pointer",
          zIndex: 50
        }}
      >
        ›
      </button>
    </main>
  );
}