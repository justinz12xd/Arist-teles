"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { REDUCED_MOTION_QUERY } from "@/lib/motion";

export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    if (media.matches || root.dataset.smoothScroll === "true") return;

    root.dataset.smoothScroll = "true";

    const lenis = new Lenis({ lerp: 0.1 });
    let raf: number;
    let disposed = false;
    let lenisActive = true;

    const stop = () => {
      disposed = true;
      cancelAnimationFrame(raf);
      if (lenisActive) {
        lenis.destroy();
        lenisActive = false;
      }
      if (root.dataset.smoothScroll === "true") {
        delete root.dataset.smoothScroll;
      }
    };

    const loop = (time: number) => {
      if (disposed) return;
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };

    const handleMotionPreferenceChange = (event: MediaQueryListEvent) => {
      if (!event.matches) return;
      stop();
    };

    media.addEventListener("change", handleMotionPreferenceChange);
    raf = requestAnimationFrame(loop);

    return () => {
      media.removeEventListener("change", handleMotionPreferenceChange);
      stop();
    };
  }, []);

  return <>{children}</>;
}
