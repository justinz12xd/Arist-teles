import pytest
from pydantic import ValidationError

from aristoteles.contracts import CriteriaConfirmation, Criterion, DecisionResult


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
