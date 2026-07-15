import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const STACK = ["REACT", "FASTAPI", "OPENAI", "INSTRUCTFORGE", "VECTOR DB", "PRIVATE STORAGE"];

export function Partners() {
  return (
    <section id="partners" className="relative mx-auto max-w-6xl scroll-mt-[var(--header-h)] px-6 py-32">
      <ScrollReveal>
        <SectionLabel>[ 06 · arquitectura ]</SectionLabel>
        <h2 className="text-h2 max-w-3xl">Frontend de decisión, backend asíncrono y recuperación semántica aislada por usuario.</h2>
      </ScrollReveal>

      <div className="mt-16 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 md:grid-cols-6">
        {STACK.map((p, i) => (
          <ScrollReveal key={p} delay={i * 0.05}>
            <p className="text-center font-mono text-sm tracking-widest text-[var(--primary-44)] transition-colors duration-300 hover:text-[var(--accent-cyan)]">
              {p}
            </p>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
