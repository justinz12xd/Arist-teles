import pytest
from pydantic import ValidationError

from aristoteles_api.core.config import Settings


def test_settings_allow_health_without_provider_credentials() -> None:
    settings = Settings(_env_file=None)

    assert settings.openai_api_key is None
    assert settings.insforge_base_url is None
    assert settings.rag_default_top_k == 5


def test_overlap_must_be_smaller_than_chunk_size() -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, rag_chunk_tokens=100, rag_chunk_overlap_tokens=100)


def test_default_top_k_cannot_exceed_configured_maximum() -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, rag_default_top_k=6, rag_max_top_k=5)


def test_embedding_dimensions_match_the_vector_schema() -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, openai_embedding_dimensions=3072)
