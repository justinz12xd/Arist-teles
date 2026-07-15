"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeRise, fadeRiseReduced, viewportOnce } from "@/lib/motion";

export function ScrollReveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? fadeRiseReduced : fadeRise;

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={shouldReduceMotion ? { duration: 0 } : { delay: Math.max(0, delay) }}
    >
      {children}
    </motion.div>
  );
}
