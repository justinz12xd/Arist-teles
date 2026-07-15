import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { FileUp, Search, Scale, Target } from "lucide-react";

const STAGES = [
  { icon: FileUp, title: "Entregá los papiros", desc: "Cotizaciones, contratos, garantías o imágenes escaneadas." },
  { icon: Search, title: "Buscá la prueba", desc: "El sistema ubica datos clave y los conecta con su fuente." },
  { icon: Scale, title: "Pesá alternativas", desc: "Todas las opciones pasan por la misma balanza de criterios." },
  { icon: Target, title: "Deliberá el dictamen", desc: "Ventajas, riesgos y una explicación lista para compartir." },
];

export function Timeline() {
  return (
    <section id="timeline" className="relative mx-auto max-w-6xl scroll-mt-[var(--header-h)] px-6 py-28">
      <ScrollReveal>
        <SectionLabel>[ 03 · método ]</SectionLabel>
        <h2 className="text-h2 max-w-3xl">Del papiro disperso al dictamen defendible.</h2>
      </ScrollReveal>

      <div className="mt-14 grid gap-6 md:grid-cols-4">
        {STAGES.map((s, i) => (
          <ScrollReveal key={s.title} delay={i * 0.06}>
            <div className="glass marble-surface h-full p-6">
              <p className="section-label">0{i + 1}</p>
              <s.icon size={20} className="mt-5 text-[var(--accent-cyan)]" />
              <h3 className="mt-4 text-lg font-medium text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--primary-60)]">{s.desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
