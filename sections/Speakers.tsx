import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const CREW = [
  { initials: "PL", name: "Planner Agent", role: "propone criterios, pesos y plan validable" },
  { initials: "DC", name: "Document Agent", role: "OCR, chunks, embeddings y recuperación" },
  { initials: "RS", name: "Research Agent", role: "extrae hechos, costos, fechas y garantías" },
  { initials: "CP", name: "Comparison Agent", role: "matrices, inconsistencias y datos faltantes" },
  { initials: "DS", name: "Decision Agent", role: "prioriza, justifica, recomienda o se abstiene" },
  { initials: "RG", name: "Report Generator", role: "renderiza web y PDF sin alterar la decisión" },
];

export function Speakers() {
  return (
    <section id="speakers" className="relative mx-auto max-w-6xl scroll-mt-[var(--header-h)] px-6 py-32">
      <ScrollReveal>
        <SectionLabel>[ 05 · agentes ]</SectionLabel>
        <h2 className="text-h2 max-w-3xl">Cada agente tiene una responsabilidad limitada para que la salida sea verificable.</h2>
      </ScrollReveal>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CREW.map((c, i) => (
          <ScrollReveal key={c.name} delay={i * 0.08}>
            <div className={`glass h-full p-6 text-center ${i % 2 === 0 ? "float-y" : "float-x"}`}>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[var(--primary-12)] bg-[var(--primary-4)] text-lg font-medium text-white shadow-[0_0_24px_rgb(34_211_238/0.2)]">
                {c.initials}
              </div>
              <h3 className="mt-4 font-medium text-white">{c.name}</h3>
              <p className="section-label mt-2 leading-5">{c.role}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
