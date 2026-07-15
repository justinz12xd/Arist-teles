import json
from typing import Any

import pytest

from aristoteles.config import Settings
from aristoteles.contracts import (
    ComparisonCriterion,
    DecisionResult,
    EvidenceRef,
    ProviderComparison,
    ResearchResult,
)
from aristoteles.evidence import source_hash
from aristoteles.pipeline import AnalysisPipeline


class FakeRepository:
    def __init__(self) -> None:
        self.rows: dict[str, list[dict[str, Any]]] = {
            "analysis_runs": [{"id": "run-1", "owner_id": "owner-1", "case_id": "case-1"}],
            "cases": [
                {
                    "id": "case-1",
                    "owner_id": "owner-1",
                    "objective": "Elegir la mejor garantía",
                }
            ],
            "documents": [{"id": "doc-1", "owner_id": "owner-1", "case_id": "case-1"}],
            "document_pages": [
                {
                    "id": "page-1",
                    "owner_id": "owner-1",
                    "case_id": "case-1",
                    "document_id": "doc-1",
                    "page_number": 1,
                    "extracted_text": "Proveedor A ofrece garantía de 24 meses.",
                    "quality_score": 0.9,
                }
            ],
            "analysis_criteria": [
                {
                    "id": "criterion-1",
                    "owner_id": "owner-1",
                    "case_id": "case-1",
                    "key": "warranty",
                    "label": "Garantía",
                    "weight": 1.0,
                }
            ],
            "chunks": [{"id": "chunk-1", "page_id": "page-1", "owner_id": "owner-1"}],
        }

    async def select_one(self, table: str, filters: dict[str, str]) -> dict[str, Any] | None:
        values = self.rows.get(table, [])
        return values[0] if values else None

    async def select_many(self, table: str, filters: dict[str, str]) -> list[dict[str, Any]]:
        return list(self.rows.get(table, []))

    async def insert(self, table: str, row: dict[str, Any]) -> dict[str, Any]:
        stored = {"id": f"{table}-{len(self.rows.get(table, [])) + 1}", **row}
        self.rows.setdefault(table, []).append(stored)
        return stored

    async def update(
        self, table: str, filters: dict[str, str], patch: dict[str, Any]
    ) -> dict[str, Any] | None:
        row = self.rows.get(table, [None])[0]
        if row:
            row.update(patch)
        return row

    async def delete(self, table: str, filters: dict[str, str]) -> None:
        self.rows[table] = []


class FakeRAG:
    content = "Proveedor A ofrece garantía de 24 meses."

    async def search(self, **_: Any) -> list[dict[str, Any]]:
        return [
            {
                "id": "chunk-1",
                "document_id": "doc-1",
                "page_id": "page-1",
                "content": self.content,
            }
        ]


class FakeAgents:
    async def run(self, role: str, instruction: str) -> dict[str, Any]:
        return {"role": role, "processed": bool(instruction)}

    async def research(self, context: str) -> ResearchResult:
        payload = json.loads(context)
        chunk = payload["retrieved_chunks"][0]
        return ResearchResult(
            evidence=[
                EvidenceRef(
                    claim="Proveedor A tiene garantía de 24 meses",
                    document_id="doc-1",
                    page=1,
                    chunk_id="chunk-1",
                    quote="garantía de 24 meses",
                    source_hash=source_hash(chunk["content"]),
                )
            ]
        )

    async def compare(self, context: str) -> list[ProviderComparison]:
        evidence_id = json.loads(context)["research"]["evidence"][0]["id"]
        return [
            ProviderComparison(
                provider_id="A",
                criteria=[
                    ComparisonCriterion(
                        key="warranty", normalized_score=1, evidence_ids=[evidence_id]
                    )
                ],
            )
        ]

    async def decide(self, context: str) -> DecisionResult:
        assert json.loads(context)["comparisons"][0]["weighted_score"] == 1
        return DecisionResult(
            outcome="recommendation",
            recommended_provider_id="modelo-no-confiable",
            summary="Proveedor A tiene la mejor garantía.",
            confidence={
                "score": 0.1,
                "band": "low",
                "coverage": 0.1,
                "citation_support": 0.1,
                "consistency": 0.1,
                "extraction_quality": 0.1,
            },
        )


@pytest.mark.asyncio
async def test_pipeline_persists_evidence_and_is_idempotent() -> None:
    repository = FakeRepository()
    pipeline = AnalysisPipeline(
        Settings(
            INSFORGE_URL="https://project.us-east.insforge.app",
            INSFORGE_API_KEY="secret",
            OPENROUTER_API_KEY="test-key",
        ),
        repository,  # type: ignore[arg-type]
    )
    pipeline.rag = FakeRAG()  # type: ignore[assignment]
    pipeline.agents = FakeAgents()  # type: ignore[assignment]

    first = await pipeline.execute("run-1", "owner-1")
    second = await pipeline.execute("run-1", "owner-1")

    assert first.outcome == second.outcome == "recommendation"
    assert second.recommended_provider_id == "A"
    assert len(repository.rows["evidence"]) == 1
    assert len(repository.rows["comparisons"]) == 1
    assert len(repository.rows["decisions"]) == 1
    assert len(repository.rows["reports"]) == 1
    assert len(repository.rows["agent_tasks"]) == 4
