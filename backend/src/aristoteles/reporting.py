from html import escape
from typing import Any

from weasyprint import HTML


def render_html(report: dict[str, Any]) -> str:
    decision = report.get("decision", {})
    risks = decision.get("risk_items", [])
    risk_markup = (
        "".join(f"<li>{escape(str(item))}</li>" for item in risks) or "<li>Ninguno registrado</li>"
    )
    provider = escape(str(decision.get("recommended_provider_id") or "Revisión humana requerida"))
    summary = escape(str(decision.get("summary", "")))
    confidence = decision.get("confidence", {})
    band = escape(str(confidence.get("band", "unknown")))
    score = escape(str(confidence.get("score", "n/d")))
    return f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Reporte Aristóteles</title>
<style>
body{{font-family:Arial,sans-serif;color:#18233b;margin:40px}}
h1{{color:#173783}}
.metric{{display:inline-block;margin-right:24px}}
.label{{color:#596579;font-size:12px;text-transform:uppercase}}
li{{margin:8px 0}}
</style>
</head><body><h1>Recomendación Aristóteles</h1>
<div class="metric"><div class="label">Alternativa</div><strong>{provider}</strong></div>
<div class="metric"><div class="label">Confianza</div><strong>{band} ({score})</strong></div>
<h2>Resumen</h2><p>{summary}</p><h2>Riesgos</h2><ul>{risk_markup}</ul>
</body></html>"""


def render_pdf(report: dict[str, Any]) -> bytes:
    return HTML(string=render_html(report)).write_pdf()
