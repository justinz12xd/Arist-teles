# Estado: nucleo RAG y API multiagente de Aristoteles

Fecha: 2026-07-15

Estado: actualizado despues del commit `8969748 feat: enhance UI components and improve accessibility`.

## Contexto

Este documento reemplaza el diseno inicial de "OpenAI RAG directo". El repositorio ya no esta en fase de backend inexistente: los commits recientes agregaron una API FastAPI bajo `backend/src/aristoteles/`, contratos Pydantic, extraccion, RAG, runtime de agentes y una landing Next.js alineada con el MVP.

La documentacion vigente debe tratar a Aristoteles como un sistema multiagente con:

- frontend Next.js para presentar el flujo y la demo;
- backend FastAPI para casos, documentos, planes, criterios, ejecuciones y reportes;
- Deep Agents para roles `planner`, `document`, `research`, `comparison` y `decision`;
- OpenRouter configurado mediante `langchain-openai`;
- InsForge como capa de Auth, Storage, Postgres, RLS y vectores;
- RAG con chunks, embeddings, busqueda filtrada por usuario y expediente.

## Ultimo commit revisado

El commit `d02b2c1 feat(agents): wire multiagent analysis API` agrego el cableado principal de backend:

- `backend/src/aristoteles/agents.py`: runtime de agentes, prompts por rol y validacion JSON.
- `backend/src/aristoteles/api.py`: endpoints REST con JWT, registro de documentos, extraccion, planes, criterios, ejecucion asincrona y reporte.
- `backend/src/aristoteles/pipeline.py`: pipeline de etapas `extracting -> researching -> comparing -> deciding -> reporting`.

El commit actual `8969748` integro la landing y accesibilidad visual:

- `PRODUCT.md` como contexto de producto.
- `README.md` actualizado con estado actual y comandos.
- secciones de landing enfocadas en evidencia, agentes, confianza, controles y arquitectura;
- componentes UI con reduced motion, foco visible y canvas 3D client-only.

## Contrato implementado actualmente

Endpoints relevantes:

```text
GET  /health
POST /v1/cases
GET  /v1/cases/{case_id}
POST /v1/cases/{case_id}/documents
POST /v1/cases/{case_id}/documents/{document_id}/extract
POST /v1/cases/{case_id}/plans
PUT  /v1/plans/{run_id}/criteria
POST /v1/plans/{run_id}/runs
GET  /v1/runs/{run_id}
GET  /v1/runs/{run_id}/report
```

Estados usados por contratos:

```text
queued -> extracting -> awaiting_criteria -> researching -> comparing -> deciding -> reporting -> completed
```

Estados terminales o de intervencion:

```text
needs_review
failed
cancelled
```

## Integracion documental aplicada

- `README.md` ya no dice que el repo solo contiene una plantilla frontend.
- La landing comunica el MVP real: documentos privados, criterios confirmados, agentes por responsabilidad, confianza calculada y reporte.
- Las secciones visuales ahora mencionan `FastAPI`, `Deep Agents`, `OpenRouter`, `InsForge` y `pgvector`.
- `PRODUCT.md` define el registro de marca, usuarios, proposito, anti-referencias y principios de diseno.

## Pendiente tecnico

1. Alinear los textos con acentos y codificacion UTF-8. Algunos archivos historicos muestran mojibake cuando se leen desde PowerShell.
2. Revisar si `.superpowers/` debe quedar versionado. El ultimo commit lo agrego como artefacto de herramienta, no como fuente de producto.
3. Decidir si los planes en `docs/superpowers/plans/` se deben commitear o eliminar. Estan generados y no son necesarios para build.
4. Validar backend con `uv run pytest`. En esta sesion `uv` hizo timeout incluso con un test puntual.
5. Completar endpoints faltantes del PRD: retry, PDF firmado, borrado coordinado y eventos Realtime.

## Validacion reciente

Frontend:

```text
npm run build
resultado: exitoso
```

Backend:

```text
uv run pytest
resultado: timeout local, sin resultado concluyente
```
