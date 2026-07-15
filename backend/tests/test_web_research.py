import pytest

from aristoteles.contracts import ResearchMode
from aristoteles.web_research import ResearchRoadmapDraft, WebResearchService
from aristoteles_api.core.config import Settings


class _FakeResponses:
    def __init__(self) -> None:
        self.request: dict | None = None
        self.parse_request: dict | None = None

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

    async def parse(self, **kwargs):  # type: ignore[no-untyped-def]
        self.parse_request = kwargs
        return {
            "output_parsed": ResearchRoadmapDraft(
                objective="Lanzar el producto con evidencia",
                options=[
                    {
                        "option_id": "pilot",
                        "label": "Piloto controlado",
                        "score": 0.91,
                        "milestones": [
                            "Validar el problema",
                            "Probar con usuarios",
                            "Medir resultados",
                        ],
                        "risks": ["Muestra inicial pequeña"],
                        "next_action": "Seleccionar cinco usuarios piloto",
                        "recommended": True,
                    },
                    {
                        "option_id": "full-launch",
                        "label": "Lanzamiento completo",
                        "score": 0.63,
                        "milestones": [
                            "Construir todas las funciones",
                            "Publicar para todos",
                        ],
                        "risks": ["Mayor costo antes de validar"],
                        "next_action": "Definir el alcance completo",
                    },
                ],
                resolution="Empezar por el piloto y ampliar solo después de medir.",
            )
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


@pytest.mark.asyncio
async def test_conversation_context_is_added_to_prompt() -> None:
    client = _FakeClient()
    service = WebResearchService(Settings(_env_file=None), client=client)  # type: ignore[arg-type]

    await service.answer(
        objective="¿Qué hago con esto?",
        mode=ResearchMode.web,
        conversation_context=(
            "Usuario: Estamos evaluando la ruta "
            "'Recopilación mínima y roadmap provisional'."
        ),
    )

    assert client.responses.request is not None
    assert "Contexto conversacional previo" in client.responses.request["input"][1]["content"]
    assert (
        "Recopilación mínima y roadmap provisional"
        in client.responses.request["input"][1]["content"]
    )


@pytest.mark.asyncio
async def test_roadmap_request_returns_visual_decision_paths() -> None:
    client = _FakeClient()
    service = WebResearchService(Settings(_env_file=None), client=client)  # type: ignore[arg-type]

    response = await service.answer(
        objective="Crea un roadmap con el mejor camino para lanzar el producto",
        mode=ResearchMode.web,
    )

    assert response.roadmap is not None
    assert response.roadmap.recommended_option_id == "pilot"
    assert response.roadmap.paths[0].status == "recommended"
    assert response.roadmap.paths[0].checkpoints[0].value == "Validar el problema"
    assert sum(item.weight for item in response.roadmap.criteria) == 1
    assert client.responses.parse_request is not None
    assert client.responses.parse_request["model"] == "gpt-5.6-luna"


@pytest.mark.asyncio
async def test_include_roadmap_false_skips_visual_roadmap_even_if_requested() -> None:
    client = _FakeClient()
    service = WebResearchService(Settings(_env_file=None), client=client)  # type: ignore[arg-type]

    response = await service.answer(
        objective="Crea un roadmap con el mejor camino para lanzar el producto",
        mode=ResearchMode.web,
        include_roadmap=False,
    )

    assert response.roadmap is None
    assert client.responses.parse_request is None
