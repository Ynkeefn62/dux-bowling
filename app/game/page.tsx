"use client";

import { useState } from "react";

export default function GamePage() {
  const [gameId] = useState(crypto.randomUUID());
  const [frames, setFrames] = useState<number[][]>([]);
  const [currentRolls, setCurrentRolls] = useState<number[]>([]);
  const [score, setScore] = useState(0);

  const frameNumber = frames.length + 1;
  const pinsRemaining = 10 - currentRolls.reduce((a, b) => a + b, 0);

  const rollOptions = Array.from(
    { length: pinsRemaining + 1 },
    (_, i) => i
  );

  async function submitFrame(rolls: number[]) {
    const res = await fetch("/api/test-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        game_id: gameId,
        frame_number: frameNumber,
        rolls
      })
    });

    const data = await res.json();
    if (data.score !== undefined) {
      setScore(data.score);
    }
  }

  function addRoll(pins: number) {
    const updated = [...currentRolls, pins];
    setCurrentRolls(updated);

    const isStrike = updated[0] === 10;
    const isSpare = updated.reduce((a, b) => a + b, 0) === 10;

    const maxRolls =
      frameNumber === 10
        ? isStrike || isSpare
          ? 3
          : 3
        : isStrike
        ? 1
        : 3;

    if (updated.length >= maxRolls) {
      setFrames([...frames, updated]);
      submitFrame(updated);
      setCurrentRolls([]);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8f1e7",
        padding: "1.5rem",
        fontFamily: "Montserrat, sans-serif",
        color: "#e56b1f"
      }}
    >
      <h1>Duckpin Game</h1>
      <p>Frame {frameNumber} / 10</p>

      <div style={{ margin: "1rem 0" }}>
        <strong>Current Score:</strong> {score}
      </div>

      <select
        onChange={e => addRoll(Number(e.target.value))}
        defaultValue=""
        style={{
          width: "100%",
          padding: "0.75rem",
          fontSize: "1rem"
        }}
      >
        <option value="" disabled>
          Select pins knocked down
        </option>
        {rollOptions.map(p => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <section style={{ marginTop: "2rem" }}>
        <h3>Frames</h3>
        {frames.map((f, i) => (
          <div key={i}>
            Frame {i + 1}: {f.join(", ")}
          </div>
        ))}
      </section>
    </main>
  );
}