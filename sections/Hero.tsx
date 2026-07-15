"use client";

import { motion } from "framer-motion";
import { FileSearch, PlayCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EASE_OUT_QUINT } from "@/lib/motion";

const TAGLINE_WORDS = ["Compará", "proveedores", "con", "criterios", "claros", "y", "evidencia", "verificable."];
const STATUS = [
  { label: "documentos", value: "03" },
  { label: "criterios", value: "05" },
  { label: "citas", value: "18" },
  { label: "confianza", value: "0.84" },
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
          sistema multiagente · recomendación no vinculante · traza auditable
        </motion.p>
        <motion.h1
          className="mx-auto mt-4 max-w-5xl text-[clamp(3.2rem,9vw,8.5rem)] font-medium leading-[0.9] tracking-[-0.07em] text-white"
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.25, duration: 1, ease: EASE_OUT_QUINT }}
        >
          Aristóteles
        </motion.h1>
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg text-[var(--primary-60)]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8, ease: EASE_OUT_QUINT }}
        >
          Transformá cotizaciones, contratos y garantías en una comparación estructurada,
          una recomendación explicable y un reporte con fuentes página por página.
        </motion.p>
      </div>

      <motion.div
        className="relative mx-auto w-full max-w-5xl"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.9, duration: 0.9, ease: EASE_OUT_QUINT }}
      >
        <div className="crt overflow-hidden rounded-2xl p-5 md:p-8">
          <div className="crt-content grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="section-label">expediente / compra-servidores-q4</p>
              <div className="mt-6 space-y-3 font-mono text-xs text-[var(--primary-80)]">
                <p>&gt; subiendo Proveedor_A.pdf ................. ok</p>
                <p>&gt; subiendo Proveedor_B.pdf ................. ok</p>
                <p>&gt; subiendo Garantia_C.webp ................. ok</p>
                <p>&gt; estado: awaiting_criteria</p>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {STATUS.map((item) => (
                  <div key={item.label} className="border border-[rgb(34_211_238/0.18)] bg-black/20 p-4">
                    <p className="text-2xl font-medium text-white">{item.value}</p>
                    <p className="mt-1 text-[0.62rem] uppercase tracking-[0.18em] text-[var(--accent-cyan)]">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass p-5">
              <div className="flex items-center gap-3 text-white">
                <ShieldCheck size={18} className="text-[var(--accent-cyan)]" />
                <p className="font-medium">Recomendación preliminar</p>
              </div>
              <p className="mt-5 text-4xl font-medium tracking-[-0.04em] text-white md:text-6xl">
                Proveedor B
              </p>
              <p className="mt-4 text-sm leading-6 text-[var(--primary-60)]">
                Mejor equilibrio entre precio, plazo y garantía. La confianza es alta porque
                los cinco criterios tienen cobertura y las afirmaciones críticas están citadas.
              </p>
              <div className="mt-6 space-y-3 text-xs">
                {[
                  ["Precio", "92%", "cotizacion-b.pdf · pág. 2"],
                  ["Entrega", "88%", "propuesta-b.pdf · pág. 4"],
                  ["Garantía", "81%", "garantia-b.pdf · pág. 1"],
                ].map(([criterion, score, source]) => (
                  <div key={criterion} className="grid grid-cols-[5rem_1fr] items-center gap-3">
                    <span className="text-white">{criterion}</span>
                    <div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-[var(--accent-cyan)]" style={{ width: score }} />
                      </div>
                      <p className="mt-1 font-mono text-[var(--primary-44)]">{source}</p>
                    </div>
                  </div>
                ))}
              </div>
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
              initial={{ opacity: 0, y: 6, color: "#22d3ee" }}
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
          <Button href="#cta">
            <PlayCircle size={16} /> Ejecutar demo
          </Button>
          <Button href="#timeline" variant="secondary">
            <FileSearch size={16} /> Ver flujo
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
