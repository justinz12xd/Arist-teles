from aristoteles.reporting import render_html, render_pdf


def test_report_rendering_escapes_untrusted_text() -> None:
    report = {
        "decision": {
            "recommended_provider_id": "<script>alert(1)</script>",
            "summary": "Proveedor A < mejor",
            "risk_items": ["Dato <faltante>"],
            "confidence": {"band": "low", "score": 0.3},
        },
        "roadmap": {
            "objective": "Elegir <proveedor>",
            "paths": [
                {
                    "label": "Proveedor <B>",
                    "status": "recommended",
                    "score": 0.8,
                    "next_action": "Validar <anticipo>",
                }
            ],
        },
    }
    html = render_html(report)
    assert "&lt;script&gt;" in html
    assert "<script>" not in html
    assert "Elegir &lt;proveedor&gt;" in html
    assert "Proveedor &lt;B&gt;" in html
    assert render_pdf(report).startswith(b"%PDF")
