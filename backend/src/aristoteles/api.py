import base64
import hashlib
import hmac
import json
from datetime import UTC, datetime
from io import BytesIO
from typing import Annotated, Any
from urllib.parse import urlsplit

import openai
from fastapi import (
    APIRouter,
    Depends,
    FastAPI,
    File,
    Form,
    Header,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

from .agents import AgentRuntime
from .config import Settings, get_settings
from .contracts import CaseCreate, CriteriaConfirmation, DocumentRegister, ResearchMode, RunStatus
from .demo import demo_agent_endpoint
from .extraction import extract_image, extract_pdf
from .insforge import InsForgeError, InsForgeRepository
from .pipeline import AnalysisPipeline
from .web_research import WebResearchService

router = APIRouter(tags=["analysis"])
SettingsContext = Annotated[Settings, Depends(get_settings)]


def parse_cors_origins(value: str | list[str]) -> list[str]:
    raw_origins: list[str]
    if isinstance(value, list):
        raw_origins = [str(item) for item in value]
    else:
        stripped = value.strip()
        if stripped.startswith("["):
            try:
                decoded = json.loads(stripped)
            except json.JSONDecodeError as exc:
                raise ValueError(
                    "CORS origins must be a comma-separated string or JSON list"
                ) from exc
            if not isinstance(decoded, list):
                raise ValueError("CORS origins JSON value must be a list")
            raw_origins = [str(item) for item in decoded]
        else:
            raw_origins = value.split(",")

    origins: list[str] = []
    for raw in raw_origins:
        origin = raw.strip().rstrip("/")
        if not origin:
            continue
        if origin == "*":
            raise ValueError("Wildcard CORS origins are not allowed")
        parsed = urlsplit(origin)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.path:
            raise ValueError(f"Invalid CORS origin: {origin}")
        origins.append(origin)
    return list(dict.fromkeys(origins))


class ConfiguredCORSMiddleware(CORSMiddleware):
    """Resolve CORS through Pydantic Settings, including configured env files."""

    def __init__(self, app, settings: Settings | None = None):
        resolved = settings or get_settings()
        super().__init__(
            app,
            allow_origins=parse_cors_origins(resolved.cors_origins),
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "OPTIONS"],
            allow_headers=["Authorization", "Content-Type"],
        )


def _detected_mime(raw: bytes) -> str | None:
    if raw.startswith(b"%PDF-"):
        return "application/pdf"
    try:
        with Image.open(BytesIO(raw)) as image:
            return {
                "PNG": "image/png",
                "JPEG": "image/jpeg",
                "WEBP": "image/webp",
            }.get(image.format or "")
    except (UnidentifiedImageError, OSError):
        return None


def validate_document_bytes(document: dict[str, Any], raw: bytes, *, max_bytes: int) -> None:
    if len(raw) > max_bytes:
        raise ValueError("Document exceeds the configured maximum size")
    if len(raw) != int(document["byte_size"]):
        raise ValueError("Document byte size does not match registration")
    if hashlib.sha256(raw).hexdigest().casefold() != str(document["sha256"]).casefold():
        raise ValueError("Document hash does not match registration")
    detected = _detected_mime(raw)
    if detected is None or detected != document["mime_type"]:
        raise ValueError("Document MIME does not match its content")


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
    settings: SettingsContext,
    authorization: Annotated[str | None, Header()] = None,
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


@router.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


router.post("/v1/demo/agent", tags=["agent-demo"])(demo_agent_endpoint)


@router.post("/v1/chat/research", tags=["chat"])
async def research_chat(
    objective: Annotated[str, Form(min_length=1, max_length=4_000)],
    settings: SettingsContext,
    mode: Annotated[ResearchMode, Form()] = ResearchMode.auto,
    files: Annotated[list[UploadFile] | None, File()] = None,
    x_aristoteles_proxy: Annotated[str | None, Header()] = None,
) -> dict:
    """Fast public-chat bridge: web evidence alone or web evidence plus uploaded PDFs."""
    if settings.aristoteles_api_shared_secret is not None:
        expected = settings.aristoteles_api_shared_secret.get_secret_value()
        if not x_aristoteles_proxy or not hmac.compare_digest(x_aristoteles_proxy, expected):
            raise HTTPException(status_code=401, detail="Invalid chat proxy credential")

    documents: list[str] = []
    for upload in files or []:
        if upload.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF documents are accepted")
        try:
            pages = extract_pdf(await upload.read())
        except Exception as exc:  # pragma: no cover - parser exceptions vary by file.
            raise HTTPException(
                status_code=400, detail=f"{upload.filename} could not be processed"
            ) from exc
        text = "\n".join(page.text for page in pages if page.text.strip())
        if text:
            documents.append(f"Documento: {upload.filename or 'documento.pdf'}\n{text}")

    try:
        result = await WebResearchService(settings).answer(
            objective=objective,
            mode=mode,
            documents=documents,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail="Research service is not available") from exc
    except openai.APIError as exc:
        raise HTTPException(status_code=502, detail="Research provider request failed") from exc
    return result.model_dump(mode="json")


@router.post("/v1/cases", status_code=status.HTTP_201_CREATED)
async def create_case(payload: CaseCreate, context: AuthContext) -> dict:
    owner_id, repository = context
    try:
        return await repository.insert("cases", {"owner_id": owner_id, **payload.model_dump()})
    except InsForgeError as exc:
        raise _insforge_error(exc) from exc


@router.get("/v1/cases/{case_id}")
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


@router.post("/v1/cases/{case_id}/documents", status_code=status.HTTP_201_CREATED)
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
        values = payload.model_dump(exclude={"storage_url"})
        values["storage_url"] = repository.storage_object_url(
            bucket="case-documents", key=payload.storage_key
        )
        return await repository.insert(
            "documents", {"owner_id": owner_id, "case_id": case_id, **values}
        )
    except InsForgeError as exc:
        raise _insforge_error(exc) from exc


@router.post("/v1/cases/{case_id}/documents/{document_id}/extract")
async def extract_document(
    case_id: str,
    document_id: str,
    context: AuthContext,
    settings: SettingsContext,
) -> dict:
    owner_id, repository = context
    document = await repository.select_one(
        "documents",
        {"id": f"eq.{document_id}", "case_id": f"eq.{case_id}", "owner_id": f"eq.{owner_id}"},
    )
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    storage_key = str(document.get("storage_key", ""))
    if not storage_key.startswith(f"{owner_id}/{case_id}/"):
        raise HTTPException(status_code=400, detail="Storage key is outside the case owner prefix")
    try:
        raw = await repository.download_storage_object(
            bucket="case-documents", key=storage_key, max_bytes=settings.max_document_bytes
        )
        validate_document_bytes(document, raw, max_bytes=settings.max_document_bytes)
    except (ValueError, InsForgeError) as exc:
        await repository.update(
            "documents",
            {"id": f"eq.{document_id}", "owner_id": f"eq.{owner_id}"},
            {"extraction_status": "needs_review"},
        )
        raise HTTPException(status_code=400, detail="Document integrity validation failed") from exc
    await repository.delete(
        "document_pages", {"document_id": f"eq.{document_id}", "owner_id": f"eq.{owner_id}"}
    )
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


@router.post("/v1/cases/{case_id}/plans", status_code=status.HTTP_201_CREATED)
async def create_plan(case_id: str, context: AuthContext, settings: SettingsContext) -> dict:
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


@router.put("/v1/plans/{run_id}/criteria")
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


@router.post("/v1/plans/{run_id}/runs")
async def start_run(run_id: str, context: AuthContext, settings: SettingsContext) -> dict:
    owner_id, repository = context
    run = await repository.select_one(
        "analysis_runs", {"id": f"eq.{run_id}", "owner_id": f"eq.{owner_id}"}
    )
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    if run["status"] not in (RunStatus.queued, RunStatus.failed):
        raise HTTPException(status_code=409, detail=f"Run cannot start from {run['status']}")
    claimed = await repository.update(
        "analysis_runs",
        {
            "id": f"eq.{run_id}",
            "owner_id": f"eq.{owner_id}",
            "status": "in.(queued,failed)",
        },
        {"status": RunStatus.extracting, "started_at": datetime.now(UTC).isoformat()},
    )
    if claimed is None:
        raise HTTPException(status_code=409, detail="Run was already claimed")
    decision = await execute_run(run_id, owner_id, repository, settings)
    completed = await repository.select_one(
        "analysis_runs", {"id": f"eq.{run_id}", "owner_id": f"eq.{owner_id}"}
    )
    return {
        "run_id": run_id,
        "status": completed["status"] if completed else RunStatus.failed,
        "decision": decision.model_dump(mode="json") if decision else None,
    }


async def execute_run(
    run_id: str,
    owner_id: str,
    repository: InsForgeRepository,
    settings: Settings,
):
    """Execute agent stages synchronously with the triggering user's scope."""
    try:
        return await AnalysisPipeline(settings, repository).execute(run_id, owner_id)
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
        return None


@router.get("/v1/runs/{run_id}")
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


@router.get("/v1/runs/{run_id}/report")
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


@router.get("/v1/runs/{run_id}/report.pdf")
async def get_report_pdf(run_id: str, context: AuthContext) -> Response:
    from .reporting import render_pdf

    report = await get_report(run_id, context)
    return Response(
        content=render_pdf(report),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="aristoteles-{run_id}.pdf"'},
    )


def create_legacy_app() -> FastAPI:
    """Compatibility factory; production uses ``aristoteles_api.main``."""
    application = FastAPI(title="Aristóteles API", version="0.1.0")
    application.add_middleware(ConfiguredCORSMiddleware)
    application.include_router(router)
    return application


app = create_legacy_app()
