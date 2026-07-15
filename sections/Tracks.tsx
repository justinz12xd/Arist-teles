"use client";

import { motion } from "framer-motion";
import { Brain, Satellite, HeartPulse, Gamepad2 } from "lucide-react";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const TRACKS = [
  { icon: Brain, name: "Agentes autónomos", desc: "Sistemas que deciden, planifican y ejecutan sin piloto humano.", glow: "rgb(34 211 238 / 0.25)" },
  { icon: Satellite, name: "Datos orbitales", desc: "Herramientas sobre datos satelitales, clima y observación terrestre.", glow: "rgb(59 130 246 / 0.25)" },
  { icon: HeartPulse, name: "IA con propósito", desc: "Salud, educación y accesibilidad. Impacto medible en 72 horas.", glow: "rgb(139 92 246 / 0.25)" },
  { icon: Gamepad2, name: "Mundos generativos", desc: "Experiencias, juegos y narrativas creadas en tiempo real.", glow: "rgb(34 211 238 / 0.25)" },
];

export function Tracks() {
  return (
    <section id="tracks" className="relative mx-auto max-w-6xl scroll-mt-[var(--header-h)] px-6 py-32">
      <ScrollReveal>
        <SectionLabel>[ 03 · rutas ]</SectionLabel>
        <h2 className="text-h2 max-w-2xl">Cuatro trayectorias. Elegí la tuya.</h2>
      </ScrollReveal>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TRACKS.map((t, i) => (
          <ScrollReveal key={t.name} delay={i * 0.08}>
            <motion.div
              className="glass h-full p-6"
              whileHover={{ y: -4, rotate: 0.5, boxShadow: `0 12px 40px ${t.glow}` }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <t.icon size={22} className="text-[var(--accent-cyan)]" />
              <h3 className="mt-4 text-lg font-medium text-white">{t.name}</h3>
              <p className="mt-2 text-sm text-[var(--primary-60)]">{t.desc}</p>
            </motion.div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
