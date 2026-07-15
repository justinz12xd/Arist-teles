from fastapi.testclient import TestClient

from aristoteles_api.main import create_app


def test_health_does_not_require_external_credentials() -> None:
    with TestClient(create_app()) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
