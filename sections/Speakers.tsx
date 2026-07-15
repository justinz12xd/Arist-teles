import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const CONTROLS = [
  { initials: "JWT", name: "Auth scope", role: "Bearer token · owner_id" },
  { initials: "VAL", name: "Contratos", role: "Pydantic · schemas · pesos" },
  { initials: "RAG", name: "Evidencia", role: "chunks · pgvector · citas" },
  { initials: "RUN", name: "Ejecucion", role: "BackgroundTasks · estados" },
];

export function Speakers() {
  return (
    <section id="speakers" className="relative mx-auto max-w-6xl scroll-mt-[var(--header-h)] px-6 py-32">
      <ScrollReveal>
        <SectionLabel>[ 05 · controles ]</SectionLabel>
        <h2 className="text-h2 max-w-2xl">La cabina no confia en documentos a ciegas.</h2>
      </ScrollReveal>

      <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
        {CONTROLS.map((control, i) => (
          <ScrollReveal key={control.name} delay={i * 0.08}>
            <div className={`glass h-full p-6 text-center ${i % 2 === 0 ? "float-y" : "float-x"}`}>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[var(--primary-12)] bg-[var(--primary-4)] text-lg font-medium text-white shadow-[0_0_24px_rgb(34_211_238/0.2)]">
                {control.initials}
              </div>
              <h3 className="mt-4 font-medium text-white">{control.name}</h3>
              <p className="section-label mt-2 leading-5">{control.role}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
