import json
from datetime import UTC, datetime
from typing import Any

from .agents import AgentRuntime
from .config import Settings
from .contracts import DecisionResult, RunStatus
from .insforge import InsForgeRepository
from .rag import RAGService
from .roadmap import build_decision_roadmap


def _now() -> str:
    return datetime.now(UTC).isoformat()


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
        source_context = (
            "\n\n".join(
                f"Documento {page.get('document_id')} página {page.get('page_number')}: "
                f"{page.get('extracted_text', '')}"
                for page in pages
                if page.get("extracted_text")
            )
            or "No hay texto extraído todavía. Debes solicitar revisión humana."
        )
        retrieved = await self.rag.search(case_id=case_id, query=case["objective"]) if pages else []
        if retrieved:
            source_context = "\n\n".join(
                f"Chunk {item.get('id')} (documento {item.get('document_id')}): {item['content']}"
                for item in retrieved
            )
        research = await self.agents.research(
            json.dumps(
                {
                    "objective": case["objective"],
                    "criteria": criteria,
                    "source_context": source_context,
                },
                ensure_ascii=False,
            )
        )
        await self._task(
            run_id=run_id,
            owner_id=owner_id,
            case_id=case_id,
            agent_name="research",
            output=research,
        )

        await self._stage(run_id, owner_id, RunStatus.comparing, 0.62)
        comparison = await self.agents.compare(
            json.dumps(
                {"objective": case["objective"], "criteria": criteria, "research": research},
                ensure_ascii=False,
            )
        )
        for item in comparison:
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
            output={"comparisons": [item.model_dump(mode="json") for item in comparison]},
        )

        await self._stage(run_id, owner_id, RunStatus.deciding, 0.8)
        decision = await self.agents.decide(
            json.dumps(
                {
                    "objective": case["objective"],
                    "criteria": criteria,
                    "comparisons": [item.model_dump(mode="json") for item in comparison],
                },
                ensure_ascii=False,
            )
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
            comparisons=comparison,
            decision=decision,
        )
        report = {
            "case_id": case_id,
            "run_id": run_id,
            "decision": decision.model_dump(mode="json"),
            "roadmap": roadmap.model_dump(mode="json"),
            "comparisons": [item.model_dump(mode="json") for item in comparison],
            "research": research,
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
