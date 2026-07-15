import { Send, Paperclip, ScrollText } from "lucide-react";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const FILES = ["papiro-a.pdf", "papiro-b.pdf", "garantia-c.webp"];
const MESSAGES = [
  { from: "user", text: "Necesito elegir proveedor para renovar equipos. Dejé tres papiros en el expediente." },
  { from: "ai", text: "El oráculo encontró diferencias en precio, entrega y garantía. Proveedor B lidera, pero hay 2 riesgos que conviene deliberar." },
  { from: "user", text: "Mostrame las pruebas." },
  { from: "ai", text: "Proveedor B declara entrega en 15 días y garantía de 24 meses. La propuesta C cuesta menos, pero calla sobre soporte postventa." },
];

export function ChatPreview() {
  return (
    <section id="chat" className="relative mx-auto max-w-6xl scroll-mt-[var(--header-h)] px-6 py-28">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <ScrollReveal>
          <SectionLabel>[ 02 · oráculo ]</SectionLabel>
          <h2 className="text-h2 max-w-xl">Conversá con el oráculo, pero exigile evidencia.</h2>
          <p className="mt-6 max-w-lg text-[var(--primary-60)]">
            La mitología da el gesto; el producto mantiene el rigor. Cada respuesta puede
            bajar del Olimpo a una cita concreta del documento.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.12}>
          <div className="glass hellenic-frame marble-surface overflow-hidden p-4 pt-8 shadow-[0_0_50px_rgb(216_177_95/0.08)]">
            <div className="flex flex-wrap gap-2 border-b border-[var(--primary-4)] pb-4">
              {FILES.map((file) => (
                <div key={file} className="flex max-w-full items-center gap-2 rounded-full border border-[var(--primary-12)] px-3 py-1.5 text-xs text-[var(--primary-60)]">
                  <ScrollText size={13} className="shrink-0 text-[var(--accent-cyan)]" />
                  <span className="min-w-0 truncate">{file}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 py-5">
              {MESSAGES.map((message, i) => (
                <div key={i} className={`flex ${message.from === "user" ? "justify-end" : "justify-start"}`}>
                  <p
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.from === "user"
                        ? "bg-[var(--accent-marble)] text-black"
                        : "border border-[var(--primary-12)] bg-black/25 text-[var(--primary-80)]"
                    }`}
                  >
                    {message.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 rounded-[1.5rem] border border-[var(--primary-12)] bg-black/30 px-3 py-3 sm:rounded-full sm:px-4">
              <Paperclip size={16} className="shrink-0 text-[var(--primary-44)]" />
              <span className="min-w-0 flex-1 truncate text-sm text-[var(--primary-44)]">Consultar al oráculo sobre riesgos, costos o citas...</span>
              <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent-marble)] text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-cyan)]" aria-label="Enviar mensaje">
                <Send size={14} />
              </button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
