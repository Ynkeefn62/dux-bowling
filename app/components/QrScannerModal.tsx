"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  title: string;
  hint: string;
  onScan: (text: string) => void;
  onClose: () => void;
};

export default function QrScannerModal({ title, hint, onScan, onClose }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef    = useRef<number>(0);
  const [error, setError]     = useState<string | null>(null);
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    let active = true;

    async function start() {
      // load jsQR once
      let jsQR: ((data: Uint8ClampedArray, width: number, height: number, opts?: object) => { data: string } | null) | null = null;
      try {
        const mod = await import("jsqr");
        jsQR = mod.default as typeof jsQR;
      } catch {
        setError("QR library failed to load.");
        return;
      }

      // request camera
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch (err: any) {
        if (!active) return;
        const msg = err?.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access and try again."
          : err?.message ?? "Could not access camera.";
        setError(msg);
        return;
      }

      if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;

      try { await video.play(); } catch { /* may be interrupted on unmount */ }

      function tick() {
        if (!active) return;
        const vid = videoRef.current;
        const cvs = canvasRef.current;
        if (!vid || !cvs || vid.readyState < 2) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        const ctx = cvs.getContext("2d");
        if (!ctx) return;
        cvs.width  = vid.videoWidth  || 640;
        cvs.height = vid.videoHeight || 480;
        ctx.drawImage(vid, 0, 0, cvs.width, cvs.height);

        const imageData = ctx.getImageData(0, 0, cvs.width, cvs.height);
        const code = jsQR!(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code?.data) {
          setDetected(true);
          onScan(code.data);
          return; // stop loop; cleanup handled below
        }
        rafRef.current = requestAnimationFrame(tick);
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();

    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [onScan]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.88)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "Montserrat, system-ui",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(420px, 96vw)",
          background: "#0e0e18",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "1rem 1.25rem .75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: "1rem", color: "#f2f2f2" }}>{title}</div>
            <div style={{ fontSize: ".72rem", color: "rgba(242,242,242,0.55)", marginTop: 2 }}>{hint}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%",
              width: 32, height: 32, cursor: "pointer", color: "#f2f2f2",
              fontSize: "1rem", display: "grid", placeItems: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Viewfinder */}
        <div style={{ position: "relative", background: "#000", aspectRatio: "4/3", overflow: "hidden" }}>
          {!error && (
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          )}
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* Corner guides */}
          {!error && !detected && (
            <>
              {[
                { top: "18%", left: "18%", borderTop: "3px solid #e46a2e", borderLeft: "3px solid #e46a2e" },
                { top: "18%", right: "18%", borderTop: "3px solid #e46a2e", borderRight: "3px solid #e46a2e" },
                { bottom: "18%", left: "18%", borderBottom: "3px solid #e46a2e", borderLeft: "3px solid #e46a2e" },
                { bottom: "18%", right: "18%", borderBottom: "3px solid #e46a2e", borderRight: "3px solid #e46a2e" },
              ].map((style, i) => (
                <div key={i} style={{ position: "absolute", width: 24, height: 24, ...style as React.CSSProperties }} />
              ))}
              {/* Scan line animation */}
              <div style={{
                position: "absolute", left: "18%", right: "18%", height: 2,
                background: "linear-gradient(90deg, transparent, #e46a2e, transparent)",
                animation: "scanline 2s linear infinite",
                top: "50%",
              }} />
              <style>{`
                @keyframes scanline {
                  0%   { transform: translateY(-80px); opacity: 0.8; }
                  50%  { opacity: 1; }
                  100% { transform: translateY(80px); opacity: 0.8; }
                }
              `}</style>
            </>
          )}

          {/* Success overlay */}
          {detected && (
            <div style={{
              position: "absolute", inset: 0, display: "grid", placeItems: "center",
              background: "rgba(74,222,128,0.25)",
            }}>
              <div style={{ fontSize: "3rem" }}>✅</div>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div style={{
              minHeight: 200, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: ".75rem", padding: "1.5rem", textAlign: "center",
            }}>
              <div style={{ fontSize: "2rem" }}>📷</div>
              <div style={{ color: "#f87171", fontSize: ".82rem", fontWeight: 700 }}>{error}</div>
              <div style={{ color: "rgba(242,242,242,0.5)", fontSize: ".72rem", lineHeight: 1.5 }}>
                On iOS: go to <strong>Settings › Safari › Camera</strong> and allow access.<br />
                On Android: tap the lock icon in your browser address bar.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: ".75rem 1.25rem 1rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: ".72rem", color: "rgba(242,242,242,0.45)", lineHeight: 1.5 }}>
            Point your camera at the QR code. Detection is automatic.
          </p>
          <button
            onClick={onClose}
            style={{
              marginTop: ".75rem", padding: ".55rem 1.4rem",
              borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent", color: "rgba(242,242,242,0.7)",
              fontSize: ".82rem", cursor: "pointer",
              fontFamily: "Montserrat, system-ui",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
