import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import HamburgerMenu from "./components/HamburgerMenu";
import LoginButton from "./components/LoginButton";

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
      <body className={montserrat.className}>
        <HamburgerMenu />
        <LoginButton />
        {children}
      </body>
    </html>
  );
}