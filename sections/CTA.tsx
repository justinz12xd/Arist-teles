"use client";

import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { viewportOnce } from "@/lib/motion";

const TERMINAL_LINES = [
  "> aristoteles.run · expediente proveedor-q4",
  "> criterios confirmados: precio=.30 garantia=.20 entrega=.20 cumplimiento=.20 riesgos=.10",
  "> contradicción crítica: no encontrada",
  "> decisión: recommend(Proveedor B) · confidence=high · score=0.84",
];

export function CTA() {
  return (
    <section id="cta" className="relative scroll-mt-[var(--header-h)] px-6 py-40">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 60%, rgb(34 211 238 / 0.08), transparent 70%), radial-gradient(40% 40% at 30% 40%, rgb(139 92 246 / 0.07), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <ScrollReveal>
          <h2 className="text-h1">Subí tres propuestas. Defendé una decisión.</h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--primary-60)]">
            El MVP se enfoca en comparación de proveedores: documentos privados,
            criterios editables, progreso visible y reporte descargable con la misma
            decisión estructurada que viste en pantalla.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div className="crt mx-auto mt-12 max-w-2xl p-6 text-left text-xs leading-relaxed">
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
            Crear expediente de prueba
          </a>
        </ScrollReveal>
      </div>
    </section>
  );
}
