from __future__ import annotations

from collections import Counter
from dataclasses import asdict
from typing import Any

from fastapi import File, Form, HTTPException, UploadFile

from .extraction import ExtractedPage, extract_pdf


CRITERIA = [
    {"key": "price", "label": "Precio y costos", "weight": 0.3},
    {"key": "warranty", "label": "Garantia", "weight": 0.25},
    {"key": "delivery", "label": "Plazo de entrega", "weight": 0.2},
    {"key": "compliance", "label": "Cumplimiento", "weight": 0.15},
    {"key": "risk", "label": "Riesgos y restricciones", "weight": 0.1},
]


def _preview(text: str, limit: int = 520) -> str:
    clean = " ".join(text.split())
    if len(clean) <= limit:
        return clean
    return clean[: limit - 1].rstrip() + "..."


def _keywords(text: str) -> list[str]:
    words = [
        word.strip(".,;:()[]{}!?").lower()
        for word in text.split()
        if len(word.strip(".,;:()[]{}!?")) >= 5
    ]
    ignored = {"proveedor", "documento", "servicio", "condiciones", "oferta", "fecha"}
    counts = Counter(word for word in words if word not in ignored)
    return [word for word, _ in counts.most_common(6)]


def _detect_providers(text: str) -> list[str]:
    providers: list[str] = []
    lowered = text.lower()
    for label in ["proveedor a", "proveedor b", "proveedor c", "provider a", "provider b"]:
        if label in lowered:
            providers.append(label.title())
    if not providers:
        providers = ["Alternativa A", "Alternativa B"]
    return providers[:3]


def build_demo_agent_result(objective: str, filename: str, pages: list[ExtractedPage]) -> dict[str, Any]:
    extracted_text = "\n\n".join(page.text for page in pages if page.text.strip())
    page_previews = [
        {
            "page_number": page.page_number,
            "method": page.method,
            "quality_score": page.quality_score,
            "preview": _preview(page.text) or "No se pudo extraer texto de esta pagina.",
        }
        for page in pages
    ]
    keywords = _keywords(extracted_text)
    providers = _detect_providers(extracted_text)
    quality = sum(page.quality_score for page in pages) / len(pages) if pages else 0
    has_text = bool(extracted_text.strip())
    confidence_score = round(max(0.18, min(0.86, quality * (0.75 if has_text else 0.35))), 2)
    confidence_band = "high" if confidence_score >= 0.8 else "medium" if confidence_score >= 0.6 else "low"
    outcome = "recommendation" if has_text and confidence_score >= 0.55 else "needs_review"
    recommended = providers[0] if outcome == "recommendation" else None

    evidence = [
        {
            "id": f"E{index}",
            "document": filename,
            "page": page.page_number,
            "quote": _preview(page.text, 180) or "Texto no disponible",
        }
        for index, page in enumerate(pages[:4], start=1)
    ]

    stages = {
        "planner": {
            "id": "planner",
            "agent": "Planner Agent",
            "status": "completed",
            "summary": "Objetivo recibido y criterios iniciales propuestos.",
        },
        "document": {
            "id": "document",
            "agent": "Document Agent",
            "status": "completed" if pages else "needs_review",
            "summary": f"{len(pages)} paginas procesadas desde {filename}.",
        },
        "research": {
            "id": "research",
            "agent": "Research Agent",
            "status": "completed" if has_text else "needs_review",
            "summary": (
                "Hechos extraidos: " + ", ".join(keywords[:4])
                if keywords
                else "No hay texto suficiente para extraer hechos confiables."
            ),
        },
        "comparison": {
            "id": "comparison",
            "agent": "Comparison Agent",
            "status": "completed" if has_text else "needs_review",
            "summary": f"Alternativas detectadas: {', '.join(providers)}.",
        },
        "decision": {
            "id": "decision",
            "agent": "Decision Agent",
            "status": "completed" if outcome == "recommendation" else "needs_review",
            "summary": (
                f"Recomendacion preliminar: {recommended}."
                if recommended
                else "Se requiere revision humana por evidencia insuficiente."
            ),
        },
    }

    confidence = {
        "score": confidence_score,
        "band": confidence_band,
        "coverage": round(0.7 if has_text else 0.2, 2),
        "citation_support": round(0.76 if evidence else 0.0, 2),
        "consistency": round(0.68 if has_text else 0.25, 2),
        "extraction_quality": round(quality, 2),
    }

    return {
        "objective": objective,
        "document": {
            "filename": filename,
            "pages": len(pages),
            "quality_score": round(quality, 2),
            "previews": page_previews,
        },
        "stages": stages,
        "criteria": CRITERIA,
        "suggested_criteria": CRITERIA,
        "extracted_page_previews": page_previews,
        "confidence": confidence,
        "research": {
            "keywords": keywords,
            "evidence": evidence,
        },
        "comparison": [
            {
                "provider_id": provider,
                "criteria": [
                    {
                        "key": criterion["key"],
                        "value": "Detectado en evidencia" if has_text else None,
                        "normalized_score": round(max(0.2, confidence_score - index * 0.06), 2),
                        "missing": not has_text,
                    }
                    for index, criterion in enumerate(CRITERIA)
                ],
                "advantages": ["Mayor respaldo documental"] if provider == providers[0] and has_text else [],
                "disadvantages": [] if has_text else ["Falta texto extraible"],
            }
            for provider in providers
        ],
        "decision": {
            "outcome": outcome,
            "recommended_provider_id": recommended,
            "summary": (
                f"{recommended} aparece como mejor alternativa preliminar segun el texto extraido."
                if recommended
                else "No hay evidencia suficiente para recomendar una alternativa."
            ),
            "risk_items": [
                "Validar montos, plazos y garantias contra el documento original.",
                "Confirmar que todos los proveedores relevantes esten incluidos.",
            ],
            "confidence": confidence,
            "evidence_ids": [item["id"] for item in evidence],
        },
        "raw_pages": [asdict(page) for page in pages],
    }


async def demo_agent_endpoint(
    objective: str = Form(..., min_length=1),
    file: UploadFile = File(...),
) -> dict[str, Any]:
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=415, detail="Only application/pdf files are supported")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="PDF file is empty")
    try:
        pages = extract_pdf(data)
    except Exception as exc:  # pragma: no cover - PyMuPDF raises several concrete errors.
        raise HTTPException(status_code=400, detail="PDF could not be processed") from exc
    return build_demo_agent_result(objective, file.filename or "documento.pdf", pages)
