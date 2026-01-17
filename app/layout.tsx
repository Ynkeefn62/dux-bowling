import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

import TopBanner from "./components/TopBanner";
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
        {/* Persistent top banner (menu + logo + login) */}
        <TopBanner />

        {/* Push page content below fixed banner */}
        <div style={{ paddingTop: 72 }}>
          {children}
          <Footer />
        </div>

        {/* Global cookie banner */}
        <CookieBanner />
      </body>
    </html>
  );
}