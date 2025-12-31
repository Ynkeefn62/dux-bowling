"use client";

import { useEffect, useState } from "react";

const ORANGE = "#e46a2e";

export default function LoginButton() {
  const [open, setOpen] = useState(false);

  // Close modal on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Fixed button top-right */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Login"
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          width: 46,
          height: 46,
          borderRadius: "50%",
          border: "none",
          background: ORANGE,
          color: "#fff",
          display: "grid",
          placeItems: "center",
          zIndex: 1000,
          boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
          cursor: "pointer"
        }}
      >
        {/* White silhouette icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
          />
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 1100,
            display: "grid",
            placeItems: "center",
            padding: "1rem"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(420px, 92vw)",
              background: "#fff",
              borderRadius: 16,
              padding: "1.5rem",
              boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
              fontFamily: "Montserrat, system-ui",
              textAlign: "center"
            }}
          >
            <h2 style={{ color: ORANGE, marginBottom: "0.75rem" }}>
              Sign In
            </h2>

            <p style={{ color: "#555", fontSize: "0.95rem" }}>
              Sign-in is currently unavailable.
            </p>

            <p style={{ color: "#777", fontSize: "0.85rem", marginTop: "0.5rem" }}>
              We’re working on secure login for bowlers, alleys, and staff.
            </p>

            <button
              onClick={() => setOpen(false)}
              style={{
                marginTop: "1.25rem",
                padding: ".75rem 1.5rem",
                borderRadius: 12,
                border: "none",
                background: ORANGE,
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}