import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const TRUST = [
  { place: "Cobertura", amount: "40%", extra: "qué tantos criterios confirmados tienen datos suficientes para comparar." },
  { place: "Citas", amount: "30%", extra: "qué afirmaciones críticas están respaldadas por documento, página y fragmento." },
  { place: "Consistencia", amount: "20%", extra: "qué tan alineadas están las fuentes y cómo pesan las contradicciones." },
  { place: "Extracción", amount: "10%", extra: "calidad de parsing, OCR y fallback visual cuando el texto no alcanza." },
];

export function Prizes() {
  return (
    <section id="prizes" className="relative mx-auto max-w-6xl scroll-mt-[var(--header-h)] px-6 py-32">
      <ScrollReveal>
        <SectionLabel>[ 04 · confianza ]</SectionLabel>
        <h2 className="text-h2 max-w-3xl">La confianza no se improvisa: se calcula con una rúbrica visible.</h2>
      </ScrollReveal>

      <div className="mt-16 grid gap-6 md:grid-cols-4">
        {TRUST.map((p, i) => (
          <ScrollReveal key={p.place} delay={i * 0.08}>
            <div className={`glass h-full p-8 ${i === 0 ? "md:-translate-y-3 shadow-[0_0_40px_rgb(34_211_238/0.15)]" : ""}`}>
              <p className="section-label">{p.place}</p>
              <p className="mt-3 text-4xl font-medium text-white">{p.amount}</p>
              <p className="mt-3 text-sm text-[var(--primary-60)]">{p.extra}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
