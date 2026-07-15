from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local", "backend/.env", "backend/.env.local", "../.env.local"),
        extra="ignore",
    )

    insforge_url: str = Field(..., alias="INSFORGE_URL")
    insforge_anon_key: str | None = Field(default=None, alias="INSFORGE_ANON_KEY")
    insforge_api_key: str | None = Field(default=None, alias="INSFORGE_API_KEY")
    openrouter_api_key: str | None = Field(default=None, alias="OPENROUTER_API_KEY")
    openrouter_base_url: str = Field("https://openrouter.ai/api/v1", alias="OPENROUTER_BASE_URL")
    openrouter_chat_model: str = Field("openai/gpt-4o-mini", alias="OPENROUTER_CHAT_MODEL")
    openrouter_embedding_model: str = Field(
        "openai/text-embedding-3-small", alias="OPENROUTER_EMBEDDING_MODEL"
    )
    langsmith_tracing: bool = Field(False, alias="LANGSMITH_TRACING")
    langsmith_project: str = Field("aristoteles", alias="LANGSMITH_PROJECT")
    min_retrieval_score: float = Field(0.72, alias="ARISTOTELES_MIN_RETRIEVAL_SCORE")
    max_agent_attempts: int = Field(2, alias="ARISTOTELES_MAX_AGENT_ATTEMPTS")

    @property
    def rest_url(self) -> str:
        return self.insforge_url.rstrip("/") + "/rest/v1"


@lru_cache
def get_settings() -> Settings:
    return Settings()
