import hashlib

import pytest

from aristoteles.contracts import (
    ComparisonCriterion,
    DecisionResult,
    EvidenceRef,
    ProviderComparison,
)
from aristoteles.evidence import validate_evidence
from aristoteles.scoring import enforce_decision, score_comparisons


def _candidate(*, quote: str, source_hash: str) -> EvidenceRef:
    return EvidenceRef(
        claim="Proveedor A ofrece 24 meses de garantía",
        document_id="doc-1",
        page=1,
        chunk_id="chunk-1",
        quote=quote,
        source_hash=source_hash,
    )


def test_research_evidence_must_match_retrieved_chunk_and_page() -> None:
    content = "Proveedor A ofrece 24 meses de garantía y entrega inmediata."
    digest = hashlib.sha256(content.encode()).hexdigest()
    retrieved = [
        {
            "id": "chunk-1",
            "document_id": "doc-1",
            "page_id": "page-1",
            "content": content,
        }
    ]
    pages = [{"id": "page-1", "document_id": "doc-1", "page_number": 1}]

    valid = validate_evidence(
        [_candidate(quote="24 meses de garantía", source_hash=digest)],
        retrieved=retrieved,
        pages=pages,
    )
    invalid = validate_evidence(
        [_candidate(quote="garantía de 60 meses", source_hash=digest)],
        retrieved=retrieved,
        pages=pages,
    )

    assert len(valid) == 1
    assert invalid == []


def test_weights_and_confidence_are_deterministic_not_model_controlled() -> None:
    comparisons = [
        ProviderComparison(
            provider_id="A",
            criteria=[
                ComparisonCriterion(
                    key="price", normalized_score=0.8, evidence_ids=["ev-1"]
                ),
                ComparisonCriterion(
                    key="warranty", normalized_score=1.0, evidence_ids=["ev-2"]
                ),
            ],
        ),
        ProviderComparison(
            provider_id="B",
            criteria=[
                ComparisonCriterion(
                    key="price", normalized_score=1.0, evidence_ids=["ev-1"]
                ),
                ComparisonCriterion(
                    key="warranty", normalized_score=0.2, evidence_ids=["ev-2"]
                ),
            ],
        ),
    ]
    criteria = [
        {"key": "price", "weight": 0.25},
        {"key": "warranty", "weight": 0.75},
    ]
    scored = score_comparisons(comparisons, criteria, {"ev-1", "ev-2"})
    model_decision = DecisionResult(
        outcome="recommendation",
        recommended_provider_id="B",
        summary="El modelo eligió B.",
        confidence={
            "score": 0.99,
            "band": "high",
            "coverage": 0.99,
            "citation_support": 0.99,
            "consistency": 0.99,
            "extraction_quality": 0.99,
        },
        evidence_ids=["invented"],
    )
    evidence = [
        EvidenceRef(
            id="ev-1",
            claim="Precio",
            document_id="doc-1",
            page=1,
            chunk_id="chunk-1",
            quote="Precio 10",
            source_hash="hash-1",
        ),
        EvidenceRef(
            id="ev-2",
            claim="Garantía",
            document_id="doc-1",
            page=1,
            chunk_id="chunk-1",
            quote="Garantía 24 meses",
            source_hash="hash-1",
        ),
    ]

    decision = enforce_decision(
        model_decision,
        comparisons=scored,
        criteria=criteria,
        evidence=evidence,
        pages=[{"id": "page-1", "document_id": "doc-1", "page_number": 1, "quality_score": 0.8}],
    )

    assert scored[0].weighted_score == pytest.approx(0.95)
    assert scored[1].weighted_score == pytest.approx(0.4)
    assert decision.recommended_provider_id == "A"
    assert decision.evidence_ids == ["ev-1", "ev-2"]
    assert decision.confidence.score != 0.99


def test_decision_without_persisted_evidence_requires_review() -> None:
    model_decision = DecisionResult(
        outcome="recommendation",
        recommended_provider_id="A",
        summary="A",
        confidence={
            "score": 1,
            "band": "high",
            "coverage": 1,
            "citation_support": 1,
            "consistency": 1,
            "extraction_quality": 1,
        },
    )

    decision = enforce_decision(
        model_decision,
        comparisons=[ProviderComparison(provider_id="A", weighted_score=1)],
        criteria=[{"key": "price", "weight": 1}],
        evidence=[],
        pages=[],
    )

    assert decision.outcome == "needs_review"
    assert decision.recommended_provider_id is None
    assert decision.confidence.band == "low"


def test_tied_top_score_requires_review_instead_of_order_based_winner() -> None:
    criteria = [{"key": "price", "weight": 1}]
    scored = score_comparisons(
        [
            ProviderComparison(
                provider_id="B",
                criteria=[
                    ComparisonCriterion(
                        key="price", normalized_score=1, evidence_ids=["ev-1"]
                    )
                ],
            ),
            ProviderComparison(
                provider_id="A",
                criteria=[
                    ComparisonCriterion(
                        key="price", normalized_score=1, evidence_ids=["ev-1"]
                    )
                ],
            ),
        ],
        criteria,
        {"ev-1"},
    )
    evidence = [
        EvidenceRef(
            id="ev-1",
            claim="Precio",
            document_id="doc-1",
            page=1,
            chunk_id="chunk-1",
            quote="Precio 10",
            source_hash="hash",
        )
    ]

    decision = enforce_decision(
        DecisionResult(
            outcome="recommendation",
            recommended_provider_id="B",
            summary="B",
            confidence={
                "score": 1,
                "band": "high",
                "coverage": 1,
                "citation_support": 1,
                "consistency": 1,
                "extraction_quality": 1,
            },
        ),
        comparisons=scored,
        criteria=criteria,
        evidence=evidence,
        pages=[
            {
                "document_id": "doc-1",
                "page_number": 1,
                "quality_score": 1,
            }
        ],
    )

    assert decision.outcome == "needs_review"
    assert decision.recommended_provider_id is None
    assert "empate" in " ".join(decision.risk_items).lower()


def test_duplicate_comparison_criteria_do_not_inflate_score_or_confidence() -> None:
    duplicate = ComparisonCriterion(
        key="price", normalized_score=1, evidence_ids=["ev-1"]
    )
    comparisons = score_comparisons(
        [ProviderComparison(provider_id="A", criteria=[duplicate, duplicate])],
        [{"key": "price", "weight": 1}],
        {"ev-1"},
    )
    evidence = [
        EvidenceRef(
            id="ev-1",
            claim="Precio",
            document_id="doc-1",
            page=1,
            chunk_id="chunk-1",
            quote="Precio 10",
            source_hash="hash",
        )
    ]
    decision = enforce_decision(
        DecisionResult(
            outcome="recommendation",
            recommended_provider_id="A",
            summary="A",
            confidence={
                "score": 0,
                "band": "low",
                "coverage": 0,
                "citation_support": 0,
                "consistency": 0,
                "extraction_quality": 0,
            },
        ),
        comparisons=comparisons,
        criteria=[{"key": "price", "weight": 1}],
        evidence=evidence,
        pages=[
            {
                "document_id": "doc-1",
                "page_number": 1,
                "quality_score": 1,
            }
        ],
    )

    assert comparisons[0].weighted_score == 1
    assert len(comparisons[0].criteria) == 1
    assert decision.confidence.coverage <= 1
    assert decision.confidence.citation_support <= 1


def test_scoring_rejects_criterion_weights_that_do_not_sum_to_one() -> None:
    with pytest.raises(ValueError, match="sum to 1.0"):
        score_comparisons(
            [
                ProviderComparison(
                    provider_id="A",
                    criteria=[
                        ComparisonCriterion(
                            key="price", normalized_score=1, evidence_ids=["ev-1"]
                        ),
                        ComparisonCriterion(
                            key="warranty", normalized_score=1, evidence_ids=["ev-1"]
                        ),
                    ],
                )
            ],
            [
                {"key": "price", "weight": 1},
                {"key": "warranty", "weight": 1},
            ],
            {"ev-1"},
        )
