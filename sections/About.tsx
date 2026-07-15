import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const STATS = [
  { value: "72h", label: "de misión continua" },
  { value: "300", label: "asientos en cabina" },
  { value: "4", label: "rutas de exploración" },
  { value: "$25k", label: "en combustible (premios)" },
];

export function About() {
  return (
    <section id="about" className="relative mx-auto max-w-6xl scroll-mt-[var(--header-h)] px-6 py-32">
      <ScrollReveal>
        <SectionLabel>[ 01 · misión ]</SectionLabel>
        <h2 className="text-h2 max-w-2xl">
          Tres días fuera de la atmósfera de lo predecible.
        </h2>
        <p className="mt-6 max-w-xl text-[var(--primary-60)]">
          Durante un fin de semana, la estación abre sus compuertas a equipos que
          quieran construir con IA sin red de seguridad. Mentores en órbita,
          hardware a bordo y una regla: lo que se lanza, se lanza funcionando.
        </p>
      </ScrollReveal>

      <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
        {STATS.map((s, i) => (
          <ScrollReveal key={s.label} delay={i * 0.08}>
            <div className="glass p-6">
              <p className="text-3xl font-medium text-white">{s.value}</p>
              <p className="mt-1 text-sm text-[var(--primary-44)]">{s.label}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
