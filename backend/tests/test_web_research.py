import pytest

from aristoteles.contracts import ResearchMode
from aristoteles.web_research import WebResearchService
from aristoteles_api.core.config import Settings


class _FakeResponses:
    def __init__(self) -> None:
        self.request: dict | None = None

    async def create(self, **kwargs):  # type: ignore[no-untyped-def]
        self.request = kwargs
        return {
            "output_text": "La evidencia apunta a una conclusión prudente. [1]",
            "output": [
                {
                    "type": "message",
                    "content": [
                        {
                            "annotations": [
                                {
                                    "type": "url_citation",
                                    "url": "https://example.com/source",
                                    "title": "Fuente primaria",
                                    "start_index": 48,
                                    "end_index": 51,
                                }
                            ]
                        }
                    ],
                }
            ],
        }


class _FakeClient:
    def __init__(self) -> None:
        self.responses = _FakeResponses()


@pytest.mark.asyncio
async def test_web_research_uses_fast_model_and_returns_clickable_citations() -> None:
    client = _FakeClient()
    service = WebResearchService(Settings(_env_file=None), client=client)  # type: ignore[arg-type]

    response = await service.answer(objective="¿Qué dice la fuente?", mode=ResearchMode.web)

    assert response.mode == ResearchMode.web
    assert response.model == "gpt-5.6-luna"
    assert response.citations[0].url == "https://example.com/source"
    assert client.responses.request is not None
    assert client.responses.request["tools"] == [{"type": "web_search"}]


@pytest.mark.asyncio
async def test_auto_mode_becomes_hybrid_when_documents_are_present() -> None:
    client = _FakeClient()
    service = WebResearchService(Settings(_env_file=None), client=client)  # type: ignore[arg-type]

    response = await service.answer(
        objective="Contrasta este contrato", documents=["Garantía de 24 meses"]
    )

    assert response.mode == ResearchMode.hybrid
    assert "Garantía de 24 meses" in client.responses.request["input"][1]["content"]
