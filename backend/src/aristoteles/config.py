"""Compatibility exports for the established analysis pipeline.

All runtime configuration starts from ``aristoteles_api.core.config`` so the
RAG API and multi-agent pipeline share provider/model defaults.  This wrapper
adds legacy multi-agent hardening knobs that are only used by ``aristoteles``.
"""

from functools import lru_cache

from pydantic import AliasChoices, Field, SecretStr, field_validator

from aristoteles_api.core.config import Settings as CoreSettings


class Settings(CoreSettings):
    openai_api_key: SecretStr | None = Field(
        default=None,
        validation_alias=AliasChoices("OPENAI_API_KEY", "OPENROUTER_API_KEY", "openai_api_key"),
    )
    insforge_anon_key: SecretStr | None = Field(
        default=None,
        validation_alias=AliasChoices("INSFORGE_ANON_KEY", "insforge_anon_key"),
    )
    insforge_api_key: SecretStr | None = Field(
        default=None,
        validation_alias=AliasChoices("INSFORGE_API_KEY", "insforge_api_key"),
    )
    langsmith_project: str = Field(
        "aristoteles",
        validation_alias=AliasChoices("LANGSMITH_PROJECT", "langsmith_project"),
    )
    aristoteles_min_retrieval_score: float = Field(
        0.72,
        ge=-1.0,
        le=1.0,
        validation_alias=AliasChoices(
            "ARISTOTELES_MIN_RETRIEVAL_SCORE", "aristoteles_min_retrieval_score"
        ),
    )
    max_agent_attempts: int = Field(
        2,
        ge=1,
        le=5,
        validation_alias=AliasChoices("ARISTOTELES_MAX_AGENT_ATTEMPTS", "max_agent_attempts"),
    )
    max_document_bytes: int = Field(
        25 * 1024 * 1024,
        gt=0,
        validation_alias=AliasChoices("ARISTOTELES_MAX_DOCUMENT_BYTES", "max_document_bytes"),
    )
    min_decision_confidence: float = Field(
        0.6,
        ge=0,
        le=1,
        validation_alias=AliasChoices(
            "ARISTOTELES_MIN_DECISION_CONFIDENCE", "min_decision_confidence"
        ),
    )
    cors_origins: str = Field(
        "http://localhost:3000,http://127.0.0.1:3000",
        validation_alias=AliasChoices("ARISTOTELES_CORS_ORIGINS", "cors_origins"),
    )

    @property
    def min_retrieval_score(self) -> float:
        return self.aristoteles_min_retrieval_score

    @field_validator("insforge_base_url", "supabase_url", mode="before")
    @classmethod
    def _empty_url_to_none(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @property
    def insforge_url(self) -> str:
        if self.insforge_base_url is None:
            raise RuntimeError("INSFORGE_BASE_URL or INSFORGE_URL is required")
        return str(self.insforge_base_url).rstrip("/")

    @property
    def database_url(self) -> str:
        return f"{self.insforge_url}/api/database"


@lru_cache
def get_settings() -> Settings:
    return Settings()


__all__ = ["Settings", "get_settings"]
