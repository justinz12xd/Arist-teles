import {
  AlertTriangle,
  Check,
  CheckCircle2,
  CircleAlert,
  FileSearch,
  GitBranch,
  HelpCircle,
  XCircle,
} from "lucide-react";
import type {
  DecisionPathStatus,
  DecisionRoadmapData,
  RoadmapCheckpointState,
} from "@/lib/aristoteles-contracts";

const checkpointStyle: Record<
  RoadmapCheckpointState,
  { icon: typeof CheckCircle2; label: string; className: string }
> = {
  supports: {
    icon: CheckCircle2,
    label: "Respalda",
    className: "text-emerald-300",
  },
  caution: {
    icon: CircleAlert,
    label: "Atención",
    className: "text-amber-300",
  },
  blocks: {
    icon: XCircle,
    label: "Desfavorece",
    className: "text-rose-300",
  },
  unknown: {
    icon: HelpCircle,
    label: "Sin evidencia",
    className: "text-white/45",
  },
};

const pathStyle: Record<
  DecisionPathStatus,
  { label: string; className: string; badgeClassName: string }
> = {
  recommended: {
    label: "Ruta sugerida",
    className: "border-[rgb(216_177_95/0.5)] bg-[rgb(216_177_95/0.06)]",
    badgeClassName: "bg-[rgb(216_177_95/0.14)] text-[var(--accent-gold)]",
  },
  alternative: {
    label: "Alternativa",
    className: "border-white/10 bg-white/[0.025]",
    badgeClassName: "bg-white/[0.07] text-white/60",
  },
  review: {
    label: "Requiere revisión",
    className: "border-amber-400/20 bg-amber-400/[0.025]",
    badgeClassName: "bg-amber-400/10 text-amber-200",
  },
};

interface DecisionRoadmapProps {
  roadmap: DecisionRoadmapData;
}

export function DecisionRoadmap({ roadmap }: DecisionRoadmapProps) {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111] shadow-[0_18px_70px_rgb(0_0_0/0.28)]"
      aria-label={`Mapa de decisión: ${roadmap.objective}`}
    >
      <div className="border-b border-white/8 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--accent-gold)]">
              <GitBranch size={14} aria-hidden />
              Mapa de decisión
            </div>
            <h2 className="text-base font-medium text-white sm:text-lg">
              {roadmap.objective}
            </h2>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/8 bg-black/30 px-3 py-1.5 text-xs text-white/50">
            <FileSearch size={13} aria-hidden />
            {roadmap.evidence_count} evidencias
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" aria-label="Criterios confirmados">
          {roadmap.criteria.map((criterion) => (
            <span
              key={criterion.key}
              className="rounded-full border border-white/8 bg-white/[0.035] px-2.5 py-1 text-[11px] text-white/55"
            >
              {criterion.label} · {Math.round(criterion.weight * 100)}%
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto px-4 pb-5 pt-4 sm:px-5">
        <div className="relative min-w-[720px]">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black px-3 py-1.5 text-xs text-white/60">
            <GitBranch size={13} className="text-[var(--accent-gold)]" aria-hidden />
            Opciones verificadas
          </div>

          <div className="relative mt-3">
            <div className="absolute left-[8%] right-[8%] top-0 border-t border-white/10" aria-hidden />
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${roadmap.paths.length}, minmax(220px, 1fr))` }}
            >
              {roadmap.paths.map((path) => {
                const status = pathStyle[path.status];

                return (
                  <article key={path.option_id} className="relative pt-5">
                    <div className="absolute left-1/2 top-0 h-5 border-l border-white/10" aria-hidden />
                    <div className={`h-full rounded-xl border p-3.5 ${status.className}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${status.badgeClassName}`}>
                            {status.label}
                          </span>
                          <h3 className="mt-2.5 text-sm font-medium text-white">{path.label}</h3>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-lg text-white">{Math.round(path.score * 100)}</p>
                          <p className="text-[9px] uppercase tracking-wider text-white/35">puntos</p>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        {path.checkpoints.map((checkpoint) => {
                          const state = checkpointStyle[checkpoint.state];
                          const StateIcon = state.icon;

                          return (
                            <div key={checkpoint.criterion_key} className="rounded-lg border border-white/[0.06] bg-black/25 p-2.5">
                              <div className="flex items-start gap-2">
                                <StateIcon size={14} className={`mt-0.5 shrink-0 ${state.className}`} aria-hidden />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-baseline justify-between gap-2">
                                    <p className="truncate text-[11px] text-white/55">{checkpoint.label}</p>
                                    <span className={`shrink-0 text-[9px] ${state.className}`}>{state.label}</span>
                                  </div>
                                  <p className="mt-0.5 truncate text-xs text-white/85">
                                    {checkpoint.value ?? "Dato no localizado"}
                                  </p>
                                  {checkpoint.evidence_ids.length > 0 && (
                                    <p className="mt-1 text-[9px] text-white/30">
                                      {checkpoint.evidence_ids.length} {checkpoint.evidence_ids.length === 1 ? "cita" : "citas"}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {path.risks.length > 0 && (
                        <div className="mt-3 flex gap-2 text-[11px] leading-4 text-amber-100/65">
                          <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden />
                          <p>{path.risks[0]}</p>
                        </div>
                      )}

                      <div className="mt-3 border-t border-white/[0.07] pt-3">
                        <p className="text-[9px] uppercase tracking-[0.12em] text-white/30">Siguiente paso</p>
                        <p className="mt-1 text-[11px] leading-4 text-white/55">{path.next_action}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/8 bg-[rgb(216_177_95/0.045)] px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-gold)] text-black">
            <Check size={14} strokeWidth={2.5} aria-hidden />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--accent-gold)]">
              Resolución propuesta · control humano
            </p>
            <p className="mt-1 text-xs leading-5 text-white/70">{roadmap.resolution}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
