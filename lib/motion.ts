import type { Variants } from "framer-motion";

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;
export const EASE_SOFT = [0.17, 0.17, 0.3, 1] as const;

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: EASE_OUT_EXPO },
  },
};

export const fadeRiseReduced: Variants = {
  hidden: { opacity: 1, y: 0, filter: "none" },
  visible: { opacity: 1, y: 0, filter: "none", transition: { duration: 0 } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export const staggerContainerReduced: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0 } },
};

export const viewportOnce = { once: true, margin: "-15%" } as const;
