import hashlib
import inspect

import pytest

from aristoteles.api import (
    ConfiguredCORSMiddleware,
    parse_cors_origins,
    start_run,
    validate_document_bytes,
)
from aristoteles.config import Settings
from aristoteles.pipeline import AnalysisPipeline


def test_cors_origins_are_explicit_and_wildcard_is_rejected() -> None:
    assert parse_cors_origins("https://app.example, https://preview.example") == [
        "https://app.example",
        "https://preview.example",
    ]
    with pytest.raises(ValueError, match="Wildcard"):
        parse_cors_origins("*")


def test_cors_middleware_reads_origins_from_settings() -> None:
    settings = Settings(
        INSFORGE_URL="https://project.us-east.insforge.app",
        ARISTOTELES_CORS_ORIGINS="https://app.example",
    )
    middleware = ConfiguredCORSMiddleware(lambda scope, receive, send: None, settings=settings)
    assert middleware.allow_origins == ["https://app.example"]


def test_document_bytes_must_match_size_hash_mime_and_limit() -> None:
    raw = b"%PDF-1.7\nvalid"
    document = {
        "byte_size": len(raw),
        "sha256": hashlib.sha256(raw).hexdigest(),
        "mime_type": "application/pdf",
    }
    validate_document_bytes(document, raw, max_bytes=1024)

    with pytest.raises(ValueError, match="hash"):
        validate_document_bytes({**document, "sha256": "0" * 64}, raw, max_bytes=1024)
    with pytest.raises(ValueError, match="MIME"):
        validate_document_bytes({**document, "mime_type": "image/png"}, raw, max_bytes=1024)
    with pytest.raises(ValueError, match="maximum"):
        validate_document_bytes(document, raw, max_bytes=2)


def test_start_run_does_not_depend_on_starlette_background_tasks() -> None:
    parameters = inspect.signature(start_run).parameters
    assert "background" not in parameters


@pytest.mark.asyncio
async def test_pipeline_resets_run_outputs_before_retry() -> None:
    class Repository:
        def __init__(self) -> None:
            self.deleted: list[tuple[str, dict[str, str]]] = []

        async def delete(self, table: str, filters: dict[str, str]) -> None:
            self.deleted.append((table, filters))

    repository = Repository()
    pipeline = AnalysisPipeline(
        Settings(
            INSFORGE_URL="https://project.us-east.insforge.app",
            INSFORGE_API_KEY="secret",
            OPENROUTER_API_KEY="test-key",
        ),
        repository,  # type: ignore[arg-type]
    )

    await pipeline._reset_run("run-1", "owner-1")

    assert [table for table, _ in repository.deleted] == [
        "reports",
        "decisions",
        "comparisons",
        "evidence",
        "agent_tasks",
    ]
    assert all(filters["run_id"] == "eq.run-1" for _, filters in repository.deleted)


def test_settings_accept_empty_optional_urls_from_env_example() -> None:
    settings = Settings(INSFORGE_BASE_URL="", SUPABASE_URL="")

    assert settings.insforge_base_url is None
    assert settings.supabase_url is None
