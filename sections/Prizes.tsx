import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const PRIZES = [
  { place: "Primer lugar", amount: "$12.000", extra: "más incubación de 3 meses en la estación" },
  { place: "Segundo lugar", amount: "$8.000", extra: "más créditos de cómputo para seguir en órbita" },
  { place: "Tercer lugar", amount: "$5.000", extra: "más mentoría técnica de la tripulación senior" },
];

export function Prizes() {
  return (
    <section id="prizes" className="relative mx-auto max-w-6xl scroll-mt-[var(--header-h)] px-6 py-32">
      <ScrollReveal>
        <SectionLabel>[ 04 · combustible ]</SectionLabel>
        <h2 className="text-h2 max-w-2xl">Premios que sostienen la órbita.</h2>
      </ScrollReveal>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {PRIZES.map((p, i) => (
          <ScrollReveal key={p.place} delay={i * 0.08}>
            <div className={`glass p-8 ${i === 0 ? "md:-translate-y-3 shadow-[0_0_40px_rgb(34_211_238/0.15)]" : ""}`}>
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
