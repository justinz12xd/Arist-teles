# Aristóteles — pitch deck

Deck técnico en español para presentar Aristóteles ante un jurado de hackathon.
La narrativa es **“de documentos dispersos a decisiones defendibles”** y el caso de uso inicial es la selección de proveedores.

## Construir

Desde `Arist-teles/`:

```bash
npm ci
npm run pitch:build
```

El script genera:

- `pitch/Aristoteles-Pitch.pptx` — deck editable.
- `pitch/Aristoteles-Pitch.pdf` — exportación 16:9 para presentar.

La conversión PDF usa LibreOffice/`soffice`. El generador no usa imágenes externas: todos los fondos, diagramas, tablas y gráficos son formas vectoriales de PowerPoint.

## Contenido

1. Promesa y portada.
2. Problema de comparar proveedores con evidencia fragmentada.
3. Escala económica de procurement.
4. Solución: ingesta, evidencia y decisión.
5. Arquitectura de cinco agentes más herramientas deterministas.
6. Rúbrica de confianza y trazabilidad.
7. Demo con tres proveedores y datos sintéticos.
8. Objetivos de calidad para el piloto.
9. Cierre y roadmap.

Ver `SOURCES.md` para las fuentes y `SPEAKER-NOTES.md` para el guion.
