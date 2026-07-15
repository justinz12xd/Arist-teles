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

El repositorio contiene el frontend y la estructura inicial del backend RAG:

- `app/`, `components/` y `sections/`: landing Next.js que explica el flujo del MVP con estetica de consola orbital.
- `backend/`: primer corte FastAPI para crear expedientes, indexar texto por pagina y responder preguntas con citas.

El RAG inicial usa OpenAI directamente para chat y embeddings. InsForge permanece como plataforma de Auth, Storage, Postgres, `pgvector` y Realtime; en este corte se usan Auth, Postgres y `pgvector`.

La carga de archivos, parsing de PDF o imagenes, OCR, fallback visual, agentes, jobs, Realtime y reportes siguen fuera de este incremento. El fallback visual permanece futuro y configurable, sin cambiar aqui su proveedor previsto.

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
uv sync --python 3.12
uv run pytest -q
uv run uvicorn aristoteles_api.main:app --reload --port 8000
```

Consulte [`backend/README.md`](backend/README.md) para configurar OpenAI, enlazar InsForge, aplicar la migracion y ejecutar el smoke test de RLS con dos usuarios.

## Documentacion

- [Requisitos del producto](docs/PRD.md)
- [Arquitectura tecnica](docs/ARCHITECTURE.md)
- [Contexto de producto](PRODUCT.md)
