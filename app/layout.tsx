import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

import HamburgerMenu from "./components/HamburgerMenu";
import LoginButton from "./components/LoginButton";
import Footer from "./components/Footer";
import CookieBanner from "./components/CookieBanner";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Dux Bowling",
  description: "Saving Duckpin Bowling"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={montserrat.className} style={{ margin: 0 }}>
        {/* Fixed top banner background */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 72,
            background: "#000",
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {/* Centered logo */}
          <img
            src="/dux-bowling-wordmark.png" // <-- update path if needed
            alt="Dux Bowling"
            style={{
              height: 42,
              width: "auto",
              pointerEvents: "none",
              userSelect: "none"
            }}
          />
        </div>

        {/* Existing fixed buttons */}
        <HamburgerMenu />
        <LoginButton />

        {/* Page content offset below banner */}
        <div style={{ paddingTop: 72 }}>
          {children}
          <Footer />
        </div>

        <CookieBanner />
      </body>
    </html>
  );
}