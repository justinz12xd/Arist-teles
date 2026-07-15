from typing import Any

import pytest

from aristoteles.agents import AgentRuntime, parse_json
from aristoteles.config import Settings


def test_parse_json_accepts_fenced_top_level_list() -> None:
    payload = parse_json('```json\n[{"provider_id":"a"}]\n```')

    assert payload == [{"provider_id": "a"}]


@pytest.mark.asyncio
async def test_agent_retries_invalid_output_up_to_configured_attempts() -> None:
    class Agent:
        def __init__(self) -> None:
            self.calls = 0

        async def ainvoke(self, _: dict[str, Any]) -> dict[str, Any]:
            self.calls += 1
            content = "not-json" if self.calls == 1 else '{"ok": true}'
            return {"messages": [{"content": content}]}

    agent = Agent()
    runtime = AgentRuntime(
        Settings(
            INSFORGE_URL="https://project.us-east.insforge.app",
            OPENAI_API_KEY="test-key",
            ARISTOTELES_MAX_AGENT_ATTEMPTS=2,
        )
    )
    runtime.build = lambda role: agent  # type: ignore[method-assign]

    result = await runtime.run("research", "test")

    assert result == {"ok": True}
    assert agent.calls == 2


@pytest.mark.asyncio
async def test_plan_retries_pydantic_invalid_payload_then_accepts_valid_payload() -> None:
    class Agent:
        def __init__(self) -> None:
            self.calls = 0

        async def ainvoke(self, _: dict[str, Any]) -> dict[str, Any]:
            self.calls += 1
            tasks = [] if self.calls == 1 else [{"agent": "research", "goal": "Extraer"}]
            return {
                "messages": [
                    {
                        "content": (
                            '{"objective":"Comparar","tasks":'
                            f'{__import__("json").dumps(tasks)},"status":"awaiting_criteria"}}'
                        )
                    }
                ]
            }

    agent = Agent()
    runtime = AgentRuntime(
        Settings(
            INSFORGE_URL="https://project.us-east.insforge.app",
            OPENAI_API_KEY="test-key",
            ARISTOTELES_MAX_AGENT_ATTEMPTS=2,
        )
    )
    runtime.build = lambda role: agent  # type: ignore[method-assign]

    plan = await runtime.plan("Comparar", [])

    assert len(plan.tasks) == 1
    assert agent.calls == 2
