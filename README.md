# Aristóteles

Aristóteles es un sistema multiagente de apoyo a decisiones. Analiza documentos, compara alternativas y entrega una recomendación justificable mediante evidencia localizada.

El primer caso de uso compara proveedores a partir de cotizaciones, contratos y garantías. Aristóteles **no toma la decisión por el usuario**: organiza la evidencia, explica los riesgos y permite que una persona decida con mejor información.

## Flujo del MVP

1. El usuario crea un expediente y carga archivos PDF o imágenes.
2. El sistema extrae el contenido, aplica OCR cuando es necesario y construye un índice RAG.
3. El Planner propone criterios y pesos de comparación.
4. El usuario confirma o modifica esos criterios.
5. Los agentes investigan, comparan y generan una recomendación.
6. El usuario revisa la evidencia y descarga el reporte en PDF.

```text
Usuario
  │
  ├── Documentos ──► Document Agent ──► Corpus RAG
  │
  └── Solicitud ───► Planner Agent
                          │
                 ┌────────┴────────┐
                 ▼                 ▼
          Research Agent    Comparison Agent
                 └────────┬────────┘
                          ▼
                   Decision Agent
                          ▼
               Report Generator ──► Web + PDF
```

## Principios

- **Evidencia antes que elocuencia:** ninguna recomendación sin fuentes verificables.
- **Humano al mando:** el sistema recomienda; el usuario decide.
- **Trazabilidad útil:** se muestran planes, estados, herramientas, citas y resultados, no razonamiento privado del modelo.
- **Aislamiento por usuario:** documentos, ejecuciones y reportes se protegen con RLS.
- **Recuperación ante fallos:** los análisis son asíncronos, idempotentes y reanudables.

## Documentación

- [Requisitos del producto](docs/PRD.md)
- [Arquitectura técnica](docs/ARCHITECTURE.md)

## Estado

El repositorio contiene una plantilla frontend inicial. Esta entrega añade la definición del producto y la arquitectura del backend multiagente que guiarán su implementación e integración.
