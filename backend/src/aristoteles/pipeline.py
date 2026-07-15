import json
from datetime import UTC, datetime
from typing import Any

from .agents import AgentRuntime
from .config import Settings
from .contracts import (
    DecisionResult,
    EvidenceRef,
    ProviderComparison,
    ResearchResult,
    RunStatus,
)
from .evidence import source_hash, validate_evidence
from .insforge import InsForgeRepository
from .rag import RAGService
from .roadmap import build_decision_roadmap
from .scoring import enforce_decision, score_comparisons


def _now() -> str:
    return datetime.now(UTC).isoformat()


def _review_seed(summary: str) -> DecisionResult:
    return DecisionResult(
        outcome="needs_review",
        summary=summary,
        risk_items=[summary],
        confidence={
            "score": 0,
            "band": "low",
            "coverage": 0,
            "citation_support": 0,
            "consistency": 0,
            "extraction_quality": 0,
        },
    )


class AnalysisPipeline:
    """Runs agent stages and persists a validated result at every boundary."""

    def __init__(self, settings: Settings, repository: InsForgeRepository):
        self.settings = settings
        self.repository = repository
        self.agents = AgentRuntime(settings)
        self.rag = RAGService(settings, repository)

    async def _stage(self, run_id: str, owner_id: str, status: RunStatus, progress: float) -> None:
        await self.repository.update(
            "analysis_runs",
            {"id": f"eq.{run_id}", "owner_id": f"eq.{owner_id}"},
            {"status": status, "current_stage": status, "progress": progress},
        )

    async def _reset_run(self, run_id: str, owner_id: str) -> None:
        """Make retries idempotent by removing outputs owned by this run."""
        filters = {"run_id": f"eq.{run_id}", "owner_id": f"eq.{owner_id}"}
        for table in ("reports", "decisions", "comparisons", "evidence", "agent_tasks"):
            await self.repository.delete(table, filters)

    async def _task(
        self, *, run_id: str, owner_id: str, case_id: str, agent_name: str, output: dict[str, Any]
    ) -> None:
        await self.repository.insert(
            "agent_tasks",
            {
                "owner_id": owner_id,
                "case_id": case_id,
                "run_id": run_id,
                "agent_name": agent_name,
                "status": "completed",
                "output": output,
                "attempt": 1,
                "completed_at": _now(),
            },
        )

    async def _persist_evidence(
        self,
        *,
        candidates: list[EvidenceRef],
        retrieved: list[dict[str, Any]],
        pages: list[dict[str, Any]],
        run_id: str,
        owner_id: str,
        case_id: str,
    ) -> list[EvidenceRef]:
        chunks = {str(item["id"]): item for item in retrieved if item.get("id")}
        valid = validate_evidence(candidates, retrieved=retrieved, pages=pages)
        persisted: list[EvidenceRef] = []
        for item in valid:
            chunk = chunks[item.chunk_id or ""]
            row = await self.repository.insert(
                "evidence",
                {
                    "owner_id": owner_id,
                    "case_id": case_id,
                    "run_id": run_id,
                    "document_id": item.document_id,
                    "page_id": chunk.get("page_id"),
                    "chunk_id": item.chunk_id,
                    "claim": item.claim,
                    "quote": item.quote,
                    "source_hash": item.source_hash,
                },
            )
            persisted.append(item.model_copy(update={"id": str(row["id"])}))
        return persisted

    async def execute(self, run_id: str, owner_id: str) -> DecisionResult:
        run = await self.repository.select_one(
            "analysis_runs", {"id": f"eq.{run_id}", "owner_id": f"eq.{owner_id}"}
        )
        if run is None:
            raise ValueError("Analysis run not found")
        case_id = run["case_id"]
        case = await self.repository.select_one(
            "cases", {"id": f"eq.{case_id}", "owner_id": f"eq.{owner_id}"}
        )
        if case is None:
            raise ValueError("Case not found")

        await self._reset_run(run_id, owner_id)
        await self._stage(run_id, owner_id, RunStatus.extracting, 0.25)
        documents = await self.repository.select_many(
            "documents", {"case_id": f"eq.{case_id}", "owner_id": f"eq.{owner_id}"}
        )
        pages = await self.repository.select_many(
            "document_pages", {"case_id": f"eq.{case_id}", "owner_id": f"eq.{owner_id}"}
        )
        for page in pages:
            if not page.get("extracted_text"):
                continue
            existing = await self.repository.select_one(
                "chunks", {"page_id": f"eq.{page['id']}", "owner_id": f"eq.{owner_id}"}
            )
            if existing is None:
                await self.rag.store_page_chunks(
                    owner_id=owner_id,
                    case_id=case_id,
                    document_id=page["document_id"],
                    page_id=page["id"],
                    text=page["extracted_text"],
                )
        document_summary = await self.agents.run(
            "document",
            json.dumps(
                {
                    "documents": documents,
                    "pages": pages,
                    "instruction": "Resume calidad y problemas; no interpretes el contenido.",
                },
                ensure_ascii=False,
            ),
        )
        await self._task(
            run_id=run_id,
            owner_id=owner_id,
            case_id=case_id,
            agent_name="document",
            output=document_summary,
        )

        await self._stage(run_id, owner_id, RunStatus.researching, 0.4)
        criteria = await self.repository.select_many(
            "analysis_criteria", {"case_id": f"eq.{case_id}", "owner_id": f"eq.{owner_id}"}
        )
        query = case["objective"]
        if criteria:
            labels = ", ".join(str(item.get("label", item["key"])) for item in criteria)
            query += f"\nCriterios: {labels}"
        retrieved = await self.rag.search(case_id=case_id, query=query) if pages else []
        pages_by_id = {str(page["id"]): page for page in pages if page.get("id")}
        retrieval_context = []
        for item in retrieved:
            page = pages_by_id.get(str(item.get("page_id")))
            if not page:
                continue
            retrieval_context.append(
                {
                    "chunk_id": str(item["id"]),
                    "document_id": str(item["document_id"]),
                    "page": int(page["page_number"]),
                    "content": str(item["content"]),
                    "source_hash": source_hash(str(item["content"])),
                }
            )

        if retrieval_context:
            research = await self.agents.research(
                json.dumps(
                    {
                        "objective": case["objective"],
                        "criteria": criteria,
                        "retrieved_chunks": retrieval_context,
                    },
                    ensure_ascii=False,
                )
            )
        else:
            research = ResearchResult(warnings=["RAG no recuperó fragmentos verificables."])
        evidence = await self._persist_evidence(
            candidates=research.evidence,
            retrieved=retrieved,
            pages=pages,
            run_id=run_id,
            owner_id=owner_id,
            case_id=case_id,
        )
        research = research.model_copy(update={"evidence": evidence})
        await self._task(
            run_id=run_id,
            owner_id=owner_id,
            case_id=case_id,
            agent_name="research",
            output=research.model_dump(mode="json"),
        )

        comparisons: list[ProviderComparison] = []
        await self._stage(run_id, owner_id, RunStatus.comparing, 0.62)
        if evidence:
            comparisons = await self.agents.compare(
                json.dumps(
                    {
                        "objective": case["objective"],
                        "criteria": criteria,
                        "research": research.model_dump(mode="json"),
                    },
                    ensure_ascii=False,
                )
            )
            comparisons = score_comparisons(
                comparisons, criteria, {item.id for item in evidence if item.id}
            )
        for item in comparisons:
            await self.repository.insert(
                "comparisons",
                {
                    "owner_id": owner_id,
                    "case_id": case_id,
                    "run_id": run_id,
                    "provider_id": item.provider_id,
                    "criteria": [criterion.model_dump(mode="json") for criterion in item.criteria],
                    "advantages": item.advantages,
                    "disadvantages": item.disadvantages,
                    "contradictions": item.contradictions,
                },
            )
        await self._task(
            run_id=run_id,
            owner_id=owner_id,
            case_id=case_id,
            agent_name="comparison",
            output={"comparisons": [item.model_dump(mode="json") for item in comparisons]},
        )

        await self._stage(run_id, owner_id, RunStatus.deciding, 0.8)
        if evidence and comparisons:
            model_decision = await self.agents.decide(
                json.dumps(
                    {
                        "objective": case["objective"],
                        "criteria": criteria,
                        "comparisons": [item.model_dump(mode="json") for item in comparisons],
                    },
                    ensure_ascii=False,
                )
            )
        else:
            model_decision = _review_seed("No hay evidencia RAG válida para tomar una decisión.")
        decision = enforce_decision(
            model_decision,
            comparisons=comparisons,
            criteria=criteria,
            evidence=evidence,
            pages=pages,
            min_confidence=self.settings.min_decision_confidence,
        )
        await self.repository.insert(
            "decisions",
            {
                "owner_id": owner_id,
                "case_id": case_id,
                "run_id": run_id,
                **decision.model_dump(mode="json"),
            },
        )
        await self._task(
            run_id=run_id,
            owner_id=owner_id,
            case_id=case_id,
            agent_name="decision",
            output=decision.model_dump(mode="json"),
        )

        await self._stage(run_id, owner_id, RunStatus.reporting, 0.92)
        roadmap = build_decision_roadmap(
            objective=case["objective"],
            criteria=criteria,
            comparisons=comparisons,
            decision=decision,
        )
        report = {
            "case_id": case_id,
            "run_id": run_id,
            "decision": decision.model_dump(mode="json"),
            "roadmap": roadmap.model_dump(mode="json"),
            "comparisons": [item.model_dump(mode="json") for item in comparisons],
            "research": research.model_dump(mode="json"),
            "generated_at": _now(),
        }
        await self.repository.insert(
            "reports",
            {"owner_id": owner_id, "case_id": case_id, "run_id": run_id, "report": report},
        )
        final_status = (
            RunStatus.completed if decision.outcome == "recommendation" else RunStatus.needs_review
        )
        await self.repository.update(
            "analysis_runs",
            {"id": f"eq.{run_id}", "owner_id": f"eq.{owner_id}"},
            {
                "status": final_status,
                "current_stage": "completed",
                "progress": 1,
                "completed_at": _now(),
            },
        )
        return decision
