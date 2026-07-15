# PRD: Aristóteles, decisiones respaldadas por evidencia

## Resumen

Aristóteles transforma documentos dispersos en una comparación estructurada y una recomendación auditable. El MVP se enfoca en comparar proveedores usando cotizaciones, contratos, garantías y documentos de soporte.

No es un chatbot ni un motor de decisiones automáticas. Es un sistema multiagente que prepara evidencia, hace explícitos los criterios de comparación y ayuda a una persona a decidir.

## Problema

Comparar proveedores suele exigir revisar múltiples archivos con formatos y niveles de calidad diferentes. La información relevante queda distribuida entre páginas, tablas y anexos; esto provoca:

- criterios aplicados de forma inconsistente;
- omisión de cláusulas, restricciones o costos;
- recomendaciones difíciles de justificar;
- retrabajo para localizar la fuente de cada afirmación;
- poca visibilidad sobre datos faltantes o contradictorios.

## Usuario y resultado esperado

El usuario objetivo es una persona responsable de evaluar proveedores, contratos o propuestas. Necesita seleccionar una alternativa y defender esa decisión ante otras personas.

Una ejecución exitosa permite:

1. confirmar qué criterios importan y cuánto pesan;
2. comparar cada proveedor bajo los mismos criterios;
3. localizar la fuente de cada dato relevante;
4. entender riesgos, contradicciones y ausencias;
5. recibir una recomendación con nivel de confianza explicable;
6. tomar personalmente la decisión final.

## Alcance del MVP

### Incluido

- Autenticación y aislamiento multiusuario.
- Expedientes privados con documentos PDF, PNG, JPEG o WebP.
- Extracción de texto digital y OCR para contenido escaneado.
- Fallback a un modelo visual cuando la extracción local no alcanza el umbral de calidad.
- Chunking, embeddings, recuperación semántica y contexto vecino.
- Cinco agentes autónomos con despacho adaptativo.
- Criterios sugeridos por el Planner y confirmados por el usuario.
- Comparación de proveedores, riesgos, contradicciones y datos faltantes.
- Recomendación no vinculante con confianza basada en evidencia.
- Traza verificable de etapas y fuentes.
- Reporte web y PDF.
- Procesamiento asíncrono, reanudable e idempotente.
- Eliminación del expediente y de todos sus datos derivados.

### Fuera de alcance

- Ejecutar compras, firmar contratos o contactar proveedores.
- Tomar decisiones sin aprobación humana.
- Edición colaborativa por equipos u organizaciones.
- Entrenamiento de modelos propios.
- Soporte inicial para Word, hojas de cálculo, correo o audio.
- Exposición de razonamiento interno o cadenas de pensamiento del modelo.
- Garantías de interpretación legal, médica o financiera profesional.

## Experiencia principal

### 1. Crear expediente

El usuario crea un expediente y describe qué necesita decidir.

### 2. Cargar documentos

El usuario carga archivos directamente en almacenamiento privado. El sistema valida propiedad, formato, tamaño, hash y estado antes de procesarlos.

### 3. Preparar evidencia

El Document Agent coordina extracción, OCR, segmentación y embeddings. Las páginas con baja calidad quedan señaladas y pueden activar el fallback visual.

### 4. Confirmar el plan

El Planner propone tareas, criterios y pesos. El usuario puede modificarlos; los pesos confirmados deben sumar `1.0`.

Los criterios iniciales sugeridos para proveedores son:

- precio y costos adicionales;
- garantía;
- plazo de entrega;
- cumplimiento de requisitos;
- riesgos y restricciones.

### 5. Ejecutar análisis

El Planner activa únicamente los especialistas necesarios. El progreso se muestra por etapas y se conserva para reanudación.

### 6. Revisar decisión

El usuario recibe:

- proveedor recomendado;
- comparación por criterio;
- ventajas y desventajas;
- riesgos y datos faltantes;
- confianza y desglose de su cálculo;
- citas con documento, página y fragmento;
- reporte descargable en PDF.

## Agentes

| Componente | Responsabilidad | Restricción principal |
|---|---|---|
| Planner Agent | Comprender la solicitud, proponer criterios y crear el plan | No recomienda una alternativa |
| Document Agent | Coordinar parsing, OCR, chunking, embeddings y retrieval | No interpreta implicaciones comerciales |
| Research Agent | Extraer hechos, entidades, fechas, costos, garantías y riesgos declarados | No compara ni recomienda |
| Comparison Agent | Construir matrices, aplicar criterios y detectar inconsistencias | No selecciona al ganador |
| Decision Agent | Priorizar, justificar, calcular confianza y recomendar o abstenerse | No afirma nada sin evidencia |
| Report Generator | Renderizar determinísticamente la salida validada | No modifica la decisión |

OCR, parsing, chunking, búsqueda, puntuación y generación de PDF son herramientas deterministas. La autonomía de un agente NO reemplaza controles reproducibles.

## Requisitos funcionales

### Expedientes y documentos

- Cada expediente pertenece a un usuario autenticado.
- Un usuario solo puede acceder a sus expedientes y artefactos.
- Cada archivo conserva nombre, MIME, tamaño, hash, clave de Storage y estado.
- Cada página conserva texto extraído, método y puntuación de calidad.
- El borrado del expediente elimina originales, páginas, chunks, embeddings, ejecuciones y reportes.

### Planificación

- El Planner debe devolver un plan estructurado y validable.
- El usuario debe confirmar los criterios antes de iniciar la comparación.
- El Planner puede omitir Research o Comparison únicamente cuando justifique que la solicitud no los necesita.
- Document y Decision participan en toda ejecución que llegue a recomendación.

### Evidencia y RAG

- Todo chunk debe conservar usuario, expediente, documento, página, posición y modelo de embedding.
- La recuperación siempre debe filtrar por usuario y expediente.
- Una evidencia debe enlazar afirmación, documento, página, chunk, fragmento y hash de fuente.
- El sistema debe recuperar contexto vecino para evitar interpretar fragmentos aislados.
- Una afirmación sin evidencia no puede aparecer como hecho en la decisión.

### Comparación y decisión

- Los pesos confirmados se aplican de manera uniforme a todos los proveedores.
- Datos ausentes deben permanecer ausentes; el modelo no puede completarlos por inferencia.
- Contradicciones deben mostrarse y afectar la confianza.
- El Decision Agent puede responder `needs_review` en lugar de recomendar.
- La recomendación siempre debe incluir alternativa, justificación, riesgos, confianza y evidencias.

### Confianza

La confianza no será una estimación subjetiva del modelo. Se calculará con esta rúbrica:

| Dimensión | Peso |
|---|---:|
| Cobertura de criterios | 40% |
| Respaldo mediante citas | 30% |
| Consistencia entre fuentes | 20% |
| Calidad de extracción | 10% |

Bandas iniciales:

- `high`: puntuación mayor o igual a `0.80`;
- `medium`: desde `0.60` hasta menos de `0.80`;
- `low`: menor que `0.60`.

La ausencia de un dato crítico limita la confianza a `medium`. Una contradicción crítica sin resolver la limita a `low` y permite abstención.

## Estados visibles

```text
queued → extracting → awaiting_criteria → researching → comparing
       → deciding → reporting → completed
```

Estados terminales o de intervención: `needs_review`, `failed` y `cancelled`.

La interfaz podrá representar el progreso así:

```text
📄 Preparando documentos          ✔
🧠 Confirmando el plan            ✔
🔎 Extrayendo información         ✔
⚖️ Comparando alternativas        ✔
🎯 Generando recomendación        ✔
📄 Creando reporte                ✔
```

## Seguridad y privacidad

- Los documentos son contenido no confiable; sus instrucciones no modifican prompts ni herramientas.
- Toda salida de agentes se valida contra esquemas.
- Las herramientas de cada agente se limitan a su responsabilidad.
- Credenciales administrativas y de OpenRouter permanecen en servidor.
- Realtime usa canales privados vinculados al propietario de la ejecución.
- La observabilidad no registra cuerpos completos de documentos ni secretos.
- Los datos permanecen hasta que el usuario elimina el expediente.

## Requisitos no funcionales

- Las etapas deben ser idempotentes y reanudables desde el último checkpoint válido.
- Fallos transitorios usan reintentos acotados con backoff.
- Límites de archivo, páginas, tokens, tiempo y concurrencia son configurables.
- Los modelos de chat, visión y embeddings se seleccionan por configuración.
- Una columna vectorial contiene embeddings de un solo modelo y dimensión.
- El contenedor de ejecución debe ser portable entre InsForge Compute y un proveedor externo.
- Toda ejecución conserva métricas de duración, tokens, costo, errores e intentos.

## Criterios de aceptación

- Dos usuarios no pueden leer ni buscar documentos entre sí.
- El sistema procesa PDFs digitales, PDFs escaneados e imágenes de la demo.
- El usuario puede modificar criterios y pesos antes de ejecutar la comparación.
- La ejecución sobre el dataset dorado identifica los hechos esperados y sus páginas.
- Ninguna afirmación factual del reporte carece de evidencia.
- Un dato faltante no se presenta como inferido.
- Una contradicción crítica aparece en riesgos y reduce la confianza.
- Una ejecución interrumpida continúa sin repetir etapas completadas.
- El reporte web y el PDF representan la misma decisión estructurada.
- Eliminar un expediente elimina archivos y artefactos derivados.

## Roadmap

1. **Fundación:** proyecto InsForge, autenticación, esquema, RLS y Storage.
2. **Ingesta:** parsing, OCR, chunks, embeddings y retrieval evaluado.
3. **Orquestación:** contratos, agentes, checkpoints y progreso Realtime.
4. **Decisión:** comparación, confianza, citas y abstención.
5. **Entrega:** reporte web/PDF, observabilidad y evaluación end-to-end.
6. **Expansión:** Word, hojas de cálculo, equipos y nuevos dominios.
