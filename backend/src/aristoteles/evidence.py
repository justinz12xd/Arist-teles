import hashlib
import re
from typing import Any

from .contracts import EvidenceRef


def source_hash(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def _normalized(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip().casefold()


def validate_evidence(
    candidates: list[EvidenceRef],
    *,
    retrieved: list[dict[str, Any]],
    pages: list[dict[str, Any]],
) -> list[EvidenceRef]:
    """Keep only citations that can be proven against the retrieved RAG context."""
    chunks_by_id = {str(item.get("id")): item for item in retrieved if item.get("id")}
    pages_by_id = {str(item.get("id")): item for item in pages if item.get("id")}
    valid: list[EvidenceRef] = []

    for candidate in candidates:
        if not candidate.chunk_id:
            continue
        chunk = chunks_by_id.get(candidate.chunk_id)
        if not chunk or str(chunk.get("document_id")) != candidate.document_id:
            continue
        page = pages_by_id.get(str(chunk.get("page_id")))
        if not page:
            continue
        if (
            str(page.get("document_id")) != candidate.document_id
            or int(page.get("page_number", 0)) != candidate.page
        ):
            continue
        content = str(chunk.get("content", ""))
        if not content or _normalized(candidate.quote) not in _normalized(content):
            continue
        if candidate.source_hash != source_hash(content):
            continue
        valid.append(candidate.model_copy(update={"id": None}))

    return valid
