# Aristoteles

Aristoteles es un sistema multiagente de apoyo a decisiones. Analiza documentos, compara alternativas y entrega una recomendacion justificable mediante evidencia localizada.

El primer caso de uso compara proveedores a partir de cotizaciones, contratos y garantias. Aristoteles no toma la decision por el usuario: organiza la evidencia, explica riesgos y permite que una persona decida con mejor informacion.

## Flujo del MVP

1. El usuario crea un expediente y registra archivos PDF o imagenes privados.
2. El backend extrae contenido, aplica OCR cuando corresponde y prepara chunks para RAG.
3. El Planner propone criterios y pesos de comparacion.
4. El usuario confirma o modifica esos criterios.
5. Los agentes investigan, comparan y generan una recomendacion o `needs_review`.
6. El usuario revisa evidencia, confianza y reporte estructurado.

```text
Usuario
  |
  |-- Documentos --> Document Agent --> Corpus RAG
  |
  `-- Solicitud ----> Planner Agent
                         |
                +--------+--------+
                v                 v
         Research Agent    Comparison Agent
                +--------+--------+
                         v
                  Decision Agent
                         v
              Report Generator --> Web + PDF/JSON
```

## Estado actual

El repositorio integra dos piezas:

- `app/`, `components/` y `sections/`: landing Next.js que explica el flujo del MVP con estetica de consola orbital.
- `backend/src/aristoteles/`: API FastAPI inicial para casos, documentos, extraccion, planes, criterios, ejecuciones y reporte.

El ultimo commit (`feat(agents): wire multiagent analysis API`) agrego:

- `AgentRuntime` con roles `planner`, `document`, `research`, `comparison` y `decision`.
- Endpoints `/v1/cases`, `/v1/cases/{case_id}/documents`, `/v1/cases/{case_id}/plans`, `/v1/plans/{run_id}/criteria`, `/v1/plans/{run_id}/runs`, `/v1/runs/{run_id}` y `/v1/runs/{run_id}/report`.
- `AnalysisPipeline` para ejecutar etapas, persistir tareas de agentes, generar comparaciones, decision y reporte.

## Principios

- Evidencia antes que elocuencia: ninguna recomendacion sin fuentes verificables.
- Humano al mando: el sistema recomienda; el usuario decide.
- Trazabilidad util: se muestran planes, estados, herramientas, citas y resultados, no razonamiento privado del modelo.
- Aislamiento por usuario: documentos, ejecuciones y reportes se protegen con filtros de propietario y RLS.
- Recuperacion ante fallos: los analisis son asincronos, idempotentes y reanudables por etapas.

## Desarrollo

Frontend:

```bash
npm install
npm run build
```

Backend:

```bash
cd backend
uv run pytest
uv run uvicorn aristoteles.api:app --reload
```

## Documentacion

- [Requisitos del producto](docs/PRD.md)
- [Arquitectura tecnica](docs/ARCHITECTURE.md)
- [Contexto de producto](PRODUCT.md)
