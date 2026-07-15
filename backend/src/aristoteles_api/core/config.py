from typing import Self

from pydantic import AnyHttpUrl, Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: SecretStr | None = None
    openai_chat_model: str = "gpt-4.1-mini"
    openai_embedding_model: str = "text-embedding-3-small"
    openai_embedding_dimensions: int = Field(default=1536, gt=0)
    insforge_base_url: AnyHttpUrl | None = None
    rag_chunk_tokens: int = Field(default=700, gt=0)
    rag_chunk_overlap_tokens: int = Field(default=100, ge=0)
    rag_embedding_batch_size: int = Field(default=64, ge=1, le=64)
    rag_default_top_k: int = Field(default=5, ge=1, le=10)
    rag_max_top_k: int = Field(default=10, ge=1, le=10)
    rag_min_similarity: float = Field(default=0.20, ge=-1.0, le=1.0)
    rag_max_document_pages: int = Field(default=250, ge=1)
    rag_max_document_chars: int = Field(default=2_000_000, ge=1)
    rag_max_question_chars: int = Field(default=4_000, ge=1)
    provider_timeout_seconds: float = Field(default=30, gt=0)
    provider_max_retries: int = Field(default=2, ge=0)

    @model_validator(mode="after")
    def validate_rag_ranges(self) -> Self:
        if self.rag_chunk_overlap_tokens >= self.rag_chunk_tokens:
            raise ValueError("RAG_CHUNK_OVERLAP_TOKENS must be smaller than RAG_CHUNK_TOKENS")
        if self.rag_default_top_k > self.rag_max_top_k:
            raise ValueError("RAG_DEFAULT_TOP_K cannot exceed RAG_MAX_TOP_K")
        if self.openai_embedding_dimensions != 1536:
            raise ValueError("The current migration requires 1536-dimensional embeddings")
        return self
