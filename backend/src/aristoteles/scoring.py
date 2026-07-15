import math
from typing import Any

from .contracts import (
    ConfidenceBreakdown,
    DecisionResult,
    EvidenceRef,
    ProviderComparison,
)


def _criterion_weights(criteria: list[dict[str, Any]]) -> dict[str, float]:
    weights: dict[str, float] = {}
    for item in criteria:
        key = str(item["key"])
        if key in weights:
            raise ValueError("Criterion keys must be unique")
        weight = float(item.get("weight", 0))
        if not math.isfinite(weight) or not 0 <= weight <= 1:
            raise ValueError("Criterion weights must be between 0 and 1")
        weights[key] = weight
    if abs(sum(weights.values()) - 1.0) > 0.0001:
        raise ValueError("Criterion weights must sum to 1.0")
    return weights


def score_comparisons(
    comparisons: list[ProviderComparison],
    criteria: list[dict[str, Any]],
    valid_evidence_ids: set[str],
) -> list[ProviderComparison]:
    """Validate citations and calculate weights outside the model."""
    weights = _criterion_weights(criteria)
    scored: list[ProviderComparison] = []
    for comparison in comparisons:
        normalized_criteria = []
        total = 0.0
        seen_keys: set[str] = set()
        for item in comparison.criteria:
            if item.key in seen_keys:
                continue
            seen_keys.add(item.key)
            evidence_ids = [value for value in item.evidence_ids if value in valid_evidence_ids]
            usable = (
                item.key in weights
                and item.normalized_score is not None
                and bool(evidence_ids)
                and not item.missing
            )
            if usable:
                total += float(item.normalized_score) * weights[item.key]
                normalized_criteria.append(item.model_copy(update={"evidence_ids": evidence_ids}))
            else:
                normalized_criteria.append(
                    item.model_copy(
                        update={
                            "normalized_score": None,
                            "evidence_ids": [],
                            "missing": True,
                        }
                    )
                )
        scored.append(
            comparison.model_copy(
                update={
                    "criteria": normalized_criteria,
                    "weighted_score": min(max(round(total, 6), 0.0), 1.0),
                }
            )
        )
    return scored


def _confidence(
    comparison: ProviderComparison | None,
    *,
    criteria: list[dict[str, Any]],
    evidence: list[EvidenceRef],
    pages: list[dict[str, Any]],
) -> tuple[ConfidenceBreakdown, list[str]]:
    weights = _criterion_weights(criteria)
    total_weight = sum(weights.values()) or 1.0
    supported = [] if comparison is None else [
        item
        for item in comparison.criteria
        if not item.missing and item.normalized_score is not None and item.evidence_ids
    ]
    coverage = min(sum(weights.get(item.key, 0) for item in supported) / total_weight, 1.0)
    citation_support = min(len(supported) / max(len(weights), 1), 1.0)
    contradiction_count = len(comparison.contradictions) if comparison else 0
    consistency = max(0.0, 1.0 - contradiction_count / max(len(weights), 1))

    evidence_pairs = {(item.document_id, item.page) for item in evidence}
    qualities = [
        float(page.get("quality_score", 0))
        for page in pages
        if (str(page.get("document_id")), int(page.get("page_number", 0))) in evidence_pairs
    ]
    extraction_quality = sum(qualities) / len(qualities) if qualities else 0.0
    score = (
        0.35 * coverage
        + 0.30 * citation_support
        + 0.20 * consistency
        + 0.15 * extraction_quality
    )
    band = "high" if score >= 0.8 else "medium" if score >= 0.6 else "low"
    selected_ids = sorted({value for item in supported for value in item.evidence_ids})
    return (
        ConfidenceBreakdown(
            score=round(score, 6),
            band=band,
            coverage=round(coverage, 6),
            citation_support=round(citation_support, 6),
            consistency=round(consistency, 6),
            extraction_quality=round(extraction_quality, 6),
        ),
        selected_ids,
    )


def _unique_best_comparison(
    comparisons: list[ProviderComparison],
) -> tuple[ProviderComparison | None, bool]:
    if not comparisons:
        return None, True
    best = max(comparisons, key=lambda item: item.weighted_score)
    tied = [
        item
        for item in comparisons
        if math.isclose(item.weighted_score, best.weighted_score, abs_tol=1e-9)
    ]
    return best, len(tied) == 1


def enforce_decision(
    model_decision: DecisionResult,
    *,
    comparisons: list[ProviderComparison],
    criteria: list[dict[str, Any]],
    evidence: list[EvidenceRef],
    pages: list[dict[str, Any]],
    min_confidence: float = 0.6,
) -> DecisionResult:
    """Replace model-selected identity, evidence and confidence with verified values."""
    best, has_unique_winner = _unique_best_comparison(comparisons)
    confidence, evidence_ids = _confidence(
        best, criteria=criteria, evidence=evidence, pages=pages
    )
    valid_ids = {item.id for item in evidence if item.id}
    evidence_ids = [value for value in evidence_ids if value in valid_ids]
    can_recommend = (
        model_decision.outcome == "recommendation"
        and best is not None
        and has_unique_winner
        and bool(evidence_ids)
        and confidence.coverage >= 0.5
        and confidence.score >= min_confidence
    )
    risks = list(model_decision.risk_items)
    if best is not None and not has_unique_winner:
        risks.append(
            "Existe un empate en la mejor puntuación; se requiere revisión humana."
        )
    if not evidence_ids:
        risks.append("No existe evidencia persistida suficiente para respaldar una recomendación.")
    if confidence.coverage < 0.5:
        risks.append("La evidencia cubre menos de la mitad del peso de los criterios.")

    payload = model_decision.model_dump(mode="python")
    payload.update(
        {
            "outcome": "recommendation" if can_recommend else "needs_review",
            "recommended_provider_id": best.provider_id if can_recommend and best else None,
            "confidence": confidence,
            "evidence_ids": evidence_ids if can_recommend else [],
            "risk_items": list(dict.fromkeys(risks)),
        }
    )
    return DecisionResult.model_validate(payload)
