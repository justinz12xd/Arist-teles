# Desplegar Aristóteles en Azure sin migrar sus servicios gestionados

Aristóteles se desplegará como dos aplicaciones públicas en Azure: el frontend
Next.js en App Service y la API FastAPI/OCR en Container Apps. InsForge y
OpenRouter seguirán siendo servicios externos; sus credenciales privadas se
inyectarán desde Azure Key Vault y nunca se incluirán en artefactos de despliegue.

## Resultado esperado

1. Publicar el frontend en una URL HTTPS de App Service.
2. Publicar el backend en una URL HTTPS de Container Apps.
3. Permitir que el frontend acceda únicamente al backend desplegado.
4. Confirmar que el backend alcanza InsForge y OpenRouter sin revelar secretos.
5. Verificar el frontend y el endpoint `/health` después del despliegue.

## Alcance

### Incluido

- Un grupo de recursos de producción en `eastus`.
- Azure Container Registry para la imagen del backend.
- Azure Container Apps para FastAPI, OCR y generación de PDF.
- Azure App Service Linux para Next.js 16.
- Azure Key Vault para secretos privados del backend.
- Configuración de CORS con el origen exacto del frontend.
- Builds locales y pruebas de humo posteriores al despliegue.

### Fuera de alcance

- Migrar InsForge a servicios nativos de Azure.
- Reemplazar OpenRouter por Azure OpenAI.
- Rediseñar el pipeline síncrono como colas y workers.
- Conectar la landing actual a flujos de carga y análisis que todavía no existen
  en el frontend.
- Cambiar datos, políticas RLS o buckets de InsForge.

## Decisiones

| Tema | Decisión | Motivo |
| --- | --- | --- |
| Región | `eastus` | Mantiene cercanía con el endpoint actual de InsForge en US East. |
| Frontend | App Service Linux | Ejecuta `next build` y `next start` sin introducir un contenedor adicional. |
| Backend | Container Apps | El Dockerfile ya incluye Python, Tesseract y Pango. |
| Registro | Azure Container Registry | Conserva imágenes versionadas y evita registros públicos. |
| Secretos | Key Vault + identidad administrada | Separa credenciales del código, CLI y artefactos. |
| Backend externo | Mantener InsForge | Evita reescribir PostgREST, Auth, Storage, pgvector, RLS y Realtime. |
| IA externa | Mantener OpenRouter | Evita cambiar modelos, endpoints y clientes durante el despliegue. |
| Escalado inicial | Una réplica mínima | Prioriza una demo estable con costo controlado. |

## Componentes y límites

### Frontend

App Service ejecutará el proyecto Next.js desde la raíz del repositorio. Solo
recibirá configuración pública que el navegador pueda conocer. No recibirá
`OPENROUTER_API_KEY`, `INSFORGE_API_KEY` ni ninguna credencial administrativa.

### Backend

Container Apps ejecutará la imagen construida desde `backend/Dockerfile`. Tendrá
ingreso HTTPS público, expondrá FastAPI y conservará `/health` como prueba de
disponibilidad. Las operaciones OCR y multiagente seguirán siendo síncronas en
esta primera versión.

### Servicios gestionados externos

InsForge seguirá administrando datos, autenticación, almacenamiento, búsqueda
vectorial y realtime. OpenRouter seguirá atendiendo chat y embeddings. Azure
solo alojará el cómputo de la aplicación y sus secretos de despliegue.

## Flujo de datos

1. El navegador solicita el frontend a App Service.
2. El frontend llama a la URL HTTPS de Container Apps.
3. FastAPI valida la solicitud y procesa documentos dentro del contenedor.
4. El backend consulta o persiste información mediante InsForge.
5. El backend solicita chat o embeddings mediante OpenRouter.
6. FastAPI devuelve la respuesta al navegador.

El backend no confiará en comodines CORS: `ARISTOTELES_CORS_ORIGINS` contendrá
la URL exacta asignada al frontend.

## Secretos y configuración

### Privados

- `INSFORGE_API_KEY`
- `INSFORGE_ANON_KEY`
- `OPENROUTER_API_KEY`

Estos valores se crearán en Key Vault a partir de los archivos locales y se
referenciarán desde Container Apps. Los valores no se imprimirán en terminal,
logs, commits ni documentos.

### Configuración no secreta

- `INSFORGE_URL`
- `OPENROUTER_BASE_URL`
- `OPENROUTER_CHAT_MODEL`
- `OPENROUTER_EMBEDDING_MODEL`
- `LANGSMITH_PROJECT`
- `LANGSMITH_TRACING`
- Variables `ARISTOTELES_*` de límites y umbrales

Las variables `NEXT_PUBLIC_*` se consideran públicas por definición. Solo se
configurarán si el frontend realmente las necesita para el código desplegado.

Los archivos `.env.local` y `backend/.env` no se subirán. La raíz ya ignora
`.env*` y `backend/.dockerignore` excluye `.env*` del contexto de imagen.

## Manejo de fallos

| Fallo | Respuesta |
| --- | --- |
| Build de Next.js falla | Detener antes de crear o actualizar App Service. |
| Tests del backend fallan | No construir ni publicar una imagen. |
| Container App no responde | Revisar revisión, puerto, variables y logs; no publicar el frontend como exitoso. |
| InsForge u OpenRouter rechazan credenciales | Detener la verificación y corregir Key Vault/configuración sin mostrar valores. |
| CORS bloquea el navegador | Corregir el origen exacto y crear una nueva revisión. |
| Despliegue parcial | Conservar la última revisión saludable y reportar recursos creados. |

## Verificación

Antes de desplegar:

- `npm run build`
- Suite de pruebas configurada en `backend`
- Construcción local de la imagen del backend
- Confirmación de que ningún `.env` entra en los artefactos

Después de desplegar:

- Estado saludable de la revisión de Container Apps
- `GET /health` devuelve una respuesta exitosa
- La URL de App Service devuelve HTTP exitoso
- Los logs no contienen secretos ni errores de inicialización
- El backend puede alcanzar InsForge y OpenRouter mediante una comprobación
  controlada que no modifica datos de negocio

## Estrategia de reversión

- Container Apps conservará revisiones para volver a la última versión sana.
- App Service se actualizará solo después de pasar el build local.
- Los secretos permanecerán versionados en Key Vault.
- Si el despliegue no queda saludable, no se eliminarán automáticamente recursos
  con datos o secretos; se reportará el estado para decidir la limpieza.

## Criterios de aceptación

- [ ] Frontend y backend tienen URLs HTTPS públicas en Azure.
- [ ] `/health` responde correctamente desde Internet.
- [ ] CORS permite exclusivamente el frontend desplegado.
- [ ] Ningún archivo `.env` ni secreto aparece en Git o artefactos.
- [ ] La aplicación conserva conectividad con InsForge y OpenRouter.
- [ ] Los recursos, URLs y comandos de diagnóstico quedan documentados.

## Próximo paso

Tras aprobar este documento, se preparará el plan ejecutable, se validará el
árbol de trabajo actual y se crearán los recursos con Azure CLI.
