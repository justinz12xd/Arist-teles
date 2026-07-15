import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const STATS = [
  { value: "5", label: "criterios confirmados" },
  { value: "6", label: "agentes y herramientas" },
  { value: "4", label: "dimensiones de confianza" },
  { value: "0", label: "hechos sin evidencia" },
];

export function About() {
  return (
    <section id="about" className="relative mx-auto max-w-6xl scroll-mt-[var(--header-h)] px-6 py-32">
      <ScrollReveal>
        <SectionLabel>[ 01 · mision ]</SectionLabel>
        <h2 className="text-h2 max-w-3xl">
          Reducir horas de revision documental a una decision defendible.
        </h2>
        <p className="mt-6 max-w-2xl text-[var(--primary-60)]">
          Aristoteles ayuda a responsables de compras, contratos y proyectos a comparar
          proveedores bajo los mismos criterios, localizar fuentes y entender riesgos antes
          de elegir. No decide por la persona: prepara evidencia auditable para que la
          decision final siga siendo humana.
        </p>
      </ScrollReveal>

      <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
        {STATS.map((stat, i) => (
          <ScrollReveal key={stat.label} delay={i * 0.08}>
            <div className="glass p-6">
              <p className="text-3xl font-medium text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-[var(--primary-44)]">{stat.label}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
