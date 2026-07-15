"use client";

import { DecisionRoadmap } from "@/components/decision/DecisionRoadmap";
import { MarkdownAnswer } from "@/components/chat/MarkdownAnswer";
import type { AgentResult } from "@/lib/chat-types";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  GitBranch,
  ListChecks,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

type Section = { id: string; title: string; content: string };

function parseSections(markdown: string): Section[] {
  const matches = [...markdown.matchAll(/^##\s+(.+)$/gm)];
  if (!matches.length) return [{ id: "answer", title: "Respuesta", content: markdown }];
  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? markdown.length;
    const title = match[1].trim();
    return {
      id: `section-${index}`,
      title,
      content: markdown.slice(start, end).trim(),
    };
  });
}

const stageLabel: Record<string, string> = {
  router: "Solicitud comprendida",
  research: "Fuentes investigadas",
  citations: "Evidencia enlazada",
};

export function StructuredResponse({ content, result }: { content: string; result: AgentResult }) {
  const sections = useMemo(() => parseSections(content), [content]);
  const tabs = [
    ...sections.map((section, index) => ({
      id: section.id,
      label: section.title,
      icon: index === 0 ? BookOpen : ListChecks,
    })),
    ...(result.roadmap ? [{ id: "roadmap", label: "Mejor ruta", icon: GitBranch }] : []),
    { id: "evidence", label: `Fuentes (${result.citations?.length ?? 0})`, icon: Search },
    { id: "process", label: "Proceso", icon: CheckCircle2 },
  ];
  const [activeTab, setActiveTab] = useState(result.roadmap ? "roadmap" : tabs[0].id);
  const pageSize = 4;
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.id === activeTab));
  const activePage = Math.floor(activeIndex / pageSize);
  const pageCount = Math.ceil(tabs.length / pageSize);
  const visibleTabs = tabs.slice(activePage * pageSize, (activePage + 1) * pageSize);
  const activeSection = sections.find((section) => section.id === activeTab);

  function openPage(page: number) {
    const firstTab = tabs[page * pageSize];
    if (firstTab) setActiveTab(firstTab.id);
  }

  return (
    <div className="min-w-0">
      {pageCount > 1 && (
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--primary-44)]">
            Paso de lectura {activePage + 1} de {pageCount}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => openPage(activePage - 1)}
              disabled={activePage === 0}
              className="flex size-7 items-center justify-center rounded-md border border-white/10 text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
              aria-label="Ver paso de lectura anterior"
            >
              <ChevronLeft size={14} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => openPage(activePage + 1)}
              disabled={activePage === pageCount - 1}
              className="flex size-7 items-center justify-center rounded-md border border-white/10 text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
              aria-label="Ver siguiente paso de lectura"
            >
              <ChevronRight size={14} aria-hidden />
            </button>
          </div>
        </div>
      )}

      <div
        role="tablist"
        aria-label="Secciones de la respuesta"
        className="mb-4 grid max-w-full grid-cols-2 gap-1 border-b border-white/10 pb-2 sm:flex"
      >
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors sm:shrink-0 ${
                selected
                  ? "bg-[rgb(216_177_95/0.14)] text-[var(--accent-gold)]"
                  : "text-[var(--primary-44)] hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <Icon size={13} className="shrink-0" aria-hidden />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {activeSection && <MarkdownAnswer content={activeSection.content} />}

        {activeTab === "process" && (
          <ol className="space-y-2">
            {(result.stages ?? ["router", "research", "citations"]).map((stage, index) => (
              <li key={`${stage}-${index}`} className="flex items-center gap-3 rounded-lg bg-white/[0.035] px-3 py-2.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[rgb(216_177_95/0.13)] font-mono text-[10px] text-[var(--accent-gold)]">
                  {index + 1}
                </span>
                <span className="text-sm text-[var(--primary-80)]">{stageLabel[stage] ?? stage}</span>
                <CheckCircle2 size={14} className="ml-auto text-emerald-300" aria-label="Completado" />
              </li>
            ))}
          </ol>
        )}

        {activeTab === "evidence" && (
          <div className="space-y-2">
            {result.citations?.map((citation, index) => (
              <a
                key={citation.id}
                href={citation.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-3 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 transition-colors hover:border-[rgb(216_177_95/0.35)]"
              >
                <span className="font-mono text-[10px] text-[var(--accent-gold)]">{String(index + 1).padStart(2, "0")}</span>
                <span className="text-xs leading-5 text-[var(--primary-60)]">{citation.title}</span>
              </a>
            ))}
            {result.research?.evidence.map((evidence) => (
              <div key={evidence.id} className="flex gap-3 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
                <FileText size={14} className="mt-0.5 shrink-0 text-[var(--accent-gold)]" aria-hidden />
                <div>
                  <p className="text-xs text-white/70">{evidence.document} · página {evidence.page}</p>
                  <p className="mt-1 text-xs leading-5 text-white/45">{evidence.quote}</p>
                </div>
              </div>
            ))}
            {!result.citations?.length && !result.research?.evidence.length && (
              <p className="py-5 text-center text-sm text-[var(--primary-44)]">No se localizaron fuentes verificables.</p>
            )}
          </div>
        )}

        {activeTab === "roadmap" && result.roadmap && <DecisionRoadmap roadmap={result.roadmap} />}
      </div>

      {activePage < pageCount - 1 && (
        <button
          type="button"
          onClick={() => openPage(activePage + 1)}
          className="mt-5 flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5 text-left transition-colors hover:border-[rgb(216_177_95/0.3)] hover:bg-[rgb(216_177_95/0.05)]"
        >
          <span>
            <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--primary-44)]">
              Continuar
            </span>
            <span className="mt-0.5 block text-xs text-[var(--primary-80)]">
              Paso de lectura {activePage + 2} de {pageCount}
            </span>
          </span>
          <ChevronRight size={15} className="text-[var(--accent-gold)]" aria-hidden />
        </button>
      )}
    </div>
  );
}
