from __future__ import annotations

import re
from collections import Counter
from dataclasses import asdict
from pathlib import Path
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

SYNTHETIC_OPTIONS = [
    {
        "domain": "suppliers",
        "triggers": ["proveedor", "cotizacion", "compra", "empresa", "servicio"],
        "options": [
            {
                "provider_id": "Proveedor A",
                "scores": {"price": 0.72, "warranty": 0.92, "delivery": 0.86, "compliance": 0.88, "risk": 0.76},
                "advantages": ["Garantia amplia", "Entrega rapida", "Buen cumplimiento documental"],
                "disadvantages": ["Precio no necesariamente mas bajo", "Requiere validar costos adicionales"],
            },
            {
                "provider_id": "Proveedor B",
                "scores": {"price": 0.9, "warranty": 0.64, "delivery": 0.68, "compliance": 0.76, "risk": 0.62},
                "advantages": ["Mejor precio inicial", "Condiciones simples de contratacion"],
                "disadvantages": ["Garantia mas corta", "Mayor riesgo si el soporte es critico"],
            },
            {
                "provider_id": "Proveedor C",
                "scores": {"price": 0.66, "warranty": 0.78, "delivery": 0.58, "compliance": 0.92, "risk": 0.8},
                "advantages": ["Alta alineacion con requisitos", "Menor riesgo operativo"],
                "disadvantages": ["Entrega mas lenta", "Menor ventaja economica"],
            },
        ],
    },
    {
        "domain": "crm",
        "triggers": ["crm", "ventas", "clientes", "pipeline", "comercial"],
        "options": [
            {
                "provider_id": "HubSpot",
                "scores": {"price": 0.68, "warranty": 0.76, "delivery": 0.9, "compliance": 0.84, "risk": 0.78},
                "advantages": ["Implementacion rapida", "Interfaz clara", "Buen ecosistema de marketing"],
                "disadvantages": ["Costo sube al crecer", "Menor flexibilidad en procesos complejos"],
            },
            {
                "provider_id": "Salesforce",
                "scores": {"price": 0.52, "warranty": 0.86, "delivery": 0.58, "compliance": 0.95, "risk": 0.82},
                "advantages": ["Muy configurable", "Fuerte para equipos grandes", "Gobernanza madura"],
                "disadvantages": ["Implementacion costosa", "Requiere administracion especializada"],
            },
            {
                "provider_id": "Zoho CRM",
                "scores": {"price": 0.9, "warranty": 0.68, "delivery": 0.78, "compliance": 0.72, "risk": 0.66},
                "advantages": ["Precio competitivo", "Suite amplia", "Buen punto de entrada"],
                "disadvantages": ["Menos robusto para procesos empresariales complejos", "Integraciones variables"],
            },
        ],
    },
    {
        "domain": "apps",
        "triggers": ["app", "software", "proyecto", "tareas", "gestion", "equipo"],
        "options": [
            {
                "provider_id": "ClickUp",
                "scores": {"price": 0.78, "warranty": 0.72, "delivery": 0.86, "compliance": 0.8, "risk": 0.66},
                "advantages": ["Muchas funciones en un solo lugar", "Buen balance costo/capacidad"],
                "disadvantages": ["Puede sentirse cargado", "Requiere disciplina de configuracion"],
            },
            {
                "provider_id": "Asana",
                "scores": {"price": 0.66, "warranty": 0.74, "delivery": 0.84, "compliance": 0.78, "risk": 0.8},
                "advantages": ["Experiencia simple", "Buen seguimiento de trabajo", "Menor curva de adopcion"],
                "disadvantages": ["Menos flexible para flujos tecnicos", "Funciones avanzadas pueden encarecerse"],
            },
            {
                "provider_id": "Jira",
                "scores": {"price": 0.62, "warranty": 0.82, "delivery": 0.62, "compliance": 0.9, "risk": 0.76},
                "advantages": ["Excelente para equipos tecnicos", "Trazabilidad fuerte", "Automatizaciones maduras"],
                "disadvantages": ["Mas complejo para usuarios no tecnicos", "Configuracion inicial pesada"],
            },
        ],
    },
    {
        "domain": "cloud",
        "triggers": ["cloud", "nube", "hosting", "infraestructura", "servidor"],
        "options": [
            {
                "provider_id": "AWS",
                "scores": {"price": 0.58, "warranty": 0.9, "delivery": 0.82, "compliance": 0.94, "risk": 0.84},
                "advantages": ["Catalogo mas amplio", "Alta madurez empresarial", "Cobertura global"],
                "disadvantages": ["Costos dificiles de controlar", "Curva de aprendizaje alta"],
            },
            {
                "provider_id": "Azure",
                "scores": {"price": 0.62, "warranty": 0.86, "delivery": 0.78, "compliance": 0.9, "risk": 0.82},
                "advantages": ["Muy fuerte con Microsoft", "Buen gobierno corporativo"],
                "disadvantages": ["Puede depender mucho del ecosistema Microsoft", "Complejidad de licencias"],
            },
            {
                "provider_id": "Google Cloud",
                "scores": {"price": 0.7, "warranty": 0.8, "delivery": 0.84, "compliance": 0.82, "risk": 0.76},
                "advantages": ["Fuerte en datos e IA", "Buena red global", "Servicios modernos"],
                "disadvantages": ["Menor presencia en algunas industrias", "Menos talento disponible en ciertos mercados"],
            },
        ],
    },
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


def _select_synthetic_options(objective: str, text: str, providers: list[str]) -> list[dict[str, Any]]:
    combined = f"{objective} {text}".lower()
    domain = next(
        (
            item
            for item in SYNTHETIC_OPTIONS
            if any(trigger in combined for trigger in item["triggers"])
        ),
        SYNTHETIC_OPTIONS[0],
    )
    options = [dict(option) for option in domain["options"]]
    if providers:
        for index, provider in enumerate(providers):
            if index < len(options):
                options[index] = {**options[index], "provider_id": provider}
    return options[: max(2, min(3, len(options)))]


def _weighted_score(option: dict[str, Any]) -> float:
    scores = option["scores"]
    return round(sum(criterion["weight"] * scores[criterion["key"]] for criterion in CRITERIA), 2)


def _criterion_label(key: str) -> str:
    return next(criterion["label"] for criterion in CRITERIA if criterion["key"] == key)


def _document_text(document: dict[str, Any]) -> str:
    return "\n".join(page.text for page in document["pages"] if page.text.strip())


def _document_option(document: dict[str, Any], index: int) -> dict[str, Any]:
    text = _document_text(document).lower()
    base = SYNTHETIC_OPTIONS[0]["options"][min(index, len(SYNTHETIC_OPTIONS[0]["options"]) - 1)]
    scores = dict(base["scores"])
    advantages: list[str] = []
    disadvantages: list[str] = []

    warranty_match = re.search(r"garant(?:ia|i?a)\D{0,20}(\d{1,3})\s*(mes|meses|ano|anos|año|años)", text)
    if warranty_match:
        months = int(warranty_match.group(1)) * (12 if warranty_match.group(2).startswith(("ano", "año")) else 1)
        if months >= 24:
            scores["warranty"] = max(scores["warranty"], 0.92)
            advantages.append(f"Garantia fuerte de {months} meses")
        elif months >= 12:
            scores["warranty"] = max(scores["warranty"], 0.7)
            advantages.append(f"Garantia aceptable de {months} meses")
        else:
            scores["warranty"] = min(scores["warranty"], 0.45)
            disadvantages.append(f"Garantia limitada de {months} meses")

    delivery_match = re.search(r"entrega\D{0,20}(\d{1,3})\s*(dia|dias|semana|semanas)", text)
    if delivery_match:
        days = int(delivery_match.group(1)) * (7 if delivery_match.group(2).startswith("semana") else 1)
        if days <= 7:
            scores["delivery"] = max(scores["delivery"], 0.92)
            advantages.append(f"Entrega rapida en {days} dias")
        elif days <= 15:
            scores["delivery"] = max(scores["delivery"], 0.78)
            advantages.append(f"Entrega razonable en {days} dias")
        else:
            scores["delivery"] = min(scores["delivery"], 0.48)
            disadvantages.append(f"Entrega lenta de {days} dias")

    if any(word in text for word in ["precio competitivo", "menor precio", "descuento", "economico", "barato"]):
        scores["price"] = max(scores["price"], 0.9)
        advantages.append("Mejor senal de precio")
    if any(word in text for word in ["costo adicional", "recargo", "penalidad", "renovacion automatica"]):
        scores["price"] = min(scores["price"], 0.58)
        disadvantages.append("Puede incluir costos o condiciones adicionales")

    if any(word in text for word in ["cumple", "certificado", "sla", "iso", "soporte 24/7"]):
        scores["compliance"] = max(scores["compliance"], 0.88)
        advantages.append("Mejor respaldo de cumplimiento")
    if any(word in text for word in ["no incluye", "limitado", "exclusion", "sin soporte"]):
        scores["compliance"] = min(scores["compliance"], 0.58)
        disadvantages.append("Hay restricciones o ausencias declaradas")

    if any(word in text for word in ["riesgo", "penalidad", "cancelacion", "no reembolsable", "dependencia"]):
        scores["risk"] = min(scores["risk"], 0.52)
        disadvantages.append("Riesgo contractual u operativo detectado")
    elif text.strip():
        scores["risk"] = max(scores["risk"], 0.76)
        advantages.append("Sin riesgos criticos evidentes en el texto extraido")

    filename = document["filename"]
    provider_id = Path(filename).stem.replace("-", " ").replace("_", " ").title()
    return {
        "provider_id": provider_id,
        "scores": scores,
        "advantages": advantages or list(base["advantages"]),
        "disadvantages": disadvantages or list(base["disadvantages"]),
    }


def _options_from_documents(documents: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [_document_option(document, index) for index, document in enumerate(documents)]


def build_demo_agent_result(
    objective: str,
    documents: list[dict[str, Any]],
) -> dict[str, Any]:
    all_pages: list[dict[str, Any]] = [
        {"filename": document["filename"], "page": page}
        for document in documents
        for page in document["pages"]
    ]
    extracted_text = "\n\n".join(
        item["page"].text for item in all_pages if item["page"].text.strip()
    )
    page_previews = [
        {
            "page_number": page.page_number,
            "document": item["filename"],
            "method": page.method,
            "quality_score": page.quality_score,
            "preview": _preview(page.text) or "No se pudo extraer texto de esta pagina.",
        }
        for item in all_pages
        for page in [item["page"]]
    ]
    keywords = _keywords(extracted_text)
    providers = _detect_providers(extracted_text)
    options = (
        _options_from_documents(documents)
        if len(documents) > 1
        else _select_synthetic_options(objective, extracted_text, providers)
    )
    ranked_options = sorted(options, key=_weighted_score, reverse=True)
    best_option = ranked_options[0]
    quality = (
        sum(item["page"].quality_score for item in all_pages) / len(all_pages)
        if all_pages
        else 0
    )
    has_text = bool(extracted_text.strip())
    confidence_score = round(max(0.18, min(0.86, quality * (0.75 if has_text else 0.35))), 2)
    confidence_band = "high" if confidence_score >= 0.8 else "medium" if confidence_score >= 0.6 else "low"
    outcome = "recommendation" if has_text and confidence_score >= 0.55 else "needs_review"
    recommended = best_option["provider_id"] if outcome == "recommendation" else None
    filenames = [document["filename"] for document in documents]
    combined_filename = ", ".join(filenames[:3])
    if len(filenames) > 3:
        combined_filename += f" y {len(filenames) - 3} mas"

    evidence = [
        {
            "id": f"E{index}",
            "document": item["filename"],
            "page": page.page_number,
            "quote": _preview(page.text, 180) or "Texto no disponible",
        }
        for index, item in enumerate(all_pages[:8], start=1)
        for page in [item["page"]]
    ]

    stages = [
        {
            "id": "planner",
            "agent": "Planner Agent",
            "status": "completed",
            "summary": "Objetivo recibido y criterios iniciales propuestos.",
        },
        {
            "id": "document",
            "agent": "Document Agent",
            "status": "completed" if all_pages else "needs_review",
            "summary": f"{len(all_pages)} paginas procesadas desde {len(documents)} documento(s).",
        },
        {
            "id": "research",
            "agent": "Research Agent",
            "status": "completed" if has_text else "needs_review",
            "summary": (
                "Hechos extraidos: " + ", ".join(keywords[:4])
                if keywords
                else "No hay texto suficiente para extraer hechos confiables."
            ),
        },
        {
            "id": "comparison",
            "agent": "Comparison Agent",
            "status": "completed" if has_text else "needs_review",
            "summary": f"Alternativas evaluadas: {', '.join(option['provider_id'] for option in options)}.",
        },
        {
            "id": "decision",
            "agent": "Decision Agent",
            "status": "completed" if outcome == "recommendation" else "needs_review",
            "summary": (
                f"Recomendacion preliminar: {recommended}."
                if recommended
                else "Se requiere revision humana por evidencia insuficiente."
            ),
        },
    ]

    confidence = {
        "score": confidence_score,
        "band": confidence_band,
        "coverage": round(0.7 if has_text else 0.2, 2),
        "citation_support": round(0.76 if evidence else 0.0, 2),
        "consistency": round(0.68 if has_text else 0.25, 2),
        "extraction_quality": round(quality, 2),
    }
    comparison = [
        {
            "provider_id": option["provider_id"],
            "criteria": [
                {
                    "key": criterion["key"],
                    "label": _criterion_label(criterion["key"]),
                    "value": "Detectado en evidencia" if has_text else None,
                    "normalized_score": round(option["scores"][criterion["key"]], 2),
                    "missing": not has_text,
                }
                for criterion in CRITERIA
            ],
            "weighted_score": _weighted_score(option),
            "advantages": option["advantages"] if has_text else [],
            "disadvantages": option["disadvantages"] if has_text else ["Falta texto extraible"],
        }
        for option in ranked_options
    ]
    decision_summary = (
        f"La mejor opcion es {recommended} porque combina "
        f"{', '.join(best_option['advantages'][:2]).lower()}. "
        f"Sus principales desventajas son: {', '.join(best_option['disadvantages'][:2]).lower()}. "
        f"Frente a las otras alternativas, obtiene el mejor balance ponderado entre "
        f"precio, garantia, entrega, cumplimiento y riesgo. Aun asi, antes de decidir "
        f"conviene validar los puntos debiles detectados contra el documento original."
        if recommended
        else "No hay evidencia suficiente para recomendar una alternativa."
    )
    agent_outputs = {
        "planner": {
            "criteria": CRITERIA,
            "objective": objective,
            "strategy": "Puntuar alternativas con pesos uniformes y priorizar evidencia extraida.",
        },
        "document": {
            "documents_analyzed": [document["filename"] for document in documents],
            "pages": len(all_pages),
            "quality_score": round(quality, 2),
        },
        "research": {
            "keywords": keywords,
            "evidence_ids": [item["id"] for item in evidence],
        },
        "comparison": {
            "ranked_alternatives": [
                {
                    "provider_id": item["provider_id"],
                    "weighted_score": item["weighted_score"],
                    "advantages": item["advantages"],
                    "disadvantages": item["disadvantages"],
                }
                for item in comparison
            ],
        },
        "decision": {
            "recommended_provider_id": recommended,
            "why": decision_summary,
            "confidence": confidence,
        },
    }

    return {
        "analysis_mode": "deterministic_multiagent_demo",
        "answer": decision_summary,
        "objective": objective,
        "document": {
            "filename": combined_filename or "documentos.pdf",
            "pages": len(all_pages),
            "quality_score": round(quality, 2),
            "previews": page_previews,
        },
        "documents": [
            {
                "filename": document["filename"],
                "pages": len(document["pages"]),
                "quality_score": round(
                    sum(page.quality_score for page in document["pages"]) / len(document["pages"]),
                    2,
                )
                if document["pages"]
                else 0,
            }
            for document in documents
        ],
        "stages": stages,
        "criteria": CRITERIA,
        "suggested_criteria": CRITERIA,
        "extracted_page_previews": page_previews,
        "confidence": confidence,
        "research": {
            "keywords": keywords,
            "evidence": evidence,
        },
        "agent_outputs": agent_outputs,
        "comparison": comparison,
        "decision": {
            "outcome": outcome,
            "recommended_provider_id": recommended,
            "summary": decision_summary,
            "risk_items": [
                *best_option["disadvantages"][:2],
                "Validar montos, plazos y garantias contra el documento original.",
            ],
            "confidence": confidence,
            "evidence_ids": [item["id"] for item in evidence],
        },
        "raw_pages": [
            {"document": item["filename"], **asdict(item["page"])}
            for item in all_pages
        ],
    }


async def demo_agent_endpoint(
    objective: str = Form(..., min_length=1),
    files: list[UploadFile] | None = File(default=None),
    file: UploadFile | None = File(default=None),
) -> dict[str, Any]:
    upload_files = [item for item in (files or []) if item.filename]
    if file is not None and file.filename:
        upload_files.append(file)
    if not upload_files:
        raise HTTPException(status_code=400, detail="At least one PDF file is required")

    documents: list[dict[str, Any]] = []
    for upload in upload_files:
        if upload.content_type not in {"application/pdf", "application/octet-stream"}:
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        data = await upload.read()
        if not data:
            raise HTTPException(status_code=400, detail=f"{upload.filename} is empty")
        try:
            pages = extract_pdf(data)
        except Exception as exc:  # pragma: no cover - PyMuPDF raises several concrete errors.
            raise HTTPException(status_code=400, detail=f"{upload.filename} could not be processed") from exc
        documents.append({"filename": upload.filename or "documento.pdf", "pages": pages})

    return build_demo_agent_result(objective, documents)
