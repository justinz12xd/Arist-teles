from fastapi.testclient import TestClient

from aristoteles_api.main import create_app


def test_health_does_not_require_external_credentials() -> None:
    with TestClient(create_app()) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_agent_demo_route_is_registered() -> None:
    paths = set(create_app().openapi()["paths"])

    assert "/v1/demo/agent" in paths
    assert "/v1/chat/research" in paths
    assert "/v1/cases" in paths
    assert "/v1/runs/{run_id}/report" in paths
