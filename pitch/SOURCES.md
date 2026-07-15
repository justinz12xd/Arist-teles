# Fuentes y notas metodológicas

## Estadísticas visibles en el deck

| Dato | Uso | Fuente | Nota metodológica |
|---|---|---|---|
| **17.4%** del gasto total de gobierno | Escala de procurement en América Latina y el Caribe | [OECD — Size of public procurement](https://www.oecd.org/en/publications/2024/03/government-at-a-glance-latin-america-and-the-caribbean-2024_0d6281fd/full-report/component-34.html) | Promedio LAC con datos disponibles, **2021**. |
| **6.6%** del PIB | Escala regional | [OECD — Size of public procurement](https://www.oecd.org/en/publications/2024/03/government-at-a-glance-latin-america-and-the-caribbean-2024_0d6281fd/full-report/component-34.html) | Promedio LAC, **2021**. La página explica el alcance y las exclusiones metodológicas. |
| **US$9,5 billones** en contratos públicos por año | Escala global | [World Bank — Procurement for Development](https://www.worldbank.org/en/topic/procurement-for-development) | Estimación global anual publicada en una página cuya fecha de actualización visible es **14 de abril de 2020**. Se conserva esa fecha para no presentar el dato como una medición nueva. La cifra usa escala larga en español. |

## Contenido del producto

La descripción de Aristóteles, sus agentes, la rúbrica de confianza, el flujo de usuario,
los estados y el roadmap se derivan de:

- `../docs/PRD.md`
- `../docs/ARCHITECTURE.md`
- `../README.md`
- `../app/globals.css`

La arquitectura del deck refleja el límite expresado en la PRD: los agentes proponen,
extraen, comparan y justifican; OCR, parsing, chunking, retrieval, scoring y PDF son
operaciones deterministas; el usuario mantiene la decisión final.

## Datos sintéticos y objetivos

- El resumen visual de la diapositiva 1 y la evidencia de la diapositiva 6 son **100% sintéticos**: nombres de proveedor, archivos, páginas, fragmentos, conteo de evidencias y puntaje son ilustrativos.
- La tabla de tres proveedores de la diapositiva 7 es **100% sintética** y solo ilustra el flujo del MVP. No representa clientes, proveedores ni resultados de producción.
- El `puntaje 84/100` de la demo es un score comparativo; no es la confianza de la decisión. La confianza real usa la rúbrica separada de cobertura, citas, consistencia y calidad de extracción.
- La diapositiva 8 muestra **objetivos de piloto**, no resultados actuales ni promesas de ahorro o adopción.
- Las métricas de piloto están alineadas con la PRD: recall/precisión de evidencia, cobertura de criterios, afirmaciones respaldadas, abstención y aislamiento por usuario.
- No se incluyó el benchmark opcional de McKinsey para evitar que un caso externo se confunda con un resultado de Aristóteles.

## Revisión de cifras

Las cifras fueron comprobadas contra las páginas oficiales enlazadas antes de generar el deck.
Los números aparecen con su año o fecha metodológica visible en la propia diapositiva para
que el jurado pueda distinguir contexto externo, demo sintética y objetivo futuro.
