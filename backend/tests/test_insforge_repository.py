import json

import httpx
import pytest

from aristoteles.config import Settings
from aristoteles.insforge import InsForgeRepository


def _settings() -> Settings:
    return Settings(
        INSFORGE_URL="https://project.us-east.insforge.app",
        INSFORGE_API_KEY="secret",
    )


@pytest.mark.asyncio
async def test_records_use_official_database_path_and_unwrap_data() -> None:
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.method == "GET":
            return httpx.Response(200, json={"data": [{"id": "case-1"}]})
        return httpx.Response(200, json={"data": [{"id": "case-2", "title": "Demo"}]})

    repository = InsForgeRepository(
        _settings(), transport=httpx.MockTransport(handler)
    )

    selected = await repository.select_many("cases", {"owner_id": "eq.owner-1"})
    inserted = await repository.insert("cases", {"title": "Demo"})

    assert selected == [{"id": "case-1"}]
    assert inserted["id"] == "case-2"
    assert requests[0].url.path == "/api/database/records/cases"
    assert requests[0].url.params["owner_id"] == "eq.owner-1"
    assert requests[1].url.path == "/api/database/records/cases"
    assert requests[1].url.params["select"] == "*"
    assert requests[1].url.params["return"] == "representation"
    assert json.loads(requests[1].content) == [{"title": "Demo"}]


@pytest.mark.asyncio
async def test_rpc_uses_official_path_and_unwraps_data() -> None:
    seen: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return httpx.Response(200, json={"data": [{"id": "chunk-1", "similarity": 0.9}]})

    repository = InsForgeRepository(
        _settings(), transport=httpx.MockTransport(handler)
    )

    result = await repository.rpc("match_chunks", {"match_count": 8})

    assert result == [{"id": "chunk-1", "similarity": 0.9}]
    assert seen[0].url.path == "/api/database/rpc/match_chunks"
    assert json.loads(seen[0].content) == {"match_count": 8}
