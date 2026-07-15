from collections.abc import Iterable, Mapping
from typing import Any

from .contracts import (
    Criterion,
    DecisionPath,
    DecisionResult,
    DecisionRoadmap,
    ProviderComparison,
    RoadmapCheckpoint,
)


def _checkpoint_state(score: float | None, missing: bool) -> str:
    if missing or score is None:
        return "unknown"
    if score >= 0.75:
        return "supports"
    if score >= 0.5:
        return "caution"
    return "blocks"


def _path_status(comparison: ProviderComparison, decision: DecisionResult) -> str:
    if comparison.provider_id == decision.recommended_provider_id:
        return "recommended"
    if comparison.contradictions or any(item.missing for item in comparison.criteria):
        return "review"
    return "alternative"


def _next_action(status: str) -> str:
    if status == "recommended":
        return "Validar los términos finales y someter la opción a aprobación humana."
    if status == "review":
        return "Completar la evidencia faltante o resolver contradicciones antes de elegir."
    return "Mantener como alternativa si cambian las prioridades o restricciones."


def _criterion_models(criteria: Iterable[Mapping[str, Any]]) -> list[Criterion]:
    return [
        Criterion.model_validate(
            {"key": item["key"], "label": item["label"], "weight": item["weight"]}
        )
        for item in criteria
    ]


def build_decision_roadmap(
    *,
    objective: str,
    criteria: Iterable[Mapping[str, Any]],
    comparisons: list[ProviderComparison],
    decision: DecisionResult,
) -> DecisionRoadmap:
    """Build an auditable visual roadmap from validated comparison data."""

    criterion_models = _criterion_models(criteria)
    weights = {item.key: item.weight for item in criterion_models}
    labels = {item.key: item.label for item in criterion_models}
    evidence_ids = set(decision.evidence_ids)
    paths: list[DecisionPath] = []

    for comparison in comparisons:
        checkpoints: list[RoadmapCheckpoint] = []
        weighted_score = 0.0

        for item in comparison.criteria:
            evidence_ids.update(item.evidence_ids)
            if item.normalized_score is not None and not item.missing:
                weighted_score += item.normalized_score * weights.get(item.key, 0)
            checkpoints.append(
                RoadmapCheckpoint(
                    criterion_key=item.key,
                    label=labels.get(item.key, item.key.replace("_", " ").title()),
                    value=item.value,
                    state=_checkpoint_state(item.normalized_score, item.missing),
                    evidence_ids=item.evidence_ids,
                )
            )

        path_status = _path_status(comparison, decision)
        paths.append(
            DecisionPath(
                option_id=comparison.provider_id,
                label=comparison.provider_id,
                status=path_status,
                score=round(min(max(weighted_score, 0), 1), 4),
                checkpoints=checkpoints,
                risks=[*comparison.disadvantages, *comparison.contradictions],
                next_action=_next_action(path_status),
            )
        )

    return DecisionRoadmap(
        objective=objective,
        criteria=criterion_models,
        paths=paths,
        recommended_option_id=decision.recommended_provider_id,
        resolution=decision.summary,
        evidence_count=len(evidence_ids),
    )
