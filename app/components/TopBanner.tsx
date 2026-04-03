"use client";

import Link from "next/link";
import { useDevice } from "@/app/hooks/useDevice";

export default function TopBanner() {
  const { isMobile, isTablet } = useDevice();
  const bannerH = isMobile ? 56 : isTablet ? 64 : 72;
  const logoH   = isMobile ? 28 : isTablet ? 32 : 36;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: bannerH,
        background: "#000",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "height 0.2s ease",
      }}
    >
      <Link
        href="/"
        aria-label="Go to homepage"
        style={{
          maxWidth: "60%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src="/5@300x.png"
          alt="Dux Bowling"
          style={{
            height: logoH,
            width: "auto",
            maxWidth: "100%",
            objectFit: "contain",
            cursor: "pointer",
            transition: "height 0.2s ease",
          }}
        />
      </Link>
    </div>
  );
}
