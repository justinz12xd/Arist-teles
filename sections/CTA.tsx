"use client";

import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { viewportOnce } from "@/lib/motion";

const TERMINAL_LINES = [
  "> estación órbita · consola de embarque v2.6",
  "> verificando ventana de lanzamiento......... ok",
  "> asientos disponibles: 117 / 300",
  "> estado de la señal: ABIERTA",
];

export function CTA() {
  return (
    <section id="cta" className="relative scroll-mt-[var(--header-h)] px-6 py-40">
      {/* brillo final de escena */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 60%, rgb(34 211 238 / 0.08), transparent 70%), radial-gradient(40% 40% at 30% 40%, rgb(139 92 246 / 0.07), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <ScrollReveal>
          <h2 className="text-h1">La compuerta se cierra pronto.</h2>
          <p className="mx-auto mt-6 max-w-lg text-lg text-[var(--primary-60)]">
            Reservá tu asiento antes de que la ventana de lanzamiento se cierre.
            La próxima órbita pasa en un año.
          </p>
        </ScrollReveal>

        {/* Panel CRT — la firma de la página */}
        <ScrollReveal delay={0.15}>
          <div className="crt mx-auto mt-12 max-w-xl p-6 text-left text-xs leading-relaxed">
            <div className="crt-content">
              {TERMINAL_LINES.map((line, i) => (
                <motion.p
                  key={line}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={viewportOnce}
                  transition={{ delay: 0.4 + i * 0.35, duration: 0.05 }}
                >
                  {line}
                </motion.p>
              ))}
              <motion.p
                className="crt-cursor mt-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={viewportOnce}
                transition={{ delay: 2 }}
              >
                {"> "}
              </motion.p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <a
            href="#"
            className="mt-12 inline-block rounded-full bg-white px-12 py-5 text-lg font-medium text-black transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_60px_rgb(34_211_238/0.45)]"
            style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
          >
            Iniciar secuencia de embarque
          </a>
        </ScrollReveal>
      </div>
    </section>
  );
}
