"use client";
import { useEffect, useState } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";

export interface Device {
  type:      DeviceType;
  isMobile:  boolean;
  isTablet:  boolean;
  isDesktop: boolean;
  width:     number;
}

// Breakpoints: mobile < 641, tablet 641-1024, desktop > 1024
function classify(w: number): Device {
  const isMobile  = w < 641;
  const isTablet  = !isMobile && w < 1025;
  const isDesktop = !isMobile && !isTablet;
  return {
    type: isMobile ? "mobile" : isTablet ? "tablet" : "desktop",
    isMobile,
    isTablet,
    isDesktop,
    width: w,
  };
}

export function useDevice(): Device {
  // SSR-safe: default to desktop dimensions on server
  const [device, setDevice] = useState<Device>(() =>
    classify(typeof window !== "undefined" ? window.innerWidth : 1280)
  );

  useEffect(() => {
    const update = () => setDevice(classify(window.innerWidth));
    update(); // sync immediately on client mount
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  return device;
}
