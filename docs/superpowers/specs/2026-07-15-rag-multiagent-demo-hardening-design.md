# Endurecer la demo RAG multiagente

Este cambio convierte la fundación existente en una demo verificable de extremo a extremo: los documentos almacenados en InsForge producen evidencia trazable, comparaciones ponderadas y una decisión que solo puede recomendar cuando la evidencia y la confianza cumplen las reglas.

## Resultado esperado

1. Un usuario registra un documento del bucket privado `case-documents`.
2. El backend deriva la descarga desde `storage_key`, extrae el texto y crea chunks con embeddings.
3. RAG recupera fragmentos relevantes para el objetivo y los criterios confirmados.
4. Research produce evidencia estructurada y persistida.
5. Comparison usa únicamente evidencia persistida y aplica los pesos confirmados.
6. Decision recomienda con evidencia válida o devuelve `needs_review`.
7. Un smoke test recorre extracción, RAG, agentes, decisión y reporte.

## Arquitectura elegida

Se mantiene un pipeline híbrido **evidence-first**. Los agentes interpretan y redactan; Python y Pydantic controlan identidad, evidencia, puntuación, confianza e idempotencia.

```text
Storage privado
  -> extracción PDF/OCR
  -> chunks + embeddings
  -> búsqueda pgvector
  -> Research Agent
  -> evidencia validada y persistida
  -> Comparison Agent + puntuación determinista
  -> Decision Agent + compuerta de confianza
  -> reporte / needs_review
```

No se implementará autonomía total del Planner durante este corte. La secuencia fija reduce riesgo y hace reproducible la demo.

## Decisiones

| Área | Decisión |
|---|---|
| Storage | El backend acepta `storage_key` bajo el prefijo del propietario y deriva/valida el host InsForge. Nunca descarga una URL arbitraria enviada por el cliente. |
| RAG | Se mantiene `openai/text-embedding-3-small` con `vector(1536)`, búsqueda coseno y máximo ocho resultados. |
| Evidencia | Research devuelve `EvidenceRef`; cada referencia se valida contra documentos, páginas y chunks recuperados antes de persistirse. |
| Comparación | El agente estructura valores, ventajas y contradicciones; Python calcula la puntuación ponderada con los criterios confirmados. |
| Decisión | Una recomendación exige proveedor, evidencia existente, cobertura suficiente y confianza calculada. En caso contrario devuelve `needs_review`. |
| Confianza | Se calcula de forma determinista con cobertura, soporte de citas, consistencia y calidad de extracción; el modelo no controla el resultado numérico. |
| Ejecución | Las etapas limpian o reutilizan resultados del mismo `run_id` para que una repetición no duplique datos. La demo ejecuta dentro del ciclo activo de la petición. |
| CORS | Solo se permiten orígenes configurados mediante variable de entorno. No se habilita `*` con credenciales. |

## Contratos

### Research

La salida incluye una colección `evidence` con:

- `claim`
- `document_id`
- `page`
- `chunk_id`
- `quote`
- `source_hash`

Una referencia inválida se descarta y reduce la confianza. Si no queda evidencia válida, el análisis termina en `needs_review`.

### Comparison

Cada criterio conserva `evidence_ids`. Los valores faltantes usan `missing=true` y no se convierten en hechos inferidos. La puntuación del proveedor es la suma de `normalized_score * weight` sobre criterios válidos.

### Decision

El agente recibe comparaciones ya validadas. El backend reemplaza cualquier confianza generada por el modelo con el cálculo determinista y rechaza recomendaciones sin evidencia persistida.

## Manejo de errores

- Descarga fuera del host/bucket permitido: `400` sin efectuar la solicitud.
- MIME, tamaño o hash inconsistente: documento `needs_review`.
- RAG sin resultados: ejecución `needs_review`.
- Salida JSON inválida de un agente: reintento acotado; luego `failed`.
- Evidencia inexistente o contradictoria: `needs_review`.
- Repetición del mismo `run_id`: reemplaza resultados parciales de forma segura.

## Verificación

- Pruebas unitarias para allowlist de Storage, evidencia, puntuación y confianza.
- Prueba de pipeline con repositorio y agentes simulados.
- Ruff y suite Pytest completa.
- Build de Docker.
- Smoke test real con un PDF breve en español y OpenRouter/InsForge.
- El reporte final debe citar documento y página, y coincidir con los datos del PDF.

## Fuera de alcance

- Cola distribuida y workers independientes.
- Checkpointer durable de LangGraph.
- Planner con despacho adaptativo.
- Reranking avanzado o contexto vecino.
- Borrado coordinado de objetos Storage.
- Observabilidad y evaluación de producción.

## Criterios de aceptación

- [ ] No es posible descargar una URL arbitraria mediante `storage_url`.
- [ ] Cada recomendación referencia evidencia persistida y válida.
- [ ] Los pesos confirmados afectan el resultado calculado.
- [ ] La confianza no depende de un número inventado por el modelo.
- [ ] Un análisis sin evidencia responde `needs_review`.
- [ ] Repetir un `run_id` no duplica resultados.
- [ ] El navegador puede llamar al backend desde el origen configurado.
- [ ] Pruebas, lint, Docker y smoke test pasan.
