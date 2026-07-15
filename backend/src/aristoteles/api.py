import base64
import json
from datetime import UTC, datetime
from typing import Annotated

from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException, Response, status

from .agents import AgentRuntime
from .config import Settings, get_settings
from .contracts import CaseCreate, CriteriaConfirmation, DocumentRegister, RunStatus
from .demo import demo_agent_endpoint
from .extraction import extract_image, extract_pdf
from .insforge import InsForgeError, InsForgeRepository
from .pipeline import AnalysisPipeline

app = FastAPI(title="Aristóteles API", version="0.1.0")


def _user_id(token: str) -> str:
    try:
        payload = token.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        claims = json.loads(base64.urlsafe_b64decode(payload.encode()))
        user_id = claims.get("sub")
    except (IndexError, ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=401, detail="Invalid bearer token") from exc
    if not isinstance(user_id, str) or not user_id:
        raise HTTPException(status_code=401, detail="Bearer token has no subject")
    return user_id


async def auth_context(
    authorization: Annotated[str | None, Header()] = None,
    settings: Settings = Depends(get_settings),
) -> tuple[str, InsForgeRepository]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required")
    token = authorization.split(" ", 1)[1].strip()
    return _user_id(token), InsForgeRepository(settings, access_token=token)


AuthContext = Annotated[tuple[str, InsForgeRepository], Depends(auth_context)]


def _insforge_error(exc: InsForgeError) -> HTTPException:
    if exc.status_code == 404:
        return HTTPException(status_code=404, detail="Resource not found")
    if exc.status_code in (401, 403):
        return HTTPException(status_code=403, detail="Insufficient permissions")
    return HTTPException(status_code=502, detail="InsForge request failed")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.post("/v1/demo/agent")(demo_agent_endpoint)


@app.post("/v1/cases", status_code=status.HTTP_201_CREATED)
async def create_case(payload: CaseCreate, context: AuthContext) -> dict:
    owner_id, repository = context
    try:
        return await repository.insert("cases", {"owner_id": owner_id, **payload.model_dump()})
    except InsForgeError as exc:
        raise _insforge_error(exc) from exc


@app.get("/v1/cases/{case_id}")
async def get_case(case_id: str, context: AuthContext) -> dict:
    owner_id, repository = context
    try:
        result = await repository.select_one(
            "cases", {"id": f"eq.{case_id}", "owner_id": f"eq.{owner_id}"}
        )
    except InsForgeError as exc:
        raise _insforge_error(exc) from exc
    if result is None:
        raise HTTPException(status_code=404, detail="Case not found")
    return result


@app.post("/v1/cases/{case_id}/documents", status_code=status.HTTP_201_CREATED)
async def register_document(case_id: str, payload: DocumentRegister, context: AuthContext) -> dict:
    owner_id, repository = context
    if not payload.storage_key.startswith(f"{owner_id}/{case_id}/"):
        raise HTTPException(status_code=400, detail="Storage key is outside the case owner prefix")
    try:
        case = await repository.select_one(
            "cases", {"id": f"eq.{case_id}", "owner_id": f"eq.{owner_id}"}
        )
        if case is None:
            raise HTTPException(status_code=404, detail="Case not found")
        return await repository.insert(
            "documents", {"owner_id": owner_id, "case_id": case_id, **payload.model_dump()}
        )
    except InsForgeError as exc:
        raise _insforge_error(exc) from exc


@app.post("/v1/cases/{case_id}/documents/{document_id}/extract")
async def extract_document(case_id: str, document_id: str, context: AuthContext) -> dict:
    owner_id, repository = context
    document = await repository.select_one(
        "documents",
        {"id": f"eq.{document_id}", "case_id": f"eq.{case_id}", "owner_id": f"eq.{owner_id}"},
    )
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    await repository.delete(
        "document_pages", {"document_id": f"eq.{document_id}", "owner_id": f"eq.{owner_id}"}
    )
    raw = await repository.download_url(document["storage_url"])
    pages = extract_pdf(raw) if document["mime_type"] == "application/pdf" else extract_image(raw)
    for page in pages:
        await repository.insert(
            "document_pages",
            {
                "owner_id": owner_id,
                "case_id": case_id,
                "document_id": document_id,
                "page_number": page.page_number,
                "extracted_text": page.text,
                "extraction_method": page.method,
                "quality_score": page.quality_score,
            },
        )
    extraction_status = (
        "completed"
        if pages and all(page.quality_score >= 0.25 for page in pages)
        else "needs_review"
    )
    updated = await repository.update(
        "documents",
        {"id": f"eq.{document_id}", "owner_id": f"eq.{owner_id}"},
        {"extraction_status": extraction_status},
    )
    return {"document": updated, "pages": [page.__dict__ for page in pages]}


@app.post("/v1/cases/{case_id}/plans", status_code=status.HTTP_201_CREATED)
async def create_plan(
    case_id: str, context: AuthContext, settings: Settings = Depends(get_settings)
) -> dict:
    owner_id, repository = context
    case = await repository.select_one(
        "cases", {"id": f"eq.{case_id}", "owner_id": f"eq.{owner_id}"}
    )
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    documents = await repository.select_many(
        "documents", {"case_id": f"eq.{case_id}", "owner_id": f"eq.{owner_id}", "select": "id"}
    )
    try:
        plan = await AgentRuntime(settings).plan(
            case["objective"], [item["id"] for item in documents]
        )
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(
            status_code=502, detail="Planner could not create a valid plan"
        ) from exc
    run = await repository.insert(
        "analysis_runs",
        {
            "owner_id": owner_id,
            "case_id": case_id,
            "plan": plan.model_dump(mode="json"),
            "status": RunStatus.awaiting_criteria,
        },
    )
    return {"run_id": run["id"], "plan": plan.model_dump(mode="json")}


@app.put("/v1/plans/{run_id}/criteria")
async def confirm_criteria(
    run_id: str, payload: CriteriaConfirmation, context: AuthContext
) -> dict:
    owner_id, repository = context
    run = await repository.select_one(
        "analysis_runs", {"id": f"eq.{run_id}", "owner_id": f"eq.{owner_id}"}
    )
    if run is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    for criterion in payload.criteria:
        await repository.insert(
            "analysis_criteria",
            {
                "owner_id": owner_id,
                "case_id": run["case_id"],
                **criterion.model_dump(),
                "confirmed_at": datetime.now(UTC).isoformat(),
            },
        )
    updated = await repository.update(
        "analysis_runs",
        {"id": f"eq.{run_id}", "owner_id": f"eq.{owner_id}"},
        {"status": RunStatus.queued},
    )
    return updated or run


@app.post("/v1/plans/{run_id}/runs", status_code=status.HTTP_202_ACCEPTED)
async def start_run(
    run_id: str,
    background: BackgroundTasks,
    context: AuthContext,
    settings: Settings = Depends(get_settings),
) -> dict:
    owner_id, repository = context
    run = await repository.select_one(
        "analysis_runs", {"id": f"eq.{run_id}", "owner_id": f"eq.{owner_id}"}
    )
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    if run["status"] not in (RunStatus.queued, RunStatus.failed):
        raise HTTPException(status_code=409, detail=f"Run cannot start from {run['status']}")
    await repository.update(
        "analysis_runs",
        {"id": f"eq.{run_id}", "owner_id": f"eq.{owner_id}"},
        {"status": RunStatus.extracting, "started_at": datetime.now(UTC).isoformat()},
    )
    background.add_task(execute_run, run_id, owner_id, repository.access_token, settings)
    return {"run_id": run_id, "status": RunStatus.extracting}


async def execute_run(
    run_id: str, owner_id: str, access_token: str | None, settings: Settings
) -> None:
    """Execute agent stages with the same user scope as the triggering request."""
    repository = InsForgeRepository(settings, access_token=access_token)
    try:
        await AnalysisPipeline(settings, repository).execute(run_id, owner_id)
    except (InsForgeError, ValueError, RuntimeError) as exc:
        await repository.update(
            "analysis_runs",
            {"id": f"eq.{run_id}", "owner_id": f"eq.{owner_id}"},
            {
                "status": RunStatus.failed,
                "error_code": type(exc).__name__.upper(),
                "error_message": "Analysis failed; inspect the run logs for details.",
            },
        )


@app.get("/v1/runs/{run_id}")
async def get_run(run_id: str, context: AuthContext) -> dict:
    owner_id, repository = context
    try:
        result = await repository.select_one(
            "analysis_runs", {"id": f"eq.{run_id}", "owner_id": f"eq.{owner_id}"}
        )
    except InsForgeError as exc:
        raise _insforge_error(exc) from exc
    if result is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return result


@app.get("/v1/runs/{run_id}/report")
async def get_report(run_id: str, context: AuthContext) -> dict:
    owner_id, repository = context
    try:
        report = await repository.select_one(
            "reports", {"run_id": f"eq.{run_id}", "owner_id": f"eq.{owner_id}"}
        )
    except InsForgeError as exc:
        raise _insforge_error(exc) from exc
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return report["report"]


@app.get("/v1/runs/{run_id}/report.pdf")
async def get_report_pdf(run_id: str, context: AuthContext) -> Response:
    from .reporting import render_pdf

    report = await get_report(run_id, context)
    return Response(
        content=render_pdf(report),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="aristoteles-{run_id}.pdf"'},
    )
