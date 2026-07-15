from aristoteles.contracts import DecisionResult, ProviderComparison
from aristoteles.roadmap import build_decision_roadmap


def test_roadmap_builds_auditable_paths_from_comparisons() -> None:
    comparisons = [
        ProviderComparison(
            provider_id="Proveedor A",
            criteria=[
                {
                    "key": "price",
                    "value": "$18.400",
                    "normalized_score": 0.9,
                    "evidence_ids": ["ev-a-price"],
                },
                {
                    "key": "warranty",
                    "missing": True,
                    "evidence_ids": [],
                },
            ],
            contradictions=["La garantía no aparece en la cotización."],
        ),
        ProviderComparison(
            provider_id="Proveedor B",
            criteria=[
                {
                    "key": "price",
                    "value": "$19.200",
                    "normalized_score": 0.8,
                    "evidence_ids": ["ev-b-price"],
                },
                {
                    "key": "warranty",
                    "value": "24 meses",
                    "normalized_score": 1,
                    "evidence_ids": ["ev-b-warranty"],
                },
            ],
        ),
    ]
    decision = DecisionResult(
        outcome="recommendation",
        recommended_provider_id="Proveedor B",
        summary="Proveedor B ofrece el mejor equilibrio verificable.",
        evidence_ids=["ev-b-price", "ev-b-warranty"],
        confidence={
            "score": 0.86,
            "band": "high",
            "coverage": 0.9,
            "citation_support": 0.9,
            "consistency": 0.8,
            "extraction_quality": 0.8,
        },
    )

    roadmap = build_decision_roadmap(
        objective="Seleccionar proveedor",
        criteria=[
            {"key": "price", "label": "Precio", "weight": 0.4},
            {"key": "warranty", "label": "Garantía", "weight": 0.6},
        ],
        comparisons=comparisons,
        decision=decision,
    )

    assert roadmap.recommended_option_id == "Proveedor B"
    assert roadmap.evidence_count == 3
    assert roadmap.paths[0].status == "review"
    assert roadmap.paths[0].checkpoints[1].state == "unknown"
    assert roadmap.paths[1].status == "recommended"
    assert roadmap.paths[1].score == 0.92
