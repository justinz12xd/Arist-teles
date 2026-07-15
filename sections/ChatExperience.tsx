"use client";

import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import {
  ArrowUp,
  FileText,
  History,
  Library,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Scale,
  Search,
  Sparkles,
} from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";

type AgentResult = {
  document: {
    filename: string;
    pages: number;
    quality_score: number;
    previews: Array<{
      document?: string;
      page_number: number;
      method: string;
      preview: string;
    }>;
  };
  research: {
    evidence: Array<{ id: string; document: string; page: number; quote: string }>;
  };
  decision: {
    outcome: "recommendation" | "needs_review";
    recommended_provider_id: string | null;
    summary: string;
    risk_items: string[];
    confidence: {
      score: number;
      band: "high" | "medium" | "low";
    };
  };
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  result?: AgentResult;
};

const CHAT_HISTORY = [
  { title: "Renovacion de equipos", preview: "Proveedor B lidera; 2 riesgos pendientes.", active: true },
  { title: "Contrato de soporte", preview: "Clausula de penalidad requiere revision.", active: false },
  { title: "Compra de licencias", preview: "Falta confirmar renovacion automatica.", active: false },
  { title: "Comparacion logistica", preview: "Opcion C tiene entrega parcial.", active: false },
];

const NAV = [
  { icon: Plus, label: "Nuevo chat", active: true },
  { icon: Search, label: "Buscar" },
  { icon: Library, label: "Biblioteca" },
  { icon: History, label: "Historial" },
];

function fallbackAnswer(question: string, files: File[]): AgentResult {
  return {
    document: {
      filename: files.map((file) => file.name).join(", ") || "documentos.pdf",
      pages: files.length || 1,
      quality_score: 0.18,
      previews: [
        {
          page_number: 1,
          method: "browser-demo",
          preview: "Backend no disponible. Ejecuta FastAPI y configura ARISTOTELES_API_URL para analizar PDFs reales.",
        },
      ],
    },
    research: { evidence: [] },
    decision: {
      outcome: "needs_review",
      recommended_provider_id: null,
      summary: `No pude analizar evidencia real para: "${question}".`,
      risk_items: ["Falta conectar el backend demo o cargar documentos procesables."],
      confidence: { score: 0.18, band: "low" },
    },
  };
}

export function ChatExperience() {
  const [question, setQuestion] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSend = useMemo(
    () => question.trim().length > 0 && !isSending,
    [isSending, question],
  );

  function onFilesChange(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []));
    setError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) {
      return;
    }

    const cleanQuestion = question.trim();
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: cleanQuestion,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setIsSending(true);
    setError(null);

    if (!files.length) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            cleanQuestion.toLowerCase().trim() === "hola"
              ? "Hola. Puedo ayudarte a revisar documentos; adjunta uno o varios PDFs para responder con evidencia."
              : "Puedo responder mejor con evidencia si adjuntas uno o varios PDFs. Sube documentos y vuelve a preguntar.",
        },
      ]);
      setIsSending(false);
      return;
    }

    const formData = new FormData();
    formData.set("objective", cleanQuestion);
    for (const file of files) {
      formData.append("files", file);
    }

    try {
      const response = await fetch("/api/agent-demo", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Backend unavailable");
      }
      const result = (await response.json()) as AgentResult;
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.decision.summary,
          result,
        },
      ]);
    } catch {
      const result = fallbackAnswer(cleanQuestion, files);
      setError("Usando respuesta local. Inicia el backend para extraer evidencia real de los PDFs.");
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.decision.summary,
          result,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgb(216_177_95/0.08),transparent_28%),radial-gradient(circle_at_78%_10%,rgb(139_92_246/0.06),transparent_24%)]" />
      <div className="orbit-engraving opacity-[0.12]" aria-hidden />

      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden w-[252px] shrink-0 flex-col border-r border-white/10 bg-[#070707] px-2 py-3 md:flex">
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
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between px-6">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              Aristoteles <span className="text-[var(--primary-44)]">chat</span>
            </div>
            <div className="section-label hidden sm:block">oraculo de evidencia</div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-6">
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-end">
              {messages.length === 0 ? (
                <div className="mb-9 text-center">
                  <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-[rgb(216_177_95/0.24)] bg-[rgb(216_177_95/0.08)]">
                    <Sparkles size={18} className="text-[var(--accent-cyan)]" />
                  </div>
                  <h1 className="text-2xl font-medium text-white sm:text-3xl">Pregunta sobre tus documentos.</h1>
                  <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--primary-44)]">
                    Adjunta uno o varios PDFs y pide comparaciones, riesgos, garantias o evidencia localizada.
                  </p>
                </div>
              ) : (
                <div className="mb-6 max-h-[calc(100vh-15rem)] space-y-4 overflow-y-auto pr-1">
                  {messages.map((message) => (
                    <div key={message.id} className={message.role === "user" ? "ml-auto max-w-2xl" : "mr-auto max-w-3xl"}>
                      <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
                        message.role === "user"
                          ? "border-white/10 bg-white/10 text-white"
                          : "border-[rgb(216_177_95/0.18)] bg-black/30 text-[var(--primary-80)]"
                      }`}>
                        {message.content}
                        {message.result && (
                          <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                            <div className="flex flex-wrap gap-2 text-xs text-[var(--primary-44)]">
                              <span>{message.result.document.pages} paginas</span>
                              <span>confianza {Math.round(message.result.decision.confidence.score * 100)}%</span>
                              <span>{message.result.decision.confidence.band}</span>
                            </div>
                            {message.result.research.evidence.slice(0, 3).map((item) => (
                              <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                                <div className="mb-1 flex items-center gap-2 text-xs text-[var(--primary-44)]">
                                  <FileText size={12} className="text-[var(--accent-cyan)]" />
                                  {item.document} · pagina {item.page}
                                </div>
                                <p className="text-xs leading-5 text-[var(--primary-60)]">{item.quote}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={onSubmit} className="rounded-[1.75rem] border border-white/10 bg-[#212121] p-3 shadow-[0_18px_80px_rgb(0_0_0/0.35)]">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  className="sr-only"
                  onChange={onFilesChange}
                />

                <div className="mb-3 flex flex-wrap gap-2 px-2">
                  {files.length ? (
                    files.map((file) => (
                      <span key={`${file.name}-${file.size}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-[var(--primary-60)]">
                        <FileText size={12} className="text-[var(--accent-cyan)]" />
                        {file.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[var(--primary-44)]">Sin documentos adjuntos</span>
                  )}
                </div>

                <div className="flex items-center gap-3 px-2 pb-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--primary-60)] transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Adjuntar archivos"
                  >
                    <Paperclip size={18} />
                  </button>
                  <input
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    className="min-h-10 flex-1 bg-transparent py-2 text-base text-white outline-none placeholder:text-[var(--primary-44)]"
                    placeholder="Preguntar lo que quieras"
                    maxLength={1200}
                  />
                  <AIVoiceInput compact />
                  <button
                    type="submit"
                    disabled={!canSend}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-marble)] text-black transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Enviar mensaje"
                  >
                    {isSending ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={18} />}
                  </button>
                </div>
              </form>

              {error && <p className="mt-4 text-center text-xs text-amber-200">{error}</p>}
              <p className="mt-4 text-center text-xs text-[var(--primary-44)]">
                Aristoteles puede equivocarse. Verifica siempre las citas antes de decidir.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
