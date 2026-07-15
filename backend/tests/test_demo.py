from io import BytesIO

from fastapi.testclient import TestClient

from aristoteles.api import app


def _pdf_bytes(lines: list[str] | None = None) -> bytes:
    lines = lines or [
        f"Proveedor A ofrece garantia de 24 meses, entrega en 5 dias y precio competitivo {i}."
        for i in range(18)
    ]
    text_commands = "\n".join(
        f"BT /F1 10 Tf 40 {760 - index * 18} Td ({line}) Tj ET"
        for index, line in enumerate(lines)
    )
    stream = text_commands.encode()
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
    ]
    body = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(body))
        body.extend(f"{index} 0 obj\n".encode())
        body.extend(obj)
        body.extend(b"\nendobj\n")
    xref_at = len(body)
    body.extend(f"xref\n0 {len(objects) + 1}\n".encode())
    body.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        body.extend(f"{offset:010d} 00000 n \n".encode())
    body.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_at}\n%%EOF\n".encode()
    )
    return bytes(body)


def test_demo_agent_accepts_pdf_and_returns_agent_flow() -> None:
    client = TestClient(app)
    response = client.post(
        "/v1/demo/agent",
        data={"objective": "Comparar proveedores"},
        files={"file": ("cotizacion.pdf", BytesIO(_pdf_bytes()), "application/pdf")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["document"]["filename"] == "cotizacion.pdf"
    assert payload["document"]["pages"] == 1
    assert [stage["id"] for stage in payload["stages"]] == [
        "planner",
        "document",
        "research",
        "comparison",
        "decision",
    ]
    assert payload["suggested_criteria"] == payload["criteria"]
    assert "Proveedor A" in payload["extracted_page_previews"][0]["preview"]
    assert payload["confidence"]["score"] == payload["decision"]["confidence"]["score"]
    assert payload["analysis_mode"] == "deterministic_multiagent_demo"
    assert set(payload["agent_outputs"]) == {
        "planner",
        "document",
        "research",
        "comparison",
        "decision",
    }


def test_demo_agent_accepts_multiple_pdfs() -> None:
    client = TestClient(app)
    response = client.post(
        "/v1/demo/agent",
        data={"objective": "Comparar proveedores"},
        files=[
            ("files", ("cotizacion-a.pdf", BytesIO(_pdf_bytes()), "application/pdf")),
            ("files", ("cotizacion-b.pdf", BytesIO(_pdf_bytes()), "application/pdf")),
        ],
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["documents"] == [
        {"filename": "cotizacion-a.pdf", "pages": 1, "quality_score": 1.0},
        {"filename": "cotizacion-b.pdf", "pages": 1, "quality_score": 1.0},
    ]
    assert payload["document"]["pages"] == 2
    assert {item["document"] for item in payload["research"]["evidence"]} == {
        "cotizacion-a.pdf",
        "cotizacion-b.pdf",
    }


def test_demo_agent_ranks_multiple_pdfs_by_decision_signals() -> None:
    client = TestClient(app)
    strong_offer = [
        f"Proveedor fuerte ofrece garantia de 36 meses, entrega en 5 dias, cumple SLA y precio competitivo {i}."
        for i in range(18)
    ]
    weak_offer = [
        f"Proveedor debil ofrece garantia de 6 meses, entrega en 30 dias, costo adicional y penalidad {i}."
        for i in range(18)
    ]
    response = client.post(
        "/v1/demo/agent",
        data={"objective": "Elegir la mejor empresa y explicar beneficios y desventajas"},
        files=[
            ("files", ("oferta-fuerte.pdf", BytesIO(_pdf_bytes(strong_offer)), "application/pdf")),
            ("files", ("oferta-debil.pdf", BytesIO(_pdf_bytes(weak_offer)), "application/pdf")),
        ],
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["decision"]["recommended_provider_id"] == "Oferta Fuerte"
    assert "La mejor opcion es Oferta Fuerte" in payload["answer"]
    assert payload["comparison"][0]["advantages"]
    assert payload["comparison"][0]["disadvantages"]


def test_demo_agent_rejects_non_pdf_content_type() -> None:
    client = TestClient(app)
    response = client.post(
        "/v1/demo/agent",
        data={"objective": "Comparar proveedores"},
        files={"file": ("cotizacion.txt", BytesIO(b"not a pdf"), "text/plain")},
    )

    assert response.status_code == 400
