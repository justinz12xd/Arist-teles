import pytest
from pydantic import ValidationError

from aristoteles.contracts import (
    ConfidenceBreakdown,
    CriteriaConfirmation,
    Criterion,
    DecisionResult,
    ProviderComparison,
)
from aristoteles.scoring import enforce_decision


def test_criteria_weights_must_sum_to_one() -> None:
    payload = CriteriaConfirmation(
        criteria=[
            Criterion(key="price", label="Precio", weight=0.4),
            Criterion(key="warranty", label="Garantía", weight=0.6),
        ]
    )
    assert sum(item.weight for item in payload.criteria) == pytest.approx(1.0)


def test_invalid_weights_are_rejected() -> None:
    with pytest.raises(ValidationError, match="sum to 1.0"):
        CriteriaConfirmation(criteria=[Criterion(key="price", label="Precio", weight=0.4)])


def test_decision_can_request_review_without_provider() -> None:
    result = DecisionResult(
        outcome="needs_review",
        summary="Falta la garantía del proveedor B.",
        confidence={
            "score": 0.4,
            "band": "low",
            "coverage": 0.4,
            "citation_support": 0.5,
            "consistency": 0.5,
            "extraction_quality": 0.8,
        },
    )
    assert result.recommended_provider_id is None


def test_recommendation_without_provider_is_rejected_even_when_field_is_omitted() -> None:
    with pytest.raises(ValidationError, match="requires a provider"):
        DecisionResult(
            outcome="recommendation",
            summary="Recomendación incompleta",
            confidence={
                "score": 1,
                "band": "high",
                "coverage": 1,
                "citation_support": 1,
                "consistency": 1,
                "extraction_quality": 1,
            },
        )


def test_needs_review_forbids_a_recommended_provider() -> None:
    with pytest.raises(ValidationError, match="must not include a provider"):
        DecisionResult(
            outcome="needs_review",
            recommended_provider_id="A",
            summary="Requiere revisión",
            confidence={
                "score": 0.4,
                "band": "low",
                "coverage": 0.4,
                "citation_support": 0.4,
                "consistency": 0.4,
                "extraction_quality": 0.4,
            },
        )


def test_provider_comparison_rejects_blank_provider_id() -> None:
    with pytest.raises(ValidationError):
        ProviderComparison(provider_id="   ")


def test_enforced_decision_is_revalidated_instead_of_model_copied() -> None:
    invalid = DecisionResult.model_construct(
        outcome="needs_review",
        recommended_provider_id=None,
        summary="",
        risk_items=[],
        confidence=ConfidenceBreakdown(
            score=0,
            band="low",
            coverage=0,
            citation_support=0,
            consistency=0,
            extraction_quality=0,
        ),
        evidence_ids=[],
    )

    with pytest.raises(ValidationError):
        enforce_decision(
            invalid,
            comparisons=[],
            criteria=[{"key": "price", "weight": 1}],
            evidence=[],
            pages=[],
        )
