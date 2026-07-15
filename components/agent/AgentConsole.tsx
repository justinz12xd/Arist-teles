"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  FileText,
  Loader2,
  Scale,
  SearchCheck,
  Upload,
} from "lucide-react";
import { DecisionRoadmap } from "@/components/decision/DecisionRoadmap";
import type { DecisionRoadmapData } from "@/lib/aristoteles-contracts";

type Stage = {
  id: string;
  agent: string;
  status: "completed" | "needs_review" | "running";
  summary: string;
};

type Criterion = {
  key: string;
  label: string;
  weight: number;
};

type PagePreview = {
  page_number: number;
  document?: string;
  method: string;
  quality_score: number;
  preview: string;
};

type Comparison = {
  provider_id: string;
  advantages: string[];
  disadvantages: string[];
};

type AgentResult = {
  objective: string;
  document: {
    filename: string;
    pages: number;
    quality_score: number;
    previews: PagePreview[];
  };
  stages: Stage[] | Record<string, Stage>;
  criteria: Criterion[];
  research: {
    keywords: string[];
    evidence: Array<{ id: string; document: string; page: number; quote: string }>;
  };
  comparison: Comparison[];
  decision: {
    outcome: "recommendation" | "needs_review";
    recommended_provider_id: string | null;
    summary: string;
    risk_items: string[];
    confidence: {
      score: number;
      band: "high" | "medium" | "low";
      coverage: number;
      citation_support: number;
      consistency: number;
      extraction_quality: number;
    };
    evidence_ids: string[];
  };
  roadmap: DecisionRoadmapData;
};

const STAGE_ICONS = [Brain, FileText, SearchCheck, Scale, CheckCircle2];

function normalizeStages(stages: AgentResult["stages"] | null | undefined): Stage[] | null {
  if (!stages) {
    return null;
  }
  return Array.isArray(stages) ? stages : Object.values(stages);
}

function buildFallbackResult(objective: string, files: File[]): AgentResult {
  const filename = files.map((file) => file.name).join(", ") || "documentos.pdf";
  return {
    objective,
    document: {
      filename,
      pages: files.length || 1,
      quality_score: 0.24,
      previews: [
        {
          page_number: 1,
          method: "browser-demo",
          quality_score: 0.24,
          preview:
            "Modo demo local. Inicia el backend con ARISTOTELES_API_URL para extraer texto real de los PDFs.",
        },
      ],
    },
    stages: [
      {
        id: "planner",
        agent: "Planner Agent",
        status: "completed",
        summary: "Objetivo recibido y criterios iniciales preparados.",
      },
      {
        id: "document",
        agent: "Document Agent",
        status: "needs_review",
        summary: `${files.length || 1} archivo(s) recibido(s); falta backend para extraccion real.`,
      },
      {
        id: "research",
        agent: "Research Agent",
        status: "needs_review",
        summary: "Se requiere extraccion server-side para hechos verificables.",
      },
      {
        id: "comparison",
        agent: "Comparison Agent",
        status: "needs_review",
        summary: "Comparacion bloqueada hasta contar con evidencia extraida.",
      },
      {
        id: "decision",
        agent: "Decision Agent",
        status: "needs_review",
        summary: "No se emite recomendacion sin citas del documento.",
      },
    ],
    criteria: [
      { key: "price", label: "Precio y costos", weight: 0.3 },
      { key: "warranty", label: "Garantia", weight: 0.25 },
      { key: "delivery", label: "Plazo", weight: 0.2 },
      { key: "compliance", label: "Cumplimiento", weight: 0.15 },
      { key: "risk", label: "Riesgo", weight: 0.1 },
    ],
    research: { keywords: ["pdf", "revision", "evidencia"], evidence: [] },
    comparison: [
      { provider_id: "Alternativa A", advantages: [], disadvantages: ["Sin evidencia extraida"] },
      { provider_id: "Alternativa B", advantages: [], disadvantages: ["Sin evidencia extraida"] },
    ],
    decision: {
      outcome: "needs_review",
      recommended_provider_id: null,
      summary: "Subida completada, pero falta conectar el backend para analizar contenido real.",
      risk_items: ["Configurar ARISTOTELES_API_URL y ejecutar FastAPI para extraer los PDFs."],
      confidence: {
        score: 0.24,
        band: "low",
        coverage: 0.2,
        citation_support: 0,
        consistency: 0.25,
        extraction_quality: 0.24,
      },
      evidence_ids: [],
    },
    roadmap: {
      objective,
      criteria: [
        { key: "price", label: "Precio y costos", weight: 0.3 },
        { key: "warranty", label: "Garantía", weight: 0.25 },
        { key: "delivery", label: "Plazo", weight: 0.2 },
        { key: "compliance", label: "Cumplimiento", weight: 0.15 },
        { key: "risk", label: "Riesgo", weight: 0.1 },
      ],
      paths: [
        {
          option_id: "alternative-a",
          label: "Alternativa A",
          status: "review",
          score: 0.24,
          checkpoints: [
            {
              criterion_key: "evidence",
              label: "Evidencia extraída",
              value: null,
              state: "unknown",
              evidence_ids: [],
            },
          ],
          risks: ["El backend todavía no ha extraído evidencia verificable."],
          next_action: "Iniciar FastAPI y volver a analizar el documento.",
        },
        {
          option_id: "alternative-b",
          label: "Alternativa B",
          status: "review",
          score: 0.24,
          checkpoints: [
            {
              criterion_key: "evidence",
              label: "Evidencia extraída",
              value: null,
              state: "unknown",
              evidence_ids: [],
            },
          ],
          risks: ["El backend todavía no ha extraído evidencia verificable."],
          next_action: "Iniciar FastAPI y volver a analizar el documento.",
        },
      ],
      recommended_option_id: null,
      resolution: "No se puede resolver la decisión hasta extraer y citar el contenido del PDF.",
      evidence_count: 0,
    },
  };
}

function StatusPill({ status }: { status: Stage["status"] }) {
  const label = status === "completed" ? "completado" : status === "running" ? "ejecutando" : "revision";
  const color =
    status === "completed"
      ? "border-emerald-300/30 text-emerald-200"
      : status === "running"
        ? "border-cyan-300/30 text-cyan-200"
        : "border-amber-300/30 text-amber-200";
  return <span className={`rounded-full border px-2 py-1 text-[0.65rem] uppercase ${color}`}>{label}</span>;
}

export function AgentConsole() {
  const [objective, setObjective] = useState(
    "Comparar proveedores y recomendar la opcion con mejor respaldo documental.",
  );
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const canRun = useMemo(() => objective.trim().length > 0 && files.length > 0 && !isRunning, [files, isRunning, objective]);
  const visibleStages = normalizeStages(result?.stages);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []));
    setResult(null);
    setError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!files.length || !objective.trim()) {
      return;
    }

    setIsRunning(true);
    setError(null);

    const formData = new FormData();
    formData.set("objective", objective.trim());
    for (const file of files) {
      formData.append("files", file);
    }

    try {
      const response = await fetch("/api/agent-demo", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Demo backend unavailable");
      }
      setResult((await response.json()) as AgentResult);
    } catch {
      setResult(buildFallbackResult(objective.trim(), files));
      setError("Usando modo demo local. Inicia el backend para extraer texto real de los PDFs.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="relative mx-auto max-w-7xl px-6 py-24">
      <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr]">
        <section className="glass p-6 lg:sticky lg:top-24 lg:self-start">
          <p className="section-label">[ consola de agentes ]</p>
          <h1 className="mt-4 max-w-xl text-4xl font-medium leading-tight text-white md:text-5xl">
            Ejecuta un analisis con PDFs.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--primary-60)]">
            Sube uno o varios PDFs, define el objetivo y corre el flujo Planner, Document,
            Research, Comparison y Decision.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="section-label">objetivo</span>
              <textarea
                value={objective}
                onChange={(event) => setObjective(event.target.value)}
                className="mt-2 min-h-32 w-full resize-none rounded-lg border border-[var(--primary-12)] bg-black/40 p-4 text-sm leading-6 text-white outline-none transition focus:border-[var(--accent-cyan)]"
                maxLength={1200}
              />
            </label>

            <label className="block rounded-lg border border-dashed border-[rgb(34_211_238/0.35)] bg-[rgb(34_211_238/0.05)] p-5 transition hover:bg-[rgb(34_211_238/0.08)]">
              <span className="flex items-center gap-3 text-sm font-medium text-white">
                <Upload size={18} className="text-[var(--accent-cyan)]" />
                {files.length ? `${files.length} PDF seleccionado(s)` : "Subir PDFs"}
              </span>
              <span className="mt-2 block text-xs text-[var(--primary-44)]">
                PDFs nativos recomendados para extraer texto con mayor calidad.
              </span>
              <input type="file" accept="application/pdf,.pdf" multiple className="sr-only" onChange={onFileChange} />
            </label>

            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((file) => (
                  <span key={`${file.name}-${file.size}`} className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--primary-60)]">
                    {file.name}
                  </span>
                ))}
              </div>
            )}

            {error && (
              <div className="flex gap-3 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!canRun}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:shadow-[0_0_24px_rgb(34_211_238/0.35)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isRunning ? <Loader2 size={17} className="animate-spin" /> : <Brain size={17} />}
              Ejecutar agentes
            </button>
          </form>
        </section>

        <section className="space-y-6">
          <div className="crt overflow-hidden rounded-2xl p-5">
            <div className="crt-content">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="section-label">pipeline</p>
                <span className="text-xs text-[var(--primary-44)]">
                  {result ? result.document.filename : "esperando PDFs"}
                </span>
              </div>
              <div className="mt-5 grid gap-3">
                {(visibleStages ?? [
                  "Planner Agent",
                  "Document Agent",
                  "Research Agent",
                  "Comparison Agent",
                  "Decision Agent",
                ].map((agent, index) => ({
                  id: agent,
                  agent,
                  status: index === 0 && isRunning ? "running" : "needs_review",
                  summary: "Pendiente de ejecucion.",
                } as Stage))).map((stage, index) => {
                  const Icon = STAGE_ICONS[index] ?? Brain;
                  return (
                    <div
                      key={stage.id}
                      className="grid gap-3 rounded-lg border border-[var(--primary-4)] bg-black/25 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                    >
                      <Icon size={18} className="text-[var(--accent-cyan)]" />
                      <div>
                        <h2 className="text-sm font-medium text-white">{stage.agent}</h2>
                        <p className="mt-1 text-xs leading-5 text-[var(--primary-60)]">{stage.summary}</p>
                      </div>
                      <StatusPill status={stage.status} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {result && (
            <>
              <div className="grid gap-6 xl:grid-cols-2">
                <article className="glass p-5">
                  <p className="section-label">documentos</p>
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-medium text-white">{result.document.pages} paginas</h2>
                      <p className="mt-1 text-sm text-[var(--primary-60)]">
                        Calidad {Math.round(result.document.quality_score * 100)}%
                      </p>
                    </div>
                    <FileText className="text-[var(--accent-cyan)]" size={24} />
                  </div>
                  <div className="mt-5 space-y-3">
                    {result.document.previews.slice(0, 4).map((page, index) => (
                      <div key={`${page.document ?? "document"}-${page.page_number}-${index}`} className="rounded-lg border border-[var(--primary-4)] p-3">
                        <div className="flex justify-between gap-3 text-xs text-[var(--primary-44)]">
                          <span>{page.document ? `${page.document} · ` : ""}pagina {page.page_number}</span>
                          <span>{page.method}</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--primary-80)]">{page.preview}</p>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="glass p-5">
                  <p className="section-label">decision</p>
                  <h2 className="mt-4 text-2xl font-medium text-white">
                    {result.decision.recommended_provider_id ?? "Revision requerida"}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--primary-60)]">{result.decision.summary}</p>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-[var(--accent-cyan)]"
                      style={{ width: `${Math.round(result.decision.confidence.score * 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs uppercase text-[var(--primary-44)]">
                    confianza {result.decision.confidence.band} ·{" "}
                    {Math.round(result.decision.confidence.score * 100)}%
                  </p>
                </article>
              </div>

              <div className="glass p-5">
                <p className="section-label">criterios y comparacion</p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    {result.criteria.map((criterion) => (
                      <div key={criterion.key} className="flex items-center justify-between rounded-lg bg-white/[0.03] p-3">
                        <span className="text-sm text-white">{criterion.label}</span>
                        <span className="font-mono text-xs text-[var(--accent-cyan)]">
                          {Math.round(criterion.weight * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {result.comparison.map((item) => (
                      <div key={item.provider_id} className="rounded-lg border border-[var(--primary-4)] p-3">
                        <h3 className="text-sm font-medium text-white">{item.provider_id}</h3>
                        <p className="mt-2 text-xs leading-5 text-[var(--primary-60)]">
                          {[...item.advantages, ...item.disadvantages].join(" · ") || "Sin diferencias detectadas"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DecisionRoadmap roadmap={result.roadmap} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
