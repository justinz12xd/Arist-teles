"use client";

import { motion } from "framer-motion";
import { FileSearch, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EASE_OUT_QUINT } from "@/lib/motion";

const TAGLINE_WORDS = ["Leé", "menos.", "Decidí", "con", "más", "evidencia."];
const STATUS = [
  { label: "docs", value: "03" },
  { label: "riesgos", value: "02" },
  { label: "citas", value: "18" },
];

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col justify-between px-6 pb-16 pt-[calc(var(--header-h)+3rem)]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(52% 50% at 50% 45%, transparent 0%, transparent 55%, rgb(5 5 5 / 0.55) 100%)",
        }}
      />

      <div className="relative text-center">
        <motion.p
          className="section-label"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          oráculo de evidencia · liceo digital
        </motion.p>
        <motion.h1
          className="hellenic-title mx-auto mt-4 max-w-5xl text-[clamp(3.2rem,9vw,8.5rem)] font-medium leading-[0.9] tracking-[-0.07em] text-white"
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.25, duration: 1, ease: EASE_OUT_QUINT }}
        >
          Aristóteles
        </motion.h1>
        <motion.div
          className="hellenic-rule mx-auto mt-5 max-w-xl"
          initial={{ opacity: 0, scaleX: 0.7 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.55, duration: 0.8, ease: EASE_OUT_QUINT }}
        />
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg text-[var(--primary-60)]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8, ease: EASE_OUT_QUINT }}
        >
          Como un consejero en el Liceo, lee tus contratos y cotizaciones, separa
          señales de ruido y entrega una recomendación con citas, riesgos y criterio.
        </motion.p>
      </div>

      <motion.div
        className="relative mx-auto w-full max-w-4xl"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.9, duration: 0.9, ease: EASE_OUT_QUINT }}
      >
        <div className="crt hellenic-frame overflow-hidden rounded-2xl p-5 pt-8 md:p-7 md:pt-10">
          <div className="crt-content grid gap-5 md:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="section-label">ágora / proveedores</p>
              <div className="mt-5 space-y-2 font-mono text-xs text-[var(--primary-80)]">
                <p>&gt; descifrando papiros ....... ok</p>
                <p>&gt; pesando garantías ......... ok</p>
                <p>&gt; invocando riesgos ......... 2 hallazgos</p>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {STATUS.map((item) => (
                  <div key={item.label} className="border border-[rgb(34_211_238/0.18)] bg-black/20 p-3">
                    <p className="text-xl font-medium text-white">{item.value}</p>
                    <p className="mt-1 text-[0.58rem] uppercase tracking-[0.18em] text-[var(--accent-cyan)]">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass marble-surface p-5">
              <div className="flex items-center gap-3 text-white">
                <ShieldCheck size={18} className="text-[var(--accent-cyan)]" />
                <p className="font-medium">Dictamen del oráculo</p>
              </div>
              <p className="mt-5 text-4xl font-medium tracking-[-0.04em] text-white md:text-6xl">
                Proveedor B
              </p>
              <p className="mt-4 text-sm leading-6 text-[var(--primary-60)]">
                Menor costo total, entrega más rápida y garantía explícita. El dictamen
                no es fe: cada argumento apunta a su fragmento de evidencia.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="relative flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <h2 className="max-w-2xl text-[clamp(1.75rem,3.5vw,3rem)] font-medium leading-[1.1] tracking-[-0.03em] text-white">
          {TAGLINE_WORDS.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block whitespace-pre"
              initial={{ opacity: 0, y: 6, color: "#d8b15f" }}
              animate={{ opacity: 1, y: 0, color: "#ffffff" }}
              transition={{
                delay: 1.15 + i * 0.07,
                duration: 0.9,
                ease: EASE_OUT_QUINT,
                color: { delay: 1.15 + i * 0.07 + 0.3, duration: 0.6 },
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
          <Button href="/chat">
            <MessageCircle size={16} /> Ver chat
          </Button>
          <Button href="#timeline" variant="secondary">
            <FileSearch size={16} /> Cómo funciona
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
