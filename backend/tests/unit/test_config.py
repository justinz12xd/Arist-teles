import pytest
from pydantic import ValidationError

from aristoteles_api.core.config import Settings


def test_settings_allow_health_without_provider_credentials() -> None:
    settings = Settings(_env_file=None)

    assert settings.openai_api_key is None
    assert settings.insforge_base_url is None
    assert settings.rag_default_top_k == 5
    assert settings.model_for_agent("planner") == "gpt-5.6-luna"
    assert settings.model_for_agent("decision") == "gpt-5.6-terra"


def test_settings_accept_legacy_insforge_url_without_a_second_config() -> None:
    settings = Settings(_env_file=None, INSFORGE_URL="https://example.insforge.app")

    assert settings.rest_url == "https://example.insforge.app/rest/v1"


def test_overlap_must_be_smaller_than_chunk_size() -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, rag_chunk_tokens=100, rag_chunk_overlap_tokens=100)


def test_default_top_k_cannot_exceed_configured_maximum() -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, rag_default_top_k=6, rag_max_top_k=5)


def test_embedding_dimensions_match_the_vector_schema() -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, openai_embedding_dimensions=3072)


def test_settings_accept_supabase_url() -> None:
    settings = Settings(
        _env_file=None,
        SUPABASE_URL="https://example.supabase.co",
        SUPABASE_PUBLISHABLE_KEY="sb_publishable_example",
    )

    assert settings.supabase_rest_url == "https://example.supabase.co/rest/v1"
    assert settings.supabase_publishable_key is not None