# Aristóteles Backend

API Python para análisis documental, RAG y agentes especializados. El backend usa el proyecto InsForge **Aristoteles** y no expone claves administrativas al frontend.

## Desarrollo local

```bash
cd backend
uv sync --dev
cp .env.example .env
uv run uvicorn aristoteles.api:app --reload --port 8080
```

`npx @insforge/cli ai setup` escribe la clave de OpenRouter en `.env.local` en la raíz del repositorio. Ese archivo está ignorado y solo debe utilizarse server-side.

## Flujo de API

1. El frontend autentica al usuario con InsForge Auth.
2. Carga el archivo al bucket privado `case-documents` con su sesión.
3. Crea un expediente con `POST /v1/cases`.
4. Registra el objeto con `POST /v1/cases/{case_id}/documents`.
5. Extrae páginas con `POST /v1/cases/{case_id}/documents/{document_id}/extract`.
6. Genera y confirma un plan con `/v1/cases/{case_id}/plans` y `/v1/plans/{run_id}/criteria`.
7. Inicia la ejecución con `POST /v1/plans/{run_id}/runs`.
8. Consulta estado y resultado en `/v1/runs/{run_id}` y `/v1/runs/{run_id}/report`.
9. Descarga el PDF en `/v1/runs/{run_id}/report.pdf`.

Todas las rutas protegidas requieren `Authorization: Bearer <insforge-access-token>`. La API deriva el `sub` del token y deja que InsForge valide la sesión y aplique RLS en cada operación.

## Verificación

```bash
uv run ruff check src tests
uv run pytest -q
docker build -t aristoteles-backend:test .
```

## InsForge

- Migraciones: `../migrations/`
- Buckets privados: `case-documents`, `case-reports`
- Canal Realtime: `analysis:%`
- Proyecto: `db6816ef-b1a5-4348-a69b-252ab7acf9ee`
