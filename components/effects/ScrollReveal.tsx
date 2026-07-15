"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeRise, viewportOnce } from "@/lib/motion";

export function ScrollReveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      variants={fadeRise}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
