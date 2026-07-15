"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const FAQS = [
  { q: "¿Aristóteles toma la decisión por mí?", a: "No. El sistema prepara evidencia, compara alternativas y emite una recomendación no vinculante. La aprobación final sigue siendo humana." },
  { q: "¿Qué documentos acepta el MVP?", a: "PDFs digitales, PDFs escaneados e imágenes PNG, JPEG o WebP. Si la extracción local no alcanza calidad suficiente, puede activarse fallback visual." },
  { q: "¿Puedo cambiar los criterios?", a: "Sí. El Planner sugiere criterios y pesos, pero el usuario debe confirmarlos antes de iniciar la comparación. Los pesos confirmados deben sumar 1.0." },
  { q: "¿Qué pasa si falta información?", a: "El dato se mantiene como ausente. El modelo no puede inventarlo ni completarlo por inferencia, y la ausencia reduce la confianza cuando afecta un criterio crítico." },
  { q: "¿Cómo se protege la privacidad?", a: "Cada expediente pertenece a un usuario autenticado. La recuperación filtra por usuario y expediente, y borrar el expediente elimina documentos y artefactos derivados." },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative mx-auto max-w-3xl scroll-mt-[var(--header-h)] px-6 py-32">
      <ScrollReveal>
        <SectionLabel>[ 07 · preguntas ]</SectionLabel>
        <h2 className="text-h2">Lo que debe quedar claro antes de confiar en una recomendación.</h2>
      </ScrollReveal>

      <div className="mt-12 divide-y divide-[var(--primary-4)] border-y border-[var(--primary-4)]">
        {FAQS.map((f, i) => (
          <ScrollReveal key={f.q} delay={i * 0.04}>
            <button
              className="flex w-full items-center justify-between py-5 text-left text-white transition-colors hover:text-[var(--accent-cyan)]"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              <span className="font-medium">{f.q}</span>
              <ChevronDown
                size={18}
                className={`shrink-0 transition-transform duration-300 ${open === i ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ${open === i ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"}`}
              style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
            >
              <p className="overflow-hidden text-sm text-[var(--primary-60)]">{f.a}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
