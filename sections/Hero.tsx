"use client";

import { motion } from "framer-motion";
import { Rocket, Radio } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DotClock } from "@/components/ui/DotClock";
import { EASE_OUT_QUINT } from "@/lib/motion";

const TAGLINE_WORDS = ["72", "horas", "para", "llevar", "una", "idea", "de", "cero", "a", "órbita."];

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col justify-between px-6 pb-16 pt-[calc(var(--header-h)+3rem)]">
      {/* viñeta radial para enfocar el centro */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(52% 50% at 50% 45%, transparent 0%, transparent 55%, rgb(5 5 5 / 0.55) 100%)",
        }}
      />

      {/* título — arriba, centrado */}
      <div className="relative text-center">
        <motion.h1
          className="text-h2"
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.2, duration: 1, ease: EASE_OUT_QUINT }}
        >
          Hackathon Estación Órbita
        </motion.h1>
        <motion.p
          className="section-label mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
        >
          12.10.2026 — señal abierta — cuenta regresiva activa
        </motion.p>
      </div>

      {/* reloj de matriz de puntos — el protagonista */}
      <div className="relative flex justify-center">
        <DotClock target="2026-10-12T18:00:00-03:00" />
      </div>

      {/* pie del hero: tagline izquierda, botones derecha */}
      <div className="relative flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <h2 className="max-w-xl text-[clamp(1.75rem,3.5vw,3rem)] font-medium leading-[1.1] tracking-[-0.03em] text-white">
          {TAGLINE_WORDS.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block whitespace-pre"
              initial={{ opacity: 0, y: 6, color: "#22d3ee" }}
              animate={{ opacity: 1, y: 0, color: "#ffffff" }}
              transition={{
                delay: 0.8 + i * 0.08,
                duration: 0.9,
                ease: EASE_OUT_QUINT,
                color: { delay: 0.8 + i * 0.08 + 0.3, duration: 0.6 },
              }}
            >
              {word}{" "}
            </motion.span>
          ))}
        </h2>

        <motion.div
          className="flex flex-wrap items-center gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.9, ease: EASE_OUT_QUINT }}
        >
          <Button href="#cta">
            <Rocket size={16} /> Reservar asiento
          </Button>
          <Button href="#about" variant="secondary">
            <Radio size={16} /> Escuchar la misión
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
