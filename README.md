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

## Docker

El repositorio incluye dos imagenes de produccion:

- `Dockerfile`: frontend Next.js con salida `standalone`, ejecutado como usuario sin privilegios.
- `backend/Dockerfile`: API FastAPI con OCR y renderizado PDF, tambien ejecutada sin privilegios.

Para construir y levantar ambas imagenes:

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

La web queda disponible en `http://localhost:3000` y la salud del backend en
`http://localhost:8080/health`. El frontend usa la red privada de Compose para llamar a
`http://backend:8080`; no es necesario exponer una URL publica del backend en el navegador.

## Despliegue conjunto en Vercel

`vercel.json` define dos Vercel Services basados en contenedores:

- `frontend` sirve Next.js en `/`.
- `backend` sirve FastAPI y se publica bajo `/svc/api/*`.

Vercel construye `Dockerfile.vercel` y `backend/Dockerfile.vercel`. El Route Handler del
frontend utiliza `BACKEND_URL`, que Vercel Services inyecta automaticamente, y conserva
`ARISTOTELES_API_URL` como override para despliegues separados.

Antes del primer deploy:

1. Cree un proyecto en Vercel desde la raiz del repositorio y seleccione **Services** como framework.
2. Configure en Vercel las variables de `backend/.env.example` que use el entorno.
3. Ejecute `vercel deploy` para preview o `vercel deploy --prod` para produccion.

Los contenedores de Vercel son stateless. Archivos, sesiones, vectores y resultados persistentes
deben mantenerse en InsForge u otro servicio externo, nunca en el filesystem del contenedor.

## Documentacion

- [Requisitos del producto](docs/PRD.md)
- [Arquitectura tecnica](docs/ARCHITECTURE.md)
- [Contexto de producto](PRODUCT.md)
