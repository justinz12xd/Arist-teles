import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const CARDS = [
  { title: "Papiro", text: "Extrae precios, plazos, garantías y condiciones escondidas entre documentos." },
  { title: "Balanza", text: "Pesa las opciones bajo los mismos criterios para que la decisión sea justa." },
  { title: "Ágora", text: "Entrega ventajas, riesgos y citas para defender la recomendación ante otros." },
];

export function About() {
  return (
    <section id="about" className="relative mx-auto max-w-6xl scroll-mt-[var(--header-h)] px-6 py-28">
      <ScrollReveal>
        <SectionLabel>[ 01 · qué hace ]</SectionLabel>
        <h2 className="text-h2 max-w-3xl">
          Un Liceo digital para decidir cuando la evidencia está dispersa.
        </h2>
        <p className="mt-6 max-w-2xl text-[var(--primary-60)]">
          La interfaz mezcla análisis moderno con símbolos clásicos: papiros, balanza y ágora.
          La idea es simple: ninguna recomendación sin razón, ninguna razón sin fuente.
        </p>
      </ScrollReveal>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {CARDS.map((card, i) => (
          <ScrollReveal key={card.title} delay={i * 0.08}>
            <div className="glass marble-surface h-full p-6">
              <p className="section-label">{card.title}</p>
              <p className="mt-4 text-sm leading-6 text-[var(--primary-60)]">{card.text}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
