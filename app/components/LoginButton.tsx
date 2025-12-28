"use client";

import { useState } from "react";

export default function LoginButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Login Button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Login"
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "#E76F2E", // brand orange
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        {/* Person Icon */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.314 0-10 1.657-10 5v3h20v-3c0-3.343-6.686-5-10-5z" />
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#FFF7ED", // cream background
              padding: "2rem",
              borderRadius: "12px",
              maxWidth: "320px",
              width: "90%",
              textAlign: "center",
              fontFamily: "Montserrat, system-ui, sans-serif",
            }}
          >
            <h2 style={{ marginBottom: "1rem", color: "#E76F2E" }}>
              Sign-In
            </h2>

            <p style={{ marginBottom: "1.5rem" }}>
              Sign-In Currently Unavailable
            </p>

            <button
              onClick={() => setOpen(false)}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "6px",
                border: "none",
                background: "#E76F2E",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
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