import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const STATS = [
  { value: "5", label: "criterios confirmados por el usuario" },
  { value: "6", label: "agentes y herramientas coordinadas" },
  { value: "4", label: "dimensiones de confianza calculada" },
  { value: "100%", label: "afirmaciones conectadas a evidencia" },
];

export function About() {
  return (
    <section id="about" className="relative mx-auto max-w-6xl scroll-mt-[var(--header-h)] px-6 py-32">
      <ScrollReveal>
        <SectionLabel>[ 01 · misión ]</SectionLabel>
        <h2 className="text-h2 max-w-3xl">
          Reducir horas de revisión documental a una decisión defendible.
        </h2>
        <p className="mt-6 max-w-2xl text-[var(--primary-60)]">
          Aristóteles ayuda a responsables de compras, contratos y proyectos a comparar
          proveedores bajo los mismos criterios, localizar fuentes y entender riesgos antes
          de elegir. No decide por la persona: prepara evidencia auditable para que la
          decisión final siga siendo humana.
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
