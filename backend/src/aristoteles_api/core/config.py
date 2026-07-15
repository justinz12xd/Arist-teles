from functools import lru_cache
from typing import Self

from pydantic import AliasChoices, AnyHttpUrl, Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Single configuration contract for the API, agents, and RAG services."""

    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local", "backend/.env", "backend/.env.local", "../.env.local"),
        extra="ignore",
    )

    openai_api_key: SecretStr | None = None
    openai_fast_model: str = "gpt-5.6-luna"
    openai_verify_model: str = "gpt-5.6-terra"
    openai_deep_model: str = "gpt-5.6-sol"
    openai_embedding_model: str = "text-embedding-3-small"
    openai_embedding_dimensions: int = Field(default=1536, gt=0)
    insforge_base_url: AnyHttpUrl | None = Field(
        default=None,
        validation_alias=AliasChoices("INSFORGE_BASE_URL", "INSFORGE_URL"),
    )
    insforge_anon_key: SecretStr | None = None
    insforge_api_key: SecretStr | None = None
    aristoteles_api_shared_secret: SecretStr | None = None
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

    @property
    def rest_url(self) -> str:
        if self.insforge_base_url is None:
            raise RuntimeError("INSFORGE_BASE_URL is required for database operations")
        return f"{str(self.insforge_base_url).rstrip('/')}/rest/v1"

    @property
    def min_retrieval_score(self) -> float:
        """Compatibility name used by the established analysis pipeline."""
        return self.rag_min_similarity

    def model_for_agent(self, agent_name: str) -> str:
        """Keep the interactive path fast and escalate only decision-critical work."""
        if agent_name in {"comparison", "decision", "verification"}:
            return self.openai_verify_model
        if agent_name == "deep_research":
            return self.openai_deep_model
        return self.openai_fast_model

    @model_validator(mode="after")
    def validate_rag_ranges(self) -> Self:
        if self.rag_chunk_overlap_tokens >= self.rag_chunk_tokens:
            raise ValueError("RAG_CHUNK_OVERLAP_TOKENS must be smaller than RAG_CHUNK_TOKENS")
        if self.rag_default_top_k > self.rag_max_top_k:
            raise ValueError("RAG_DEFAULT_TOP_K cannot exceed RAG_MAX_TOP_K")
        if self.openai_embedding_dimensions != 1536:
            raise ValueError("The current migration requires 1536-dimensional embeddings")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
