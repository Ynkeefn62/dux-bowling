"use client";

import { useState } from "react";

export default function GamePage() {
  const [frame, setFrame] = useState(1);
  const [rolls, setRolls] = useState<number[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [gameId] = useState(crypto.randomUUID());

  const maxPins = Math.max(0, 10 - rolls.reduce((a, b) => a + b, 0));

  function addRoll(pins: number) {
    if (rolls.length >= 3 || pins > maxPins) return;
    setRolls([...rolls, pins]);
  }

  async function submitFrame() {
    const frameScore = rolls.reduce((a, b) => a + b, 0);

    await fetch("/api/test-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId,
        frame,
        roll1: rolls[0] ?? null,
        roll2: rolls[1] ?? null,
        roll3: rolls[2] ?? null,
        frameScore
      })
    });

    setTotalScore(totalScore + frameScore);
    setRolls([]);
    setFrame(frame + 1);
  }

  return (
    <main
      style={{
        background: "#f8eddc",
        minHeight: "100vh",
        padding: "1.5rem",
        fontFamily: "Montserrat, system-ui",
        color: "#d9772b",
        maxWidth: 420,
        margin: "0 auto"
      }}
    >
      <h1 style={{ textAlign: "center" }}>Duckpin Game</h1>

      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "1rem",
          marginBottom: "1rem",
          boxShadow: "0 6px 18px rgba(0,0,0,.08)"
        }}
      >
        <strong>Frame {frame}</strong>
        <p>Rolls: {rolls.join(", ") || "—"}</p>
        <p>Total Score: {totalScore}</p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: ".5rem",
          marginBottom: "1rem"
        }}
      >
        {Array.from({ length: maxPins + 1 }).map((_, i) => (
          <button
            key={i}
            onClick={() => addRoll(i)}
            style={{
              padding: ".75rem 0",
              borderRadius: 8,
              border: "none",
              background: "#d9772b",
              color: "#fff",
              fontSize: ".9rem"
            }}
          >
            {i}
          </button>
        ))}
      </div>

      <button
        onClick={submitFrame}
        disabled={rolls.length === 0}
        style={{
          width: "100%",
          padding: ".75rem",
          borderRadius: 10,
          border: "none",
          background: rolls.length ? "#d9772b" : "#ccc",
          color: "#fff",
          fontSize: "1rem"
        }}
      >
        End Frame
      </button>
    </main>
  );
}