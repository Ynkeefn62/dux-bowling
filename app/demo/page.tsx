"use client";

import Link from "next/link";

const mascotImage = "/1@300x.png";

export default function DemoPage() {
  return (
    <main className="demo-root">
      <div className="scanlines" aria-hidden="true" />
      <section className="hud">
        <p>DUX BOWLING // DEMO MODE</p>
        <p>PLAYER 1: MASCOT</p>
        <p>FRAME 10</p>
      </section>

      <section className="game-area" aria-label="Animated bowling lane demo">
        <div className="lane-glow" aria-hidden="true" />

        <div className="mascot-runner" aria-hidden="true">
          <img src={mascotImage} alt="Dux mascot bowling" className="mascot" />
        </div>

        <div className="bowling-ball" aria-hidden="true" />

        <div className="pins" aria-hidden="true">
          <span className="pin pin-1" />
          <span className="pin pin-2" />
          <span className="pin pin-3" />
          <span className="pin pin-4" />
          <span className="pin pin-5" />
        </div>

        <div className="impact" aria-hidden="true" />
        <h1 className="title">STRIKE!</h1>
      </section>

      <div className="controls">
        <p>A retro-style preview of the mascot animation experience.</p>
        <Link href="/" className="btn">
          Back to home
        </Link>
      </div>

      <style jsx>{`
        .demo-root {
          min-height: 100vh;
          background: radial-gradient(circle at 30% 20%, #232357 0%, #0a0920 44%, #05040f 100%);
          color: #f7f4d5;
          font-family: "Press Start 2P", "Montserrat", monospace;
          display: grid;
          grid-template-rows: auto 1fr auto;
          gap: 1.5rem;
          padding: clamp(1rem, 2vw, 2rem);
          overflow: hidden;
          position: relative;
        }

        .scanlines {
          position: fixed;
          inset: 0;
          pointer-events: none;
          background: repeating-linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.03) 0px,
            rgba(255, 255, 255, 0.03) 2px,
            transparent 2px,
            transparent 6px
          );
          mix-blend-mode: soft-light;
          z-index: 1;
        }

        .hud {
          border: 3px solid #5de2ff;
          background: rgba(8, 14, 47, 0.85);
          box-shadow: 0 0 24px rgba(93, 226, 255, 0.35);
          padding: 1rem;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 0.75rem;
          font-size: 0.78rem;
          letter-spacing: 0.06em;
          position: relative;
          z-index: 2;
        }

        .hud p {
          margin: 0;
          text-shadow: 0 0 10px rgba(255, 245, 149, 0.5);
        }

        .game-area {
          position: relative;
          border-radius: 20px;
          border: 4px solid #ffc94d;
          background:
            linear-gradient(180deg, rgba(255, 202, 97, 0.16) 0%, rgba(255, 202, 97, 0) 25%),
            linear-gradient(90deg, #5f3819 0%, #8f5724 12%, #b87333 50%, #8f5724 88%, #5f3819 100%);
          box-shadow:
            0 0 36px rgba(255, 201, 77, 0.45),
            inset 0 -24px 32px rgba(0, 0, 0, 0.34);
          overflow: hidden;
          min-height: clamp(340px, 52vh, 560px);
          isolation: isolate;
          z-index: 2;
        }

        .lane-glow {
          position: absolute;
          inset: 0;
          background:
            repeating-linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.06) 0,
              rgba(255, 255, 255, 0.06) 14%,
              transparent 14%,
              transparent 20%
            );
          opacity: 0.45;
        }

        .mascot-runner {
          position: absolute;
          width: clamp(130px, 22vw, 270px);
          left: -20%;
          bottom: 8%;
          animation: mascotRun 4.8s linear infinite;
          transform-origin: bottom center;
          z-index: 4;
        }

        .mascot {
          width: 100%;
          height: auto;
          display: block;
          filter: drop-shadow(0 16px 18px rgba(0, 0, 0, 0.4));
          animation: mascotBounce 0.4s ease-in-out infinite alternate;
        }

        .bowling-ball {
          --size: clamp(22px, 2.8vw, 44px);
          width: var(--size);
          height: var(--size);
          border-radius: 50%;
          position: absolute;
          left: 18%;
          bottom: 12%;
          background: radial-gradient(circle at 35% 30%, #ffffff, #ff5ca8 35%, #851c63 80%);
          box-shadow:
            0 0 14px rgba(255, 92, 168, 0.6),
            inset -5px -4px 8px rgba(0, 0, 0, 0.4);
          animation: ballRoll 4.8s linear infinite;
          z-index: 5;
        }

        .pins {
          position: absolute;
          right: 12%;
          bottom: 10%;
          width: 90px;
          height: 80px;
          z-index: 4;
        }

        .pin {
          position: absolute;
          width: 14px;
          height: 36px;
          border-radius: 8px;
          background: linear-gradient(180deg, #fff 0%, #e6e6e6 65%, #c8c8c8 100%);
          border-top: 6px solid #ff584d;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25);
          transform-origin: bottom center;
          animation: pinFall 4.8s ease-in-out infinite;
        }

        .pin-1 {
          left: 38px;
          bottom: 30px;
        }

        .pin-2 {
          left: 20px;
          bottom: 18px;
          animation-delay: 0.04s;
        }

        .pin-3 {
          left: 56px;
          bottom: 18px;
          animation-delay: 0.08s;
        }

        .pin-4 {
          left: 2px;
          bottom: 4px;
          animation-delay: 0.12s;
        }

        .pin-5 {
          left: 74px;
          bottom: 4px;
          animation-delay: 0.16s;
        }

        .impact {
          position: absolute;
          right: 10%;
          bottom: 14%;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffee88;
          opacity: 0;
          box-shadow: 0 0 28px 16px rgba(255, 238, 136, 0.8);
          animation: burst 4.8s ease-in-out infinite;
          z-index: 3;
        }

        .title {
          position: absolute;
          inset: auto 0 12% 0;
          text-align: center;
          margin: 0;
          font-size: clamp(2rem, 8vw, 5rem);
          letter-spacing: 0.12em;
          color: #fffb8a;
          text-shadow:
            0 0 8px #ffe754,
            0 0 28px rgba(255, 231, 84, 0.8),
            0 0 44px rgba(255, 108, 79, 0.65);
          transform: scale(0.8);
          opacity: 0;
          animation: strikeFlash 4.8s steps(1, end) infinite;
          z-index: 6;
        }

        .controls {
          text-align: center;
          z-index: 2;
          font-size: 0.74rem;
        }

        .btn {
          display: inline-block;
          margin-top: 0.9rem;
          padding: 0.7rem 1.1rem;
          border: 2px solid #70f0ff;
          color: #70f0ff;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          background: rgba(7, 16, 52, 0.7);
          box-shadow: 0 0 14px rgba(112, 240, 255, 0.4);
        }

        .btn:hover {
          background: #70f0ff;
          color: #0d1335;
        }

        @keyframes mascotRun {
          0%,
          12% {
            left: -20%;
          }
          38% {
            left: 15%;
          }
          55% {
            left: 20%;
          }
          100% {
            left: -20%;
          }
        }

        @keyframes mascotBounce {
          from {
            transform: translateY(0px) rotate(-2deg);
          }
          to {
            transform: translateY(-8px) rotate(2deg);
          }
        }

        @keyframes ballRoll {
          0%,
          22% {
            left: 22%;
            bottom: 12%;
            transform: scale(1) rotate(0deg);
            opacity: 0;
          }
          28% {
            opacity: 1;
          }
          60% {
            left: 72%;
            bottom: 10%;
            transform: scale(0.72) rotate(720deg);
            opacity: 1;
          }
          64%,
          100% {
            left: 72%;
            bottom: 10%;
            transform: scale(0.65) rotate(760deg);
            opacity: 0;
          }
        }

        @keyframes pinFall {
          0%,
          62% {
            transform: rotate(0deg) translateY(0);
            opacity: 1;
          }
          74% {
            transform: rotate(50deg) translateY(14px);
            opacity: 0.85;
          }
          82%,
          100% {
            transform: rotate(68deg) translateY(22px);
            opacity: 0;
          }
        }

        @keyframes burst {
          0%,
          60% {
            transform: scale(0.4);
            opacity: 0;
          }
          64% {
            transform: scale(1.6);
            opacity: 1;
          }
          75%,
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }

        @keyframes strikeFlash {
          0%,
          64% {
            opacity: 0;
            transform: scale(0.8);
          }
          65%,
          78% {
            opacity: 1;
            transform: scale(1);
          }
          79%,
          100% {
            opacity: 0;
            transform: scale(1.15);
          }
        }

        @media (max-width: 720px) {
          .hud {
            font-size: 0.62rem;
          }

          .pins {
            right: 7%;
          }

          .title {
            bottom: 16%;
          }
        }
      `}</style>
    </main>
  );
}
