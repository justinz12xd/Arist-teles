"use client";

import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { viewportOnce } from "@/lib/motion";

const TERMINAL_LINES = [
  "> papiros listos: 3",
  "> dictamen: Proveedor B",
  "> riesgos pendientes: soporte postventa, penalidad por retraso",
  "> recomendación lista para revisar",
];

export function CTA() {
  return (
    <section id="cta" className="relative scroll-mt-[var(--header-h)] px-6 py-32">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 60%, rgb(34 211 238 / 0.08), transparent 70%), radial-gradient(40% 40% at 30% 40%, rgb(139 92 246 / 0.07), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <ScrollReveal>
          <h2 className="text-h1">Que el oráculo cite sus fuentes.</h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--primary-60)]">
            Una experiencia inspirada en el Liceo: deliberación, evidencia y una recomendación que se puede defender.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div className="crt hellenic-frame mx-auto mt-10 max-w-xl p-6 pt-8 text-left text-xs leading-relaxed">
            <div className="crt-content">
              {TERMINAL_LINES.map((line, i) => (
                <motion.p
                  key={line}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={viewportOnce}
                  transition={{ delay: 0.4 + i * 0.3, duration: 0.05 }}
                >
                  {line}
                </motion.p>
              ))}
              <motion.p
                className="crt-cursor mt-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={viewportOnce}
                transition={{ delay: 1.8 }}
              >
                {"> "}
              </motion.p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <a
            href="/chat"
            className="mt-10 inline-block rounded-full bg-[var(--accent-marble)] px-10 py-4 text-base font-medium text-black transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_60px_rgb(216_177_95/0.45)]"
            style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
          >
            Consultar el oráculo
          </a>
        </ScrollReveal>
      </div>
    </section>
  );
}
