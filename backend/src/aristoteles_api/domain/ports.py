from collections.abc import Sequence
from typing import Protocol
from uuid import UUID

from aristoteles_api.domain.models import (
    CaseRecord,
    DocumentRecord,
    DocumentStatus,
    GeneratedAnswer,
    RetrievedChunk,
    StoredChunkDraft,
)


class SessionGateway(Protocol):
    async def current_user(self, access_token: str) -> UUID:
        raise NotImplementedError


class RagRepository(Protocol):
    async def create_case(self, access_token: str, objective: str) -> CaseRecord:
        raise NotImplementedError

    async def case_exists(self, access_token: str, case_id: UUID) -> bool:
        raise NotImplementedError

    async def find_document(
        self,
        access_token: str,
        case_id: UUID,
        source_hash: str,
        embedding_model: str,
    ) -> DocumentRecord | None:
        raise NotImplementedError

    async def create_document(
        self,
        access_token: str,
        case_id: UUID,
        name: str,
        source_hash: str,
        embedding_model: str,
    ) -> DocumentRecord:
        raise NotImplementedError

    async def reset_document(self, access_token: str, document_id: UUID) -> None:
        raise NotImplementedError

    async def delete_chunks(self, access_token: str, document_id: UUID) -> None:
        raise NotImplementedError

    async def insert_chunks(
        self, access_token: str, chunks: Sequence[StoredChunkDraft]
    ) -> None:
        raise NotImplementedError

    async def set_document_status(
        self,
        access_token: str,
        document_id: UUID,
        status: DocumentStatus,
        chunk_count: int,
    ) -> None:
        raise NotImplementedError

    async def match_chunks(
        self,
        access_token: str,
        case_id: UUID,
        embedding: list[float],
        embedding_model: str,
        match_count: int,
        match_threshold: float,
    ) -> list[RetrievedChunk]:
        raise NotImplementedError


class EmbeddingGateway(Protocol):
    async def embed_documents(self, texts: Sequence[str]) -> list[list[float]]:
        raise NotImplementedError

    async def embed_query(self, text: str) -> list[float]:
        raise NotImplementedError


class AnswerGenerator(Protocol):
    async def generate(self, question: str, context_json: str) -> GeneratedAnswer:
        raise NotImplementedError
