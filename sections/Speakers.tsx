import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const CREW = [
  { initials: "VA", name: "Vera Aldana", role: "Comandante · IA aplicada" },
  { initials: "TN", name: "Tomás Nakamura", role: "Ingeniería de agentes" },
  { initials: "LM", name: "Lucía Meyer", role: "Sistemas distribuidos" },
  { initials: "RC", name: "Rafael Costa", role: "Diseño de producto" },
];

export function Speakers() {
  return (
    <section id="speakers" className="relative mx-auto max-w-6xl scroll-mt-[var(--header-h)] px-6 py-32">
      <ScrollReveal>
        <SectionLabel>[ 05 · tripulación ]</SectionLabel>
        <h2 className="text-h2 max-w-2xl">Quiénes pilotean la misión.</h2>
      </ScrollReveal>

      <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
        {CREW.map((c, i) => (
          <ScrollReveal key={c.name} delay={i * 0.08}>
            <div className={`glass p-6 text-center ${i % 2 === 0 ? "float-y" : "float-x"}`}>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[var(--primary-12)] bg-[var(--primary-4)] text-lg font-medium text-white shadow-[0_0_24px_rgb(34_211_238/0.2)]">
                {c.initials}
              </div>
              <h3 className="mt-4 font-medium text-white">{c.name}</h3>
              <p className="section-label mt-2">{c.role}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
