"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const FAQS = [
  { q: "¿Necesito equipo para inscribirme?", a: "No. Podés subir a bordo en solitario: la noche de apertura tiene una ronda de acople donde se forman tripulaciones de 2 a 5 personas." },
  { q: "¿Es presencial o remoto?", a: "Híbrido. La estación física tiene 300 asientos; el canal remoto transmite mentorías y acepta demos en vivo por la misma ventana de lanzamiento." },
  { q: "¿Qué nivel técnico se espera?", a: "Cualquiera que pueda llevar una idea a demo. Hay rutas para perfiles de producto y diseño, no solo para quienes escriben código." },
  { q: "¿Quién se queda con lo construido?", a: "Tu equipo. Todo el código y la propiedad intelectual quedan en manos de quienes lo crearon. La estación solo pide una demo pública." },
  { q: "¿Cuánto cuesta participar?", a: "Nada. El asiento se reserva con inscripción aprobada. El combustible lo ponen los aliados." },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative mx-auto max-w-3xl scroll-mt-[var(--header-h)] px-6 py-32">
      <ScrollReveal>
        <SectionLabel>[ 07 · transmisiones ]</SectionLabel>
        <h2 className="text-h2">Preguntas desde tierra.</h2>
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
