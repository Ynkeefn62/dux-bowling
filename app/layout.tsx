import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

import TopBanner from "./components/TopBanner";
import HamburgerMenu from "./components/HamburgerMenu";
import LoginButton from "./components/LoginButton";
import Footer from "./components/Footer";
import CookieBanner from "./components/CookieBanner";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Dux Bowling",
  description: "Saving Duckpin Bowling"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        {/* Persistent top banner — height is responsive via CSS var --banner-h */}
        <TopBanner />

        {/* Fixed overlay buttons */}
        <HamburgerMenu />
        <LoginButton />

        {/* Page content — padding-top = var(--banner-h) via .dux-page-wrap */}
        <div className="dux-page-wrap">
          {children}
          <Footer />
        </div>

        <CookieBanner />
      </body>
    </html>
  );
}
