"use client";

import { motion } from "framer-motion";
import { BriefcaseBusiness, FileSignature, GraduationCap, Landmark, ClipboardList, Building2 } from "lucide-react";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const TRACKS = [
  { icon: BriefcaseBusiness, name: "Proveedores", desc: "Cotizaciones, garantías, plazos de entrega, costos adicionales y restricciones.", glow: "rgb(34 211 238 / 0.25)" },
  { icon: FileSignature, name: "Contratos", desc: "Cláusulas, obligaciones, contradicciones y riesgos que necesitan revisión humana.", glow: "rgb(59 130 246 / 0.25)" },
  { icon: GraduationCap, name: "Investigación", desc: "Papers, anexos y evidencia académica organizados por criterios trazables.", glow: "rgb(139 92 246 / 0.25)" },
  { icon: Landmark, name: "Reglamentos", desc: "Políticas, bases de concurso o normativa interna convertidas en matriz de cumplimiento.", glow: "rgb(34 211 238 / 0.25)" },
  { icon: ClipboardList, name: "Proyectos", desc: "Propuestas comparadas por impacto, costo, factibilidad, riesgos y dependencias.", glow: "rgb(59 130 246 / 0.25)" },
  { icon: Building2, name: "Empresa", desc: "Documentación operativa dispersa que necesita una recomendación defendible.", glow: "rgb(139 92 246 / 0.25)" },
];

export function Tracks() {
  return (
    <section id="tracks" className="relative mx-auto max-w-6xl scroll-mt-[var(--header-h)] px-6 py-32">
      <ScrollReveal>
        <SectionLabel>[ 03 · casos de uso ]</SectionLabel>
        <h2 className="text-h2 max-w-3xl">El MVP empieza con proveedores, pero la lógica escala a decisiones documentales.</h2>
      </ScrollReveal>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
