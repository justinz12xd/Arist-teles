import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import {
  ArrowUp,
  FileText,
  History,
  Library,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Scale,
  Search,
  Sparkles,
} from "lucide-react";

const CHAT_HISTORY = [
  { title: "Renovación de equipos", preview: "Proveedor B lidera; 2 riesgos pendientes.", time: "Ahora", active: true },
  { title: "Contrato de soporte", preview: "Cláusula de penalidad requiere revisión.", time: "Ayer", active: false },
  { title: "Compra de licencias", preview: "Falta confirmar renovación automática.", time: "Lun", active: false },
  { title: "Comparación logística", preview: "Opción C tiene entrega parcial.", time: "12 Jul", active: false },
];

const FILES = ["cotizacion-a.pdf", "cotizacion-b.pdf", "garantia-c.webp"];

const NAV = [
  { icon: Plus, label: "Nuevo chat", active: true },
  { icon: Search, label: "Buscar" },
  { icon: Library, label: "Biblioteca" },
  { icon: History, label: "Historial" },
];

export function ChatExperience() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgb(216_177_95/0.08),transparent_28%),radial-gradient(circle_at_78%_10%,rgb(139_92_246/0.06),transparent_24%)]" />
      <div className="orbit-engraving opacity-[0.12]" aria-hidden />

      <div className="relative z-10 flex min-h-screen">
        <aside className="flex w-[252px] shrink-0 flex-col border-r border-white/10 bg-[#070707] px-2 py-3">
          <div className="mb-4 flex items-center justify-between px-2">
            <a href="/" className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10" aria-label="Volver al inicio">
              <Scale size={18} className="text-[var(--accent-cyan)]" />
            </a>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--primary-60)] transition-colors hover:bg-white/10 hover:text-white" aria-label="Contraer barra lateral">
              <MoreHorizontal size={18} />
            </button>
          </div>

          <nav className="space-y-1">
            {NAV.map((item) => (
              <button
                key={item.label}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  item.active ? "bg-white/10 text-white" : "text-[var(--primary-80)] hover:bg-white/8 hover:text-white"
                }`}
              >
                <item.icon size={17} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-6 flex-1 overflow-hidden px-1">
            <p className="mb-2 px-2 text-xs text-[var(--primary-44)]">Chats</p>
            <div className="space-y-1">
              {CHAT_HISTORY.map((chat) => (
                <button
                  key={chat.title}
                  className={`group w-full rounded-lg px-3 py-2 text-left transition-colors ${
                    chat.active ? "bg-[rgb(216_177_95/0.12)]" : "hover:bg-white/8"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className={chat.active ? "text-[var(--accent-cyan)]" : "text-[var(--primary-44)]"} />
                    <p className="truncate text-sm text-white">{chat.title}</p>
                  </div>
                  <p className="mt-1 truncate pl-6 text-xs text-[var(--primary-44)]">{chat.preview}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs">J</div>
            <div className="min-w-0">
              <p className="truncate text-sm text-white">Justin Zambrano</p>
              <p className="text-xs text-[var(--primary-44)]">Gratis</p>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between px-6">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              Aristóteles <span className="text-[var(--primary-44)]">⌄</span>
            </div>
            <div className="section-label hidden sm:block">oráculo de evidencia</div>
          </header>

          <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10">
            <div className="w-full max-w-3xl">
              <div className="mb-9 text-center">
                <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-[rgb(216_177_95/0.24)] bg-[rgb(216_177_95/0.08)]">
                  <Sparkles size={18} className="text-[var(--accent-cyan)]" />
                </div>
                <h1 className="text-2xl font-medium tracking-[-0.02em] text-white sm:text-3xl">
                  Listo cuando tú lo estés.
                </h1>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--primary-44)]">
                  Sube documentos y pregunta por riesgos, costos, garantías o evidencia.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-[#212121] p-3 shadow-[0_18px_80px_rgb(0_0_0/0.35)]">
                <div className="mb-3 flex flex-wrap gap-2 px-2">
                  {FILES.map((file) => (
                    <span key={file} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-[var(--primary-60)]">
                      <FileText size={12} className="text-[var(--accent-cyan)]" />
                      {file}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3 px-2 pb-1">
                  <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--primary-60)] transition-colors hover:bg-white/10 hover:text-white" aria-label="Adjuntar archivo">
                    <Paperclip size={18} />
                  </button>
                  <div className="min-h-10 flex-1 py-2 text-base text-[var(--primary-44)]">
                    Preguntar lo que quieras
                  </div>
                  <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-marble)] text-black transition-transform hover:scale-105" aria-label="Enviar mensaje">
                    <ArrowUp size={18} />
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-2">
                <p className="section-label text-center">whisper pronto</p>
                <AIVoiceInput visualizerBars={36} className="py-2" />
              </div>

              <p className="mt-4 text-center text-xs text-[var(--primary-44)]">
                Aristóteles puede equivocarse. Verifica siempre las citas antes de decidir.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
