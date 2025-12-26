"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600", "700"]
});

export default function Home() {
  useEffect(() => {
    const elements = document.querySelectorAll(".step");

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target); // observe once only
          }
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const steps = [
    "Register the business as an LLC with the State of Maryland.",
    "File provisional patent approval for a new duckpin pinsetter design.",
    "Complete the website MVP, including a bowling simulator where users can create accounts, manually enter scores, track statistics, and follow friends.",
    "Engage with bowlers, bowling alleys, and the National Duckpin Congress to gauge interest in a new pinsetter and modern scoring platform.",
    "Finalize business plans and product offerings.",
    "Work with TEDCO for guidance on prototyping, execution strategy, and funding opportunities.",
    "Develop and test prototypes, including full integration into the scoring database.",
    "Deploy initial systems into select bowling alleys for real-world testing.",
    "Expand adoption across existing duckpin bowling alleys with the goal of retiring all Sherman Pinsetters.",
    "Scale operations into new geographic regions."
  ];

  return (
    <main className={`${montserrat.className} page`}>
      {/* Mission */}
      <section className="mission">
        <Image
          src="/public/logo_test.png"
          alt="Dux Bowling Logo"
          width={420}
          height={240}
          priority
          style={{
            maxWidth: "100%",
            height: "auto",
            margin: "0 auto 1.5rem",
            display: "block"
          }}
        />

        <p className="missionText">
          <strong>Why we’re doing this:</strong> Duckpin bowling is a historic,
          uniquely regional sport that is slowly disappearing due to aging
          equipment and lack of modernization. Our mission is to preserve,
          modernize, and grow duckpin bowling for future generations.
        </p>
      </section>

      {/* Roadmap */}
      <section className="roadmap">
        <h2>Our 10-Step Plan</h2>

        {steps.map((text, i) => (
          <div key={i} className="step">
            <span className="stepNumber">{i + 1}</span>
            <p>{text}</p>
          </div>
        ))}
      </section>

      {/* Styles */}
      <style jsx>{`
        :root {
          --cream: #faf4e6;
          --orange: #d9772b;
          --dark: #2b1d12;
        }

        .page {
          background: var(--cream);
          min-height: 100vh;
          padding-bottom: 4rem;
        }

        .mission {
          max-width: 900px;
          margin: 0 auto;
          padding: 4rem 1.5rem 2.5rem;
          text-align: center;
        }

        .missionText {
          font-size: 1.15rem;
          line-height: 1.75;
          color: var(--dark);
        }

        .roadmap {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }

        .roadmap h2 {
          color: var(--orange);
          font-size: 2rem;
          margin-bottom: 2rem;
          text-align: center;
          font-weight: 700;
        }

        .step {
          display: flex;
          gap: 1rem;
          background: white;
          border-radius: 14px;
          padding: 1.4rem 1.6rem;
          margin-bottom: 1.4rem;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.06);

          opacity: 0;
          transform: translateX(-60px);
          transition:
            transform 0.6s ease-out,
            opacity 0.6s ease-out;
        }

        .step.visible {
          opacity: 1;
          transform: translateX(0);
        }

        .stepNumber {
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--orange);
          min-width: 2.2rem;
        }

        .step p {
          margin: 0;
          line-height: 1.65;
          color: var(--dark);
          font-weight: 500;
        }

        @media (max-width: 600px) {
          .step {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}