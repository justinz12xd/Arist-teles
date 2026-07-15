import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { CheckCircle2, ClipboardCheck, FileUp, Search, Scale, Target, FileText } from "lucide-react";

const STAGES = [
  { icon: FileUp, time: "queued → extracting", title: "Crear expediente y cargar documentos", desc: "El usuario sube PDFs o imágenes; el sistema valida propiedad, formato, tamaño, hash y estado." },
  { icon: ClipboardCheck, time: "awaiting_criteria", title: "Confirmar criterios y pesos", desc: "El Planner propone precio, garantía, plazo, cumplimiento y riesgos. El usuario puede ajustar pesos hasta sumar 1.0." },
  { icon: Search, time: "researching", title: "Preparar evidencia recuperable", desc: "Parsing, OCR, chunking, embeddings y contexto vecino dejan cada dato enlazado a documento, página y fragmento." },
  { icon: Scale, time: "comparing", title: "Comparar alternativas", desc: "Todos los proveedores se evalúan con los mismos criterios. Datos ausentes y contradicciones permanecen visibles." },
  { icon: Target, time: "deciding", title: "Recomendar o abstenerse", desc: "El Decision Agent justifica una alternativa o devuelve needs_review cuando la evidencia no alcanza." },
  { icon: FileText, time: "reporting → completed", title: "Entregar reporte auditable", desc: "La salida web y el PDF muestran recomendación, confianza, riesgos y citas verificables." },
];

export function Timeline() {
  return (
    <section id="timeline" className="relative mx-auto max-w-6xl scroll-mt-[var(--header-h)] px-6 py-32">
      <ScrollReveal>
        <SectionLabel>[ 02 · ejecución ]</SectionLabel>
        <h2 className="text-h2 max-w-3xl">Un flujo reanudable desde documentos dispersos hasta reporte final.</h2>
      </ScrollReveal>

      <div className="relative mt-16 ml-4 border-l border-[var(--primary-12)] pl-10">
        {STAGES.map((s, i) => (
          <ScrollReveal key={s.title} delay={i * 0.06} className="relative pb-14 last:pb-0">
            <span className="absolute -left-[45px] flex h-4 w-4 items-center justify-center rounded-full border border-[var(--accent-cyan)] bg-[var(--bg-void)] shadow-[0_0_12px_rgb(34_211_238/0.5)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-cyan)]" />
            </span>
            <p className="section-label">{s.time}</p>
            <div className="mt-2 flex items-center gap-3">
              <s.icon size={18} className="text-[var(--accent-cyan)]" />
              <h3 className="text-h3">{s.title}</h3>
              <CheckCircle2 size={16} className="hidden text-[var(--primary-44)] sm:block" />
            </div>
            <p className="mt-2 max-w-2xl text-[var(--primary-60)]">{s.desc}</p>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
