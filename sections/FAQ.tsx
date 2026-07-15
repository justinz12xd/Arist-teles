"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const FAQS = [
  {
    q: "Aristoteles toma la decision por mi?",
    a: "No. Prepara evidencia, compara proveedores bajo criterios confirmados y emite una recomendacion no vinculante. La decision final queda en la persona.",
  },
  {
    q: "Que documentos acepta el MVP?",
    a: "PDFs digitales, PDFs escaneados e imagenes PNG, JPEG o WebP. Si la extraccion local no alcanza calidad suficiente, puede activarse fallback visual.",
  },
  {
    q: "Puedo cambiar los criterios?",
    a: "Si. El Planner sugiere criterios y pesos, pero el usuario debe confirmarlos antes de iniciar la comparacion. Los pesos confirmados deben sumar 1.0.",
  },
  {
    q: "Que pasa si falta un dato importante?",
    a: "El dato queda marcado como ausente. El sistema no lo completa por inferencia y esa ausencia limita la confianza cuando afecta un criterio critico.",
  },
  {
    q: "Puede abstenerse de recomendar?",
    a: "Si. Cuando hay contradicciones criticas o evidencia insuficiente, el Decision Agent puede devolver needs_review en lugar de forzar un ganador.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative mx-auto max-w-3xl scroll-mt-[var(--header-h)] px-6 py-32">
      <ScrollReveal>
        <SectionLabel>[ 07 · preguntas ]</SectionLabel>
        <h2 className="text-h2">Lo que debe quedar claro antes de confiar en una recomendacion.</h2>
      </ScrollReveal>

      <div className="mt-12 divide-y divide-[var(--primary-4)] border-y border-[var(--primary-4)]">
        {FAQS.map((faq, i) => (
          <ScrollReveal key={faq.q} delay={i * 0.04}>
            <button
              className="flex w-full items-center justify-between py-5 text-left text-white transition-colors hover:text-[var(--accent-cyan)]"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              <span className="font-medium">{faq.q}</span>
              <ChevronDown
                size={18}
                className={`shrink-0 transition-transform duration-300 ${open === i ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ${open === i ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"}`}
              style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
            >
              <p className="overflow-hidden text-sm text-[var(--primary-60)]">{faq.a}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
