# Construir un corpus PDF reproducible para la demo técnica

El proyecto incorporará un corpus aislado de documentos sintéticos para demostrar la extracción, recuperación de evidencia, comparación ponderada, OCR y abstención de Aristóteles. El corpus estará orientado a un equipo técnico y no representará ofertas comerciales reales.

## Objetivo

Entregar 15 PDF breves que permitan ejecutar cuatro comparaciones controladas. Cada escenario debe indicar qué archivos cargar, qué criterios utilizar y qué resultado técnico se espera, sin depender de integraciones externas para validar la estructura documental.

## Alcance

El corpus demostrará:

- extracción de texto nativo;
- OCR en español sobre un PDF compuesto por imagen;
- recuperación de citas y datos explícitos;
- puntuación con criterios cuyos pesos suman `1.0`;
- riesgos por exclusiones o condiciones desfavorables;
- `needs_review` ante información insuficiente o contradictoria.

No demostrará una interfaz de carga, ejecución asíncrona, protección comprobada frente a prompt injection ni un smoke test real con InsForge u OpenRouter.

## Organización

```text
demo-corpus/
├── README.md
├── manifest.json
├── 01-servidores/
│   ├── criterios.json
│   ├── resultado-esperado.json
│   ├── base/
│   └── variantes/
├── 02-energia-solar/
│   ├── criterios.json
│   ├── resultado-esperado.json
│   ├── base/
│   └── variantes/
├── 03-ciberseguridad/
│   ├── criterios.json
│   ├── resultado-esperado.json
│   ├── base/
│   └── variantes/
└── 04-logistica/
    ├── criterios.json
    ├── resultado-esperado.json
    ├── base/
    └── variantes/
```

`README.md` será la ruta rápida de la demo. `manifest.json` enumerará los 15 PDF, su escenario, proveedor, tipo y archivos que deben cargarse juntos. Las variantes no se mezclarán con el caso base salvo cuando el escenario indique expresamente cargar un anexo contradictorio.

## Matriz de escenarios

| Tema | Archivos | Resultado controlado | Variante adversa |
| --- | ---: | --- | --- |
| Servidores | 3 | Nexus ofrece el mejor equilibrio; Vertex excluye instalación; Orbit no confirma el plazo | Ninguna; es el flujo feliz coherente con el pitch |
| Energía solar | 4 | La oferta con certificaciones, garantía y mantenimiento verificables resulta preferida | Copia escaneada de una oferta base para forzar OCR |
| Ciberseguridad | 4 | El proveedor con SLA, residencia, retención y salida verificables resulta preferido | Versión incompleta que debe reducir cobertura y activar revisión |
| Logística | 4 | La recomendación considera precio, cobertura, seguro y penalizaciones | Anexo que contradice el plazo de la propuesta principal |

Total: 12 ofertas base y 3 variantes, para 15 PDF.

## Criterios controlados

Cada archivo `criterios.json` tendrá identificadores, descripciones y pesos numéricos. Los pesos sumarán exactamente `1.0`.

| Tema | Pesos |
| --- | --- |
| Servidores | precio `0.30`, entrega `0.25`, garantía `0.20`, instalación `0.15`, soporte `0.10` |
| Energía solar | costo `0.25`, capacidad `0.20`, garantía `0.20`, certificaciones `0.15`, mantenimiento `0.10`, entrega `0.10` |
| Ciberseguridad | SLA `0.25`, respuesta `0.20`, residencia `0.20`, retención `0.15`, salida `0.10`, costo `0.10` |
| Logística | precio `0.25`, cobertura `0.20`, entrega `0.20`, seguro `0.15`, trazabilidad `0.10`, penalizaciones `0.10` |

Los proveedores tendrán ventajas y desventajas cruzadas. Ninguno ganará todos los criterios, porque eso ocultaría el valor del análisis ponderado.

## Contrato documental

Cada oferta base será un PDF A4 de una página y 200–350 palabras. Contendrá:

1. proveedor, referencia, fecha de emisión y vigencia;
2. precio total, impuestos y costos adicionales;
3. plazo, entrega e instalación;
4. garantía, soporte o SLA;
5. certificaciones y cumplimiento;
6. exclusiones, riesgos y condiciones;
7. la leyenda visible `DATOS SINTÉTICOS PARA DEMO — SIN VALIDEZ COMERCIAL`.

Los valores repetirán proveedor y unidades en el contexto inmediato. Se evitarán tablas densas, columnas, fondos decorativos y texto ambiguo para mantener estables la extracción y el RAG de ocho fragmentos.

## Generación

Los PDF digitales se generarán desde HTML con WeasyPrint, ya utilizado por el backend. La variante escaneada se rasterizará con Pillow y se envolverá como PDF de imagen, sin agregar dependencias. Un generador reproducible conservará el contenido fuente, nombres de archivo y metadatos del manifiesto.

## Flujo de demostración

1. Elegir un escenario en `README.md`.
2. Crear el expediente y registrar los tres proveedores.
3. Cargar únicamente los documentos indicados por el escenario.
4. Ejecutar extracción explícita para cada documento.
5. Registrar los criterios del `criterios.json`.
6. Ejecutar el análisis y descargar el reporte.
7. Comparar decisión, riesgos y estado con `resultado-esperado.json`.

La variante OCR sustituirá a su equivalente digital. La variante incompleta también sustituirá a la oferta completa del mismo proveedor. El anexo contradictorio sí se cargará junto con la propuesta a la que contradice.

## Manejo de resultados no deterministas

`resultado-esperado.json` distinguirá entre invariantes y expectativas orientativas. Serán invariantes el número de documentos, el proveedor asociado, la presencia de datos explícitos, el estado esperado y los riesgos deliberadamente introducidos. El texto exacto del resumen y valores no contractuales de confianza no se tratarán como comparaciones byte a byte.

Si una integración externa no está configurada, la verificación se limitará a generación, extracción local, OCR y contratos estructurales. Esto se documentará; NO se presentará como una ejecución completa satisfactoria.

## Verificación

- [ ] Existen exactamente 15 PDF declarados en `manifest.json`.
- [ ] Todos los PDF abren y tienen una página A4.
- [ ] Las 12 ofertas base permiten extracción nativa de texto.
- [ ] La variante escaneada carece de texto nativo y produce texto mediante OCR.
- [ ] Todos los pesos por escenario suman `1.0`.
- [ ] Las referencias del manifiesto apuntan a archivos existentes.
- [ ] Los documentos contienen la leyenda de datos sintéticos.
- [ ] La oferta incompleta omite deliberadamente los campos documentados.
- [ ] La propuesta y el anexo logístico contienen plazos incompatibles.
- [ ] Las pruebas existentes del backend permanecen aprobadas.

## Fuera de alcance

- Automatizar la carga mediante una nueva interfaz.
- Cambiar la arquitectura o los contratos de Aristóteles.
- Ampliar el reporte PDF producido por la aplicación.
- Añadir proveedores, sectores o variantes después de alcanzar los 15 archivos.
- Incluir marcas, personas o datos comerciales reales.

