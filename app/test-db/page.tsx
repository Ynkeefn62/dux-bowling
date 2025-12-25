"use client";

import { useState } from "react";

export default function TestDbPage() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        a: Number(a),
        b: Number(b)
      })
    });

    const data = await res.json();
    setResult(data.sum);
    setLoading(false);
  }

  return (
    <main style={{ maxWidth: 600, margin: "4rem auto", fontFamily: "system-ui" }}>
      <h1>Supabase Test</h1>

      <input
        type="number"
        placeholder="First number"
        value={a}
        onChange={(e) => setA(e.target.value)}
      />

      <br /><br />

      <input
        type="number"
        placeholder="Second number"
        value={b}
        onChange={(e) => setB(e.target.value)}
      />

      <br /><br />

      <button onClick={handleSubmit}>
        Add Numbers
      </button>

      {result !== null && (
        <p>
          <strong>Result:</strong> {result}
        </p>
      )}
    </main>
  );
}