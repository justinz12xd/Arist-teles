"use client";

import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { DecisionRoadmap } from "@/components/decision/DecisionRoadmap";
import { agentDemoUrl, chatResearchUrl } from "@/lib/backend-api";
import type { DecisionRoadmapData } from "@/lib/aristoteles-contracts";
import {
  ArrowUp,
  Copy,
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
  Trash2,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

type AgentResult = {
  mode?: "web" | "documents" | "hybrid";
  answer?: string;
  citations?: Array<{
    id: string;
    title: string;
    url: string;
  }>;
  document?: {
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
  research?: {
    evidence: Array<{ id: string; document: string; page: number; quote: string }>;
  };
  comparison?: Array<{
    provider_id: string;
    weighted_score?: number;
    advantages: string[];
    disadvantages: string[];
  }>;
  decision?: {
    outcome: "recommendation" | "needs_review";
    recommended_provider_id: string | null;
    summary: string;
    risk_items: string[];
    confidence: {
      score: number;
      band: "high" | "medium" | "low";
    };
  };
  roadmap?: DecisionRoadmapData;
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

const QUICK_PROMPTS = [
  "Compara las propuestas y dime cual conviene mas",
  "Resume beneficios y desventajas de cada alternativa",
  "Que riesgos deberia revisar antes de decidir",
  "Que datos faltan para tomar una mejor decision",
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
    return "El backend es FastAPI. El chat no usa rutas API de Next: llama directo a /v1/chat/research para investigar y a /v1/demo/agent para conversar con PDFs.";
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

function conversationalAnswer(question: string, files: File[]) {
  const normalized = normalizeQuestion(question);
  const hasFiles = files.length > 0;

  if (/^(hola|buenas|hey|hi|hello)\b/.test(normalized)) {
    return hasFiles
      ? `Hola. Veo ${files.length} documento(s) adjunto(s). Puedes pedirme que los compare o preguntarme primero que criterios conviene revisar.`
      : "Hola. Soy el agente de Aristoteles. Puedo conversar sobre decisiones, criterios, proveedores, apps o el proyecto antes de analizar documentos.";
  }

  if (normalized.includes("criterio") || normalized.includes("decidir") || normalized.includes("decision")) {
    return "Para tomar una mejor decision suelo mirar beneficios, desventajas, costo total, garantia, plazo, cumplimiento, riesgos y datos faltantes. Si adjuntas varios PDFs, puedo convertir cada documento en una alternativa y recomendar la mejor con razones.";
  }

  if (normalized.includes("beneficio") || normalized.includes("desventaja") || normalized.includes("malo") || normalized.includes("bueno")) {
    return "Puedo separar lo bueno y lo malo de cada alternativa. Lo bueno cuenta como ventaja si mejora costo, garantia, entrega, soporte o cumplimiento. Lo malo pesa como riesgo si hay restricciones, penalidades, costos ocultos, baja garantia o entrega lenta.";
  }

  if (hasFiles) {
    return `Tengo ${files.length} documento(s) listo(s). Si quieres conversamos sobre que buscar; si quieres decision, usa el boton de enviar para analizarlos y elegir la mejor alternativa.`;
  }

  return answerWithoutDocuments(question);
}

function fallbackAnswer(question: string, files: File[]): AgentResult {
  return {
    mode: files.length ? "hybrid" : "web",
    answer: `No pude recuperar evidencia verificable para: "${question}".`,
    citations: [],
  };
}

export function ChatExperience() {
  const [question, setQuestion] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canSend = useMemo(
    () => question.trim().length > 0 && !isSending,
    [isSending, question],
  );
  const visibleHistory = useMemo(() => {
    const query = normalizeQuestion(historySearch);
    if (!query) {
      return CHAT_HISTORY;
    }
    return CHAT_HISTORY.filter((chat) =>
      normalizeQuestion(`${chat.title} ${chat.preview}`).includes(query),
    );
  }, [historySearch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function onFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? []);
    setFiles((current) => {
      const existing = new Set(current.map((file) => `${file.name}-${file.size}`));
      return [...current, ...nextFiles.filter((file) => !existing.has(`${file.name}-${file.size}`))];
    });
    setError(null);
    event.target.value = "";
  }

  function removeFile(fileToRemove: File) {
    setFiles((current) => current.filter((file) => file !== fileToRemove));
  }

  function startNewChat() {
    setQuestion("");
    setFiles([]);
    setMessages([]);
    setError(null);
    setCopiedMessageId(null);
  }

  async function copyMessage(message: ChatMessage) {
    await navigator.clipboard?.writeText(message.content);
    setCopiedMessageId(message.id);
    window.setTimeout(() => setCopiedMessageId(null), 1400);
  }

  function onQuestionKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function appendUserMessage(content: string) {
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content,
      },
    ]);
  }

  function appendAssistantMessage(content: string, result?: AgentResult) {
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content,
        result,
      },
    ]);
  }

  async function onConversationClick() {
    if (!canSend) {
      return;
    }

    const cleanQuestion = question.trim();
    appendUserMessage(cleanQuestion);
    setQuestion("");
    setError(null);

    if (!files.length) {
      appendAssistantMessage(conversationalAnswer(cleanQuestion, files));
      return;
    }

    setIsSending(true);
    const formData = new FormData();
    formData.set(
      "objective",
      `Conversa sobre todas las propuestas, compara beneficios y desventajas, elige la mejor y explica por que. Pregunta: ${cleanQuestion}`,
    );
    for (const file of files) {
      formData.append("files", file);
    }

    try {
      const response = await fetch(agentDemoUrl(), {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Backend unavailable");
      }
      const result = (await response.json()) as AgentResult;
      appendAssistantMessage(
        `Revisando todas las propuestas: ${result.decision?.summary ?? result.answer ?? "sin conclusión disponible"}`,
        result,
      );
    } catch {
      const result = fallbackAnswer(cleanQuestion, files);
      setError("Usando respuesta local. Inicia el backend para comparar todas las propuestas.");
      appendAssistantMessage(result.answer ?? "No pude generar una respuesta.", result);
    } finally {
      setIsSending(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) {
      return;
    }

    const cleanQuestion = question.trim();
    appendUserMessage(cleanQuestion);
    setQuestion("");
    setIsSending(true);
    setError(null);

    const formData = new FormData();
    formData.set("objective", cleanQuestion);
    formData.set("mode", files.length ? "hybrid" : "web");
    for (const file of files) {
      formData.append("files", file);
    }

    try {
      const response = await fetch(chatResearchUrl(), {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Backend unavailable");
      }
      const result = (await response.json()) as AgentResult;
      appendAssistantMessage(result.answer ?? result.decision?.summary ?? "No pude generar una respuesta.", result);
    } catch {
      const result = fallbackAnswer(cleanQuestion, files);
      setError("No pude conectar con el investigador. Verifica el backend y la configuración de OpenAI.");
      appendAssistantMessage(result.answer ?? "No pude generar una respuesta.", result);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgb(216_177_95/0.08),transparent_28%),radial-gradient(circle_at_78%_10%,rgb(139_92_246/0.06),transparent_24%)]" />
      <div className="orbit-engraving opacity-[0.12]" aria-hidden />

      <div className="relative z-10 flex min-h-[100svh]">
        <aside className="hidden w-[252px] shrink-0 flex-col border-r border-white/10 bg-[#070707] px-2 py-3 md:flex">
          <div className="mb-4 flex items-center justify-between px-2">
            <a href="/" className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-cyan)]" aria-label="Volver al inicio">
              <Scale size={18} className="text-[var(--accent-cyan)]" />
            </a>
            <button className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--primary-60)] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-cyan)]" aria-label="Contraer barra lateral">
              <MoreHorizontal size={18} />
            </button>
          </div>

          <nav className="space-y-1">
            {NAV.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.label === "Nuevo chat" ? startNewChat : undefined}
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
            <label className="mb-3 flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <Search size={14} className="text-[var(--primary-44)]" />
              <input
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-[var(--primary-44)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-cyan)]"
                placeholder="Buscar historial…"
              />
            </label>
            <div className="space-y-1">
              {visibleHistory.map((chat) => (
                <button
                  key={chat.title}
                  type="button"
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
              {visibleHistory.length === 0 && (
                <p className="px-3 py-2 text-xs text-[var(--primary-44)]">Sin resultados.</p>
              )}
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between px-4 pt-[env(safe-area-inset-top)] sm:px-6">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              Aristoteles <span className="text-[var(--primary-44)]">chat</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="section-label hidden sm:block">oraculo de evidencia</div>
              <button
                type="button"
                onClick={startNewChat}
                className="hidden min-h-11 items-center gap-2 rounded-full border border-white/10 px-3 text-xs text-[var(--primary-60)] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-cyan)] sm:inline-flex"
              >
                <Trash2 size={14} />
                limpiar
              </button>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
            <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col">
              {messages.length === 0 ? (
                <div className="flex min-h-0 flex-1 flex-col justify-end pb-9 text-center">
                  <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-[rgb(216_177_95/0.24)] bg-[rgb(216_177_95/0.08)]">
                    <Sparkles size={18} className="text-[var(--accent-cyan)]" />
                  </div>
                  <h1 className="text-2xl font-medium text-white sm:text-3xl">Pregunta sobre tus documentos.</h1>
                  <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--primary-44)]">
                    Adjunta uno o varios PDFs y pide comparaciones, riesgos, garantias o evidencia localizada.
                  </p>
                  <div className="mx-auto mt-6 grid max-w-2xl gap-2 sm:grid-cols-2">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setQuestion(prompt)}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-xs leading-5 text-[var(--primary-70)] transition-colors hover:border-[rgb(216_177_95/0.28)] hover:bg-[rgb(216_177_95/0.08)] hover:text-white"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-6 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1 scrollbar-thin">
                  {messages.map((message) => (
                    <div key={message.id} className={message.role === "user" ? "ml-auto max-w-2xl" : "mr-auto max-w-3xl"}>
                      <div className={`break-words rounded-2xl border px-4 py-3 text-sm leading-6 ${
                        message.role === "user"
                          ? "border-white/10 bg-white/10 text-white"
                          : "border-[rgb(216_177_95/0.18)] bg-black/30 text-[var(--primary-80)]"
                      }`}>
                        <div className="flex items-start gap-3">
                          <p className="min-w-0 flex-1 whitespace-pre-wrap">{message.content}</p>
                          <button
                            type="button"
                            onClick={() => copyMessage(message)}
                            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--primary-44)] transition-colors hover:bg-white/10 hover:text-white"
                            aria-label="Copiar mensaje"
                            title="Copiar"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                        {copiedMessageId === message.id && (
                          <p className="mt-2 text-[0.68rem] uppercase tracking-[0.16em] text-[var(--accent-cyan)]">
                            copiado
                          </p>
                        )}
                        {message.result && (
                          <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                            <div className="flex flex-wrap gap-2 text-xs text-[var(--primary-44)]">
                              <span>{message.result.mode === "hybrid" ? "web + documentos" : "web"}</span>
                              {message.result.document && <span>{message.result.document.pages} páginas</span>}
                              <span>{message.result.citations?.length ?? 0} fuentes</span>
                              {message.result.decision && (
                                <span>confianza {Math.round(message.result.decision.confidence.score * 100)}%</span>
                              )}
                            </div>
                            {message.result.decision?.recommended_provider_id && (
                              <div className="rounded-lg border border-[rgb(34_211_238/0.24)] bg-[rgb(34_211_238/0.08)] p-3">
                                <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent-cyan)]">
                                  ganadora
                                </p>
                                <h3 className="mt-2 text-base font-medium text-white">
                                  {message.result.decision?.recommended_provider_id}
                                </h3>
                                <p className="mt-2 text-xs leading-5 text-[var(--primary-70)]">
                                  {message.result.decision?.summary}
                                </p>
                                {(message.result.decision?.risk_items.length ?? 0) > 0 && (
                                  <div className="mt-3 space-y-1">
                                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--primary-44)]">
                                      revisar antes de decidir
                                    </p>
                                    {message.result.decision?.risk_items.slice(0, 3).map((risk) => (
                                      <p key={risk} className="text-xs leading-5 text-amber-200">
                                        {risk}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            {message.result.citations?.map((citation) => (
                              <a
                                key={citation.id}
                                href={citation.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block rounded-lg border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-[rgb(216_177_95/0.35)]"
                              >
                                <div className="mb-1 flex items-center gap-2 text-xs text-[var(--primary-44)]">
                                  <Search size={12} className="text-[var(--accent-cyan)]" />
                                  Fuente verificable
                                </div>
                                <p className="text-xs leading-5 text-[var(--primary-60)]">{citation.title}</p>
                              </a>
                            ))}
                            {message.result.research?.evidence.slice(0, 3).map((item) => (
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
                            {message.result.roadmap && <DecisionRoadmap roadmap={message.result.roadmap} />}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="mr-auto max-w-3xl rounded-2xl border border-[rgb(216_177_95/0.18)] bg-black/30 px-4 py-3 text-sm text-[var(--primary-70)]">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 size={15} className="animate-spin text-[var(--accent-cyan)]" />
                        El agente esta revisando criterios, evidencia y alternativas...
                      </span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
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
                      <span key={`${file.name}-${file.size}`} className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-[var(--primary-60)]">
                        <FileText size={12} className="shrink-0 text-[var(--accent-cyan)]" />
                        <span className="min-w-0 truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(file)}
                          className="rounded-full text-[var(--primary-44)] transition-colors hover:text-white"
                          aria-label={`Quitar ${file.name}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[var(--primary-44)]">Sin documentos adjuntos</span>
                  )}
                </div>

                <div className="flex items-center gap-2 px-1 pb-1 sm:gap-3 sm:px-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--primary-60)] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-cyan)]"
                    aria-label="Adjuntar archivos"
                  >
                    <Paperclip size={18} />
                  </button>
                  <textarea
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    onKeyDown={onQuestionKeyDown}
                    className="max-h-32 min-h-11 min-w-0 flex-1 resize-none bg-transparent py-2 text-base leading-6 text-white outline-none placeholder:text-[var(--primary-44)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-cyan)]"
                    placeholder="Preguntar…"
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
                    type="button"
                    disabled={!canSend}
                    onClick={onConversationClick}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-[var(--primary-60)] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-cyan)] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Conversar sobre propuestas"
                    title="Conversar sobre propuestas"
                  >
                    <MessageSquare size={17} />
                  </button>
                  <button
                    type="submit"
                    disabled={!canSend}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent-marble)] text-black transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-cyan)] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Analizar y decidir"
                    title="Analizar y decidir"
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
