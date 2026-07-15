"use client";

import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { MarkdownAnswer } from "@/components/chat/MarkdownAnswer";
import { StructuredResponse } from "@/components/chat/StructuredResponse";
import { agentDemoUrl, chatResearchUrl } from "@/lib/backend-api";
import { saveChatMessage } from "@/lib/chat-store";
import {
  getLocalChatSession,
  listLocalChatSessions,
  saveLocalChatMessage,
  type LocalChatSession,
} from "@/lib/local-chat-store";
import { supabase } from "@/lib/supabase";
import type { AgentResult } from "@/lib/chat-types";
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

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Array<{ name: string; size: number }>;
  result?: AgentResult;
};

type HistoryItem = {
  id: string;
  title: string;
  preview: string;
  active: boolean;
  local: boolean;
};

const CHAT_HISTORY = [
  { id: "preset-renovacion-equipos", title: "Renovacion de equipos", preview: "Proveedor B lidera; 2 riesgos pendientes.", active: true },
  { id: "preset-contrato-soporte", title: "Contrato de soporte", preview: "Clausula de penalidad requiere revision.", active: false },
  { id: "preset-compra-licencias", title: "Compra de licencias", preview: "Falta confirmar renovacion automatica.", active: false },
  { id: "preset-comparacion-logistica", title: "Comparacion logistica", preview: "Opcion C tiene entrega parcial.", active: false },
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

function answerWithoutDocuments(question: string): string {
  const normalized = normalizeQuestion(question);
  const questionParts = question
    .split(/(?:\?+|\n+|(?:^|\s)(?:y tambien|tambien|ademas|otra pregunta)[:\s]+)/i)
    .map((part) => part.trim())
    .filter(Boolean);

  if (questionParts.length >= 2) {
    return questionParts
      .slice(0, 6)
      .map((part, index) => {
        const answer = answerWithoutDocuments(part);
        return `${index + 1}. ${part}\n${answer}`;
      })
      .join("\n\n");
  }

  if (/^(hola|buenas|hey|hi|hello)\b/.test(normalized)) {
    return "Hola. Puedo responder preguntas generales sobre Aristoteles o analizar PDFs si los adjuntas.";
  }

  if (normalized.includes("que es") || normalized.includes("aristoteles") || normalized.includes("proyecto")) {
    return "Aristoteles es un sistema de apoyo a decisiones: toma documentos privados, extrae evidencia, compara alternativas y entrega una recomendacion justificable con citas.";
  }

  if (normalized.includes("proveedor") || normalized.includes("empresa") || normalized.includes("app")) {
    return "Puedo comparar proveedores, empresas o apps por precio, garantia, plazo, cumplimiento y riesgo. Si adjuntas varios PDFs, trato cada PDF como una alternativa y muestro beneficios, desventajas y recomendacion.";
  }

  if (
    normalized.includes("opcion") ||
    normalized.includes("opciones") ||
    normalized.includes("cual elijo") ||
    normalized.includes("cual conviene") ||
    normalized.includes("elige")
  ) {
    const mentionsA = normalized.includes("opcion a") || normalized.includes(" a ");
    const mentionsB = normalized.includes("opcion b") || normalized.includes(" b ");
    const mentionsC = normalized.includes("opcion c") || normalized.includes(" c ");
    if (mentionsA || mentionsB || mentionsC) {
      return [
        "Con lo que dices, eligiria la opcion A.",
        "",
        "Beneficios y ventajas:",
        "- Opcion A: da mas dinero. Ventaja principal: tiene el beneficio economico mas claro.",
        "- Opcion B: podria servir solo si tiene un beneficio muy alto que no mencionaste.",
        "- Opcion C: no veo beneficios con la informacion actual.",
        "",
        "Desventajas y riesgos:",
        "- Opcion A: falta revisar si ese dinero extra trae algun riesgo oculto, esfuerzo extra o condicion.",
        "- Opcion B: dices que es mas peligrosa; esa es una desventaja fuerte.",
        "- Opcion C: no da beneficios, entonces consume oportunidad sin aportar valor.",
        "",
        "Decision: A es la mejor si el riesgo de A es aceptable. No elegiria B salvo que el dinero/beneficio compense claramente el peligro. No elegiria C porque no aporta ventaja.",
        "",
        "Antes de cerrar, revisa: cuanto dinero extra da A, que riesgo real tiene B, y si C tiene algun beneficio oculto como seguridad, estabilidad o menor esfuerzo.",
      ].join("\n");
    }
  }

  if (normalized.includes("riesgo") || normalized.includes("decidir") || normalized.includes("decision")) {
    return [
      "Para decidir, separaria beneficios, ventajas y desventajas.",
      "",
      "Beneficios y ventajas a buscar:",
      "1. Mayor dinero, ahorro o retorno.",
      "2. Menor riesgo personal, legal, tecnico o economico.",
      "3. Menor esfuerzo y menor tiempo de implementacion.",
      "4. Mejor garantia, soporte o estabilidad.",
      "5. Mas flexibilidad para cambiar de decision despues.",
      "",
      "Desventajas y riesgos a revisar:",
      "1. Costos ocultos: instalacion, soporte, renovaciones, penalidades o extras no incluidos.",
      "2. Riesgo alto: peligro, perdida de dinero, dependencia de terceros o baja confiabilidad.",
      "3. Falta de garantia o soporte claro.",
      "4. Condiciones de contrato: permanencia, cancelacion, renovacion automatica y multas.",
      "5. Evidencia faltante: si una opcion no declara algo importante, eso pesa como riesgo.",
      "",
      "Recomendacion: elige la opcion con mayor beneficio claro y menor riesgo serio. Si me das las opciones en texto, te digo la ganadora y por que.",
    ].join("\n");
  }

  if (
    normalized.includes("que hago") ||
    normalized.includes("que deberia") ||
    normalized.includes("me conviene") ||
    normalized.includes("recomienda") ||
    normalized.includes("ayudame")
  ) {
    return [
      "Puedo ayudarte a decidir aunque no subas PDF.",
      "",
      "Voy a mirar:",
      "1. Beneficios: que ganas con cada opcion.",
      "2. Ventajas: por que una opcion es mejor que otra.",
      "3. Desventajas: que pierdes o que limita cada opcion.",
      "4. Riesgos: que puede salir mal.",
      "5. Ganadora: cual conviene y por que.",
      "",
      "Si me das las opciones en texto, te digo cual elegiria y por que.",
    ].join("\n");
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
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [localChatSessionId, setLocalChatSessionId] = useState<string | null>(null);
  const [localSessions, setLocalSessions] = useState<LocalChatSession[]>([]);
  const [authEmail, setAuthEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatColumnRef = useRef<HTMLElement>(null);
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const chatSessionIdRef = useRef<string | null>(null);
  const localChatSessionIdRef = useRef<string | null>(null);
  const persistQueueRef = useRef(Promise.resolve());

  const canSend = useMemo(
    () => question.trim().length > 0 && !isSending,
    [isSending, question],
  );
  const visibleHistory = useMemo(() => {
    const savedChats: HistoryItem[] = localSessions.map((session) => ({
      id: session.id,
      title: session.title,
      preview: session.preview || "Chat guardado localmente.",
      active: session.id === localChatSessionId,
      local: true,
    }));
    const query = normalizeQuestion(historySearch);
    if (!query) {
      return [
        ...savedChats,
        ...CHAT_HISTORY.map((chat) => ({ ...chat, local: false }) satisfies HistoryItem),
      ];
    }
    return [
      ...savedChats,
      ...CHAT_HISTORY.map((chat) => ({ ...chat, local: false }) satisfies HistoryItem),
    ].filter((chat) =>
      normalizeQuestion(`${chat.title} ${chat.preview}`).includes(query),
    );
  }, [historySearch, localChatSessionId, localSessions]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const viewport = messagesViewportRef.current;
      const latestMessage = messages.at(-1);
      if (!viewport || !latestMessage) return;

      const latestElement = viewport.querySelector<HTMLElement>(
        `[data-message-id="${latestMessage.id}"]`,
      );
      const top = latestElement ? Math.max(0, latestElement.offsetTop - 16) : viewport.scrollHeight;
      viewport.scrollTo({
        top: latestMessage.role === "assistant" ? top : viewport.scrollHeight,
        behavior: "smooth",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages]);

  useEffect(() => {
    const chatColumn = chatColumnRef.current;
    if (!chatColumn) return;

    function redirectTrackpadScroll(event: WheelEvent) {
      const viewport = messagesViewportRef.current;
      if (!viewport || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      if (viewport.scrollHeight <= viewport.clientHeight) return;

      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? viewport.clientHeight
          : 1;
      event.preventDefault();
      viewport.scrollTop += event.deltaY * unit;
    }

    chatColumn.addEventListener("wheel", redirectTrackpadScroll, { passive: false });
    return () => chatColumn.removeEventListener("wheel", redirectTrackpadScroll);
  }, []);

  useEffect(() => {
    setLocalSessions(listLocalChatSessions());
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    void supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
      if (!session) {
        setChatSessionId(null);
        chatSessionIdRef.current = null;
      }
    });
    return () => subscription.unsubscribe();
  }, []);

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
    setChatSessionId(null);
    setLocalChatSessionId(null);
    chatSessionIdRef.current = null;
    localChatSessionIdRef.current = null;
  }

  function openLocalChat(sessionId: string) {
    const session = getLocalChatSession(sessionId);
    if (!session) {
      return;
    }
    setMessages(
      session.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        attachments: message.attachments,
        result: message.result as AgentResult | undefined,
      })),
    );
    setFiles([]);
    setError(null);
    setLocalChatSessionId(session.id);
    localChatSessionIdRef.current = session.id;
    setChatSessionId(null);
    chatSessionIdRef.current = null;
  }

  async function copyMessage(message: ChatMessage) {
    await navigator.clipboard?.writeText(message.content);
    setCopiedMessageId(message.id);
    window.setTimeout(() => setCopiedMessageId(null), 1400);
  }

  async function signInWithEmail() {
    if (!supabase || !authEmail.trim()) {
      return;
    }
    setAuthStatus("Enviando enlace...");
    const { error } = await supabase.auth.signInWithOtp({
      email: authEmail.trim(),
      options: {
        emailRedirectTo: window.location.origin + "/chat",
      },
    });
    setAuthStatus(error ? "No pude enviar el enlace de acceso." : "Revisa tu correo para iniciar sesion.");
  }

  async function signOut() {
    if (!supabase) {
      return;
    }
    await supabase.auth.signOut();
    setUserEmail(null);
    setAuthStatus(null);
    setChatSessionId(null);
    chatSessionIdRef.current = null;
  }

  function onQuestionKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function persistMessage(
    role: "user" | "assistant",
    content: string,
    result?: AgentResult,
    attachments?: Array<{ name: string; size: number }>,
  ) {
    const localSessionId = saveLocalChatMessage({
      sessionId: localChatSessionIdRef.current,
      role,
      content,
      attachments,
      result,
    });
    localChatSessionIdRef.current = localSessionId;
    setLocalChatSessionId(localSessionId);
    setLocalSessions(listLocalChatSessions());

    persistQueueRef.current = persistQueueRef.current.then(async () => {
      const sessionId = await saveChatMessage({
        sessionId: chatSessionIdRef.current,
        title: messages[0]?.content ?? content,
        role,
        content,
        result,
      });
      if (sessionId) {
        chatSessionIdRef.current = sessionId;
        setChatSessionId(sessionId);
      }
    });
  }

  function appendUserMessage(content: string, attachedFiles: File[] = []) {
    const attachments = attachedFiles.map((file) => ({ name: file.name, size: file.size }));
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content,
        attachments,
      },
    ]);
    persistMessage("user", content, undefined, attachments);
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
    persistMessage("assistant", content, result);
  }

  async function onConversationClick() {
    if (!canSend) {
      return;
    }

    const cleanQuestion = question.trim();
    const attachedFiles = files;
    appendUserMessage(cleanQuestion, attachedFiles);
    setQuestion("");
    setFiles([]);
    setError(null);

    if (!attachedFiles.length) {
      appendAssistantMessage(conversationalAnswer(cleanQuestion, attachedFiles));
      return;
    }

    setIsSending(true);
    const formData = new FormData();
    formData.set(
      "objective",
      `Conversa sobre todas las propuestas, compara beneficios y desventajas, elige la mejor y explica por que. Pregunta: ${cleanQuestion}`,
    );
    for (const file of attachedFiles) {
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
      const result = fallbackAnswer(cleanQuestion, attachedFiles);
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
    const attachedFiles = files;
    appendUserMessage(cleanQuestion, attachedFiles);
    setQuestion("");
    setFiles([]);
    setIsSending(true);
    setError(null);

    const formData = new FormData();
    formData.set("objective", cleanQuestion);
    formData.set("mode", attachedFiles.length ? "hybrid" : "web");
    for (const file of attachedFiles) {
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
      const result = fallbackAnswer(cleanQuestion, attachedFiles);
      setError("No pude conectar con el investigador. Verifica el backend y la configuración de OpenAI.");
      appendAssistantMessage(result.answer ?? "No pude generar una respuesta.", result);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="relative h-[100dvh] overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgb(216_177_95/0.08),transparent_28%),radial-gradient(circle_at_78%_10%,rgb(139_92_246/0.06),transparent_24%)]" />
      <div className="orbit-engraving opacity-[0.12]" aria-hidden />

      <div className="relative z-10 flex h-full min-h-0">
        <aside className="hidden h-full w-[252px] shrink-0 flex-col border-r border-white/10 bg-[#070707] px-2 py-3 md:flex">
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

          <div className="scrollbar-hidden mt-6 min-h-0 flex-1 overflow-y-auto px-1">
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
                  key={chat.id}
                  type="button"
                  onClick={() => {
                    if (chat.local) {
                      openLocalChat(chat.id);
                    }
                  }}
                  className={`group w-full rounded-lg px-3 py-2 text-left transition-colors ${
                    chat.active ? "bg-[rgb(216_177_95/0.12)]" : "hover:bg-white/8"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className={chat.active ? "text-[var(--accent-cyan)]" : "text-[var(--primary-44)]"} />
                    <p className="truncate text-sm text-white">{chat.title}</p>
                  </div>
                  <p className="mt-1 truncate pl-6 text-xs text-[var(--primary-44)]">
                    {chat.local ? "local · " : ""}
                    {chat.preview}
                  </p>
                </button>
              ))}
              {visibleHistory.length === 0 && (
                <p className="px-3 py-2 text-xs text-[var(--primary-44)]">Sin resultados.</p>
              )}
            </div>
          </div>
        </aside>

        <section ref={chatColumnRef} className="flex h-full min-w-0 flex-1 flex-col">
          <header className="z-20 flex min-h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-black/85 px-4 pt-[env(safe-area-inset-top)] sm:px-6">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              Aristoteles <span className="text-[var(--primary-44)]">chat</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="section-label hidden sm:block">oraculo de evidencia</div>
              {supabase && (
                <div className="hidden items-center gap-2 lg:flex">
                  {userEmail ? (
                    <>
                      <span className="max-w-48 truncate rounded-full border border-white/10 px-3 py-2 text-xs text-[var(--primary-60)]">
                        {userEmail}
                      </span>
                      <button
                        type="button"
                        onClick={signOut}
                        className="min-h-9 rounded-full border border-white/10 px-3 text-xs text-[var(--primary-60)] transition-colors hover:bg-white/10 hover:text-white"
                      >
                        salir
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(event) => setAuthEmail(event.target.value)}
                        className="h-9 w-48 rounded-full border border-white/10 bg-black/30 px-3 text-xs text-white outline-none placeholder:text-[var(--primary-44)] focus:border-[var(--accent-cyan)]"
                        placeholder="email para guardar sesion"
                      />
                      <button
                        type="button"
                        onClick={signInWithEmail}
                        className="min-h-9 rounded-full border border-white/10 px-3 text-xs text-[var(--primary-60)] transition-colors hover:bg-white/10 hover:text-white"
                      >
                        entrar
                      </button>
                    </>
                  )}
                </div>
              )}
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
          {authStatus && (
            <p className="px-4 text-right text-xs text-[var(--accent-cyan)] sm:px-6">{authStatus}</p>
          )}
          {supabase && !userEmail && (
            <div className="flex gap-2 px-3 pb-3 lg:hidden">
              <input
                type="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                className="h-10 min-w-0 flex-1 rounded-full border border-white/10 bg-black/30 px-3 text-xs text-white outline-none placeholder:text-[var(--primary-44)] focus:border-[var(--accent-cyan)]"
                placeholder="email para guardar sesion"
              />
              <button
                type="button"
                onClick={signInWithEmail}
                className="min-h-10 rounded-full border border-white/10 px-3 text-xs text-[var(--primary-60)] transition-colors hover:bg-white/10 hover:text-white"
              >
                entrar
              </button>
            </div>
          )}
          {supabase && userEmail && (
            <div className="flex items-center justify-between gap-2 px-3 pb-3 lg:hidden">
              <span className="min-w-0 truncate rounded-full border border-white/10 px-3 py-2 text-xs text-[var(--primary-60)]">
                {userEmail}
              </span>
              <button
                type="button"
                onClick={signOut}
                className="min-h-10 rounded-full border border-white/10 px-3 text-xs text-[var(--primary-60)] transition-colors hover:bg-white/10 hover:text-white"
              >
                salir
              </button>
            </div>
          )}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
            <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-hidden">
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
                <div
                  ref={messagesViewportRef}
                  className="scrollbar-hidden relative mb-4 min-h-0 flex-1 touch-pan-y space-y-4 overflow-y-auto overscroll-contain pr-1"
                >
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      data-message-id={message.id}
                      className={message.role === "user" ? "ml-auto max-w-2xl" : "mr-auto max-w-3xl"}
                    >
                      <div className={`break-words rounded-2xl border px-4 py-3 text-sm leading-6 ${
                        message.role === "user"
                          ? "border-white/10 bg-white/10 text-white"
                          : "border-[rgb(216_177_95/0.18)] bg-black/30 text-[var(--primary-80)]"
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            {message.role === "assistant" ? (
                              message.result ? (
                                <StructuredResponse content={message.content} result={message.result} />
                              ) : (
                                <MarkdownAnswer content={message.content} />
                              )
                            ) : (
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            )}
                          </div>
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
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
                            {message.attachments.map((attachment) => (
                              <span
                                key={`${message.id}-${attachment.name}`}
                                className="inline-flex max-w-full items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-[var(--primary-60)]"
                              >
                                <FileText size={12} className="shrink-0 text-[var(--accent-cyan)]" />
                                <span className="truncate">{attachment.name}</span>
                                <span className="shrink-0 text-[var(--primary-44)]">
                                  {Math.max(1, Math.round(attachment.size / 1024))} KB
                                </span>
                              </span>
                            ))}
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
                </div>
              )}

              <form onSubmit={onSubmit} className="shrink-0 rounded-[1.75rem] border border-white/10 bg-[#212121] p-3 shadow-[0_18px_80px_rgb(0_0_0/0.35)]">
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
                    onError={setError}
                    onUnsupported={() => {
                      setError("Tu navegador no permite grabar audio. Prueba con Chrome, Edge o Safari.");
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

              {error && <p className="mt-4 shrink-0 text-center text-xs text-amber-200">{error}</p>}
              <p className="mt-4 shrink-0 text-center text-xs text-[var(--primary-44)]">
                Aristoteles puede equivocarse. Verifica siempre las citas antes de decidir.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
