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
  comparison?: Array<{
    provider_id: string;
    weighted_score?: number;
    advantages: string[];
    disadvantages: string[];
  }>;
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

function normalizeQuestion(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function answerWithoutDocuments(question: string) {
  const normalized = normalizeQuestion(question);

  if (/^(hola|buenas|hey|hi|hello)\b/.test(normalized)) {
    return "Hola. Puedo responder preguntas generales sobre Aristoteles o analizar PDFs si los adjuntas.";
  }

  if (normalized.includes("que es") || normalized.includes("aristoteles") || normalized.includes("proyecto")) {
    return "Aristoteles es un sistema de apoyo a decisiones: toma documentos privados, extrae evidencia, compara alternativas y entrega una recomendacion justificable con citas.";
  }

  if (normalized.includes("proveedor") || normalized.includes("empresa") || normalized.includes("app")) {
    return "Puedo comparar proveedores, empresas o apps por precio, garantia, plazo, cumplimiento y riesgo. Si adjuntas varios PDFs, trato cada PDF como una alternativa y muestro beneficios, desventajas y recomendacion.";
  }

  if (normalized.includes("backend") || normalized.includes("api")) {
    return "El backend es FastAPI. La demo del chat usa /api/agent-demo en Next, que reenvia pregunta y PDFs al endpoint /v1/demo/agent para extraer texto y generar una respuesta con evidencia.";
  }

  if (normalized.includes("document") || normalized.includes("pdf") || normalized.includes("archivo")) {
    return "Puedes adjuntar uno o varios PDFs con el icono de clip. Cuando hay documentos, el chat los envia al backend y responde con resumen, confianza y citas por documento y pagina.";
  }

  if (normalized.includes("microfono") || normalized.includes("mic") || normalized.includes("voz")) {
    return "El microfono dicta texto en el campo de pregunta usando el reconocimiento de voz del navegador. Funciona mejor en Chrome o Edge y puede pedir permiso para usar el microfono.";
  }

  if (normalized.includes("como") && normalized.includes("usar")) {
    return "Para usarlo: adjunta uno o varios PDFs, escribe una pregunta como 'compara garantias' o 'que riesgos ves', y envia. Sin PDFs puedo contestar preguntas basicas del proyecto.";
  }

  return "Puedo responder preguntas generales del proyecto. Para respuestas con evidencia, adjunta uno o varios PDFs y pregunta por riesgos, costos, garantias, plazos o comparaciones.";
}

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
    comparison: [],
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
          content: answerWithoutDocuments(cleanQuestion),
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
                            {message.result.comparison?.slice(0, 3).map((item) => (
                              <div key={item.provider_id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                  <p className="text-xs font-medium text-white">{item.provider_id}</p>
                                  {typeof item.weighted_score === "number" && (
                                    <span className="font-mono text-[0.68rem] text-[var(--accent-cyan)]">
                                      {Math.round(item.weighted_score * 100)}%
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs leading-5 text-emerald-200">
                                  Beneficios: {item.advantages.join(", ") || "sin ventaja clara"}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-amber-200">
                                  Desventajas: {item.disadvantages.join(", ") || "sin desventaja clara"}
                                </p>
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
                  <AIVoiceInput
                    compact
                    onTranscript={(text) => {
                      setQuestion((current) => `${current}${current ? " " : ""}${text}`);
                      setError(null);
                    }}
                    onUnsupported={() => {
                      setError("Tu navegador no soporta dictado por voz. Prueba con Chrome o Edge.");
                    }}
                  />
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
