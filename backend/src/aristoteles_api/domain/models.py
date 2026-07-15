from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from typing import Literal, Self
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator


@dataclass(frozen=True, slots=True)
class AuthContext:
    user_id: UUID
    access_token: str = field(repr=False)


class CaseCreate(BaseModel):
    objective: str = Field(min_length=1, max_length=2_000)


class CaseResponse(BaseModel):
    id: UUID
    objective: str
    created_at: datetime


class CaseRecord(BaseModel):
    id: UUID
    objective: str
    created_at: datetime


class DocumentPage(BaseModel):
    page: int = Field(ge=1)
    text: str = Field(min_length=1, max_length=100_000)

    @field_validator("text")
    @classmethod
    def reject_blank_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("page text cannot be blank")
        return value


class TextDocumentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    pages: list[DocumentPage] = Field(min_length=1)

    @model_validator(mode="after")
    def pages_are_unique(self) -> Self:
        numbers = [page.page for page in self.pages]
        if len(numbers) != len(set(numbers)):
            raise ValueError("page numbers must be unique")
        return self


class DocumentStatus(StrEnum):
    INDEXING = "indexing"
    INDEXED = "indexed"
    FAILED = "failed"


class DocumentRecord(BaseModel):
    id: UUID
    case_id: UUID
    name: str
    source_hash: str
    embedding_model: str
    status: DocumentStatus
    chunk_count: int = Field(ge=0)


class ChunkDraft(BaseModel):
    page: int = Field(ge=1)
    chunk_index: int = Field(ge=0)
    content: str = Field(min_length=1)
    content_hash: str = Field(min_length=1)
    token_count: int = Field(ge=1)


class StoredChunkDraft(ChunkDraft):
    document_id: UUID
    case_id: UUID
    embedding_model: str
    embedding: list[float]


class RetrievedChunk(BaseModel):
    id: UUID
    document_id: UUID
    document_name: str
    page: int = Field(ge=1)
    content: str
    similarity: float


class DocumentIndexResponse(BaseModel):
    document_id: UUID
    status: DocumentStatus
    chunk_count: int = Field(ge=0)
    source_hash: str
    already_indexed: bool


class QuestionRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4_000)
    top_k: int = Field(default=5, ge=1, le=10)


class GeneratedAnswer(BaseModel):
    answer: str
    source_ids: list[str]
    insufficient_context: bool


class Citation(BaseModel):
    source_id: str
    chunk_id: UUID
    document_id: UUID
    document_name: str
    page: int = Field(ge=1)
    quote: str
    similarity: float


class QuestionResponse(BaseModel):
    status: Literal["answered", "insufficient_context"]
    answer: str
    citations: list[Citation]
