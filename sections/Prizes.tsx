import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const TRUST = [
  { label: "Cobertura", amount: "40%", text: "criterios confirmados con datos suficientes para comparar." },
  { label: "Citas", amount: "30%", text: "afirmaciones criticas respaldadas por documento, pagina y fragmento." },
  { label: "Consistencia", amount: "20%", text: "fuentes alineadas y contradicciones que afectan la salida." },
  { label: "Extraccion", amount: "10%", text: "calidad de parsing, OCR y fallback visual cuando el texto no alcanza." },
];

export function Prizes() {
  return (
    <section id="prizes" className="relative mx-auto max-w-6xl scroll-mt-[var(--header-h)] px-6 py-32">
      <ScrollReveal>
        <SectionLabel>[ 04 · confianza ]</SectionLabel>
        <h2 className="text-h2 max-w-3xl">
          La confianza no se improvisa: se calcula con una rubrica visible.
        </h2>
      </ScrollReveal>

      <div className="mt-16 grid gap-6 md:grid-cols-4">
        {TRUST.map((item, i) => (
          <ScrollReveal key={item.label} delay={i * 0.08}>
            <div className={`glass h-full p-8 ${i === 0 ? "md:-translate-y-3 shadow-[0_0_40px_rgb(34_211_238/0.15)]" : ""}`}>
              <p className="section-label">{item.label}</p>
              <p className="mt-3 text-4xl font-medium text-white">{item.amount}</p>
              <p className="mt-3 text-sm text-[var(--primary-60)]">{item.text}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
