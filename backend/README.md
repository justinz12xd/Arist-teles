# Backend RAG de Aristóteles

Primer corte vertical del RAG: una API FastAPI crea expedientes, indexa texto ya extraído por página y responde preguntas con citas validadas. LangChain se usa en los límites de partición y OpenAI; el dominio accede a InsForge mediante REST/RPC con el JWT del usuario.

## Alcance

- InsForge se conserva para Auth, Storage, Postgres, `pgvector` y Realtime. Este incremento usa Auth, Postgres y `pgvector`; la carga binaria a Storage y los eventos Realtime pertenecen a entregas posteriores.
- OpenAI se invoca directamente para chat y embeddings; no se usa el Model Gateway de InsForge para este flujo.
- La entrada de indexación son páginas de texto. PDF, imágenes, parsing y OCR no forman parte de este incremento.
- El fallback de OCR visual sigue siendo futuro y configurable, fuera de este incremento RAG; no se cambia aquí su proveedor previsto.

OpenAI recibe el texto indexado para crear embeddings. Al responder, también recibe la pregunta y los chunks recuperados que forman el contexto. InsForge almacena los registros, el texto y los vectores, y aplica RLS con el JWT del usuario.

## Requisitos

- Python 3.12.
- [`uv`](https://docs.astral.sh/uv/).
- Node.js con `npx` para la CLI de InsForge.
- Un proyecto InsForge y una clave de OpenAI para el smoke test remoto.

## Configuración local

Desde `backend/`, cree el archivo local ignorado a partir de la plantilla:

```powershell
Copy-Item .env.example .env
```

Complete `OPENAI_API_KEY` e `INSFORGE_BASE_URL` solo en `backend/.env` o en el entorno del proceso. La plantilla deja ambos valores vacíos, limita CORS a `http://localhost:3000` y mantiene `LANGSMITH_TRACING=false`. El flujo normal no necesita una clave administrativa de InsForge.

## Instalación y verificación local

Ejecute desde `backend/`:

```powershell
uv sync --python 3.12
uv run pytest -q
uv run ruff check src tests
uv run uvicorn aristoteles_api.main:app --reload --port 8000
```

`GET http://127.0.0.1:8000/health` no requiere credenciales externas. Las pruebas locales usan adaptadores falsos y no sustituyen la verificación con proveedores reales.

## Crear y enlazar InsForge

1. Cree un proyecto en [InsForge](https://insforge.dev), espere a que esté disponible y copie el ID del proyecto.
2. Desde la raíz del repositorio, autentique la CLI, enlace ese proyecto, confirme el contexto y aplique todas las migraciones pendientes:

```powershell
npx @insforge/cli login
npx @insforge/cli link --project-id <project-id>
npx @insforge/cli current
npx @insforge/cli db migrations up --all
```

3. Copie la URL base de la API del proyecto en `INSFORGE_BASE_URL`. No agregue el ID, la URL ni credenciales reales a esta guía o a `.env.example`.

Enlazar un proyecto crea configuración local bajo `.insforge/`, que permanece ignorada. La migración es forward-only y se aplica fuera del proceso de la aplicación.

## Obtener dos JWT de usuario

Cree dos usuarios distintos en InsForge Auth y verifique sus correos, o créelos con **Auto-confirm** habilitado para un entorno de prueba. Inicie sesión con cada cuenta mediante la aplicación o con el endpoint de usuario de InsForge. No use un token `project_admin`: las rutas RAG requieren JWT de usuarios autenticados.

El siguiente ejemplo conserva los tokens solo en la sesión actual de PowerShell:

```powershell
$InsForgeBaseUrl = "https://<project-subdomain>.insforge.app"

$loginA = Invoke-RestMethod -Method Post `
  -Uri "$InsForgeBaseUrl/api/auth/sessions?client_type=server" `
  -ContentType "application/json" `
  -Body (@{ email = "<user-a-email>"; password = "<user-a-password>" } | ConvertTo-Json)
$JwtA = $loginA.accessToken

$loginB = Invoke-RestMethod -Method Post `
  -Uri "$InsForgeBaseUrl/api/auth/sessions?client_type=server" `
  -ContentType "application/json" `
  -Body (@{ email = "<user-b-email>"; password = "<user-b-password>" } | ConvertTo-Json)
$JwtB = $loginB.accessToken
```

No escriba los JWT, contraseñas ni respuestas de login en archivos o logs.

## Ejemplos de API

Con el servidor local activo y `$JwtA` obtenido, cree un expediente. La respuesta esperada es `201` e incluye `id`, `objective` y `created_at`.

```powershell
$ApiBaseUrl = "http://127.0.0.1:8000"
$HeadersA = @{ Authorization = "Bearer $JwtA" }

$caseA = Invoke-RestMethod -Method Post `
  -Uri "$ApiBaseUrl/v1/cases" `
  -Headers $HeadersA `
  -ContentType "application/json" `
  -Body (@{ objective = "Comparar las garantías de los proveedores" } | ConvertTo-Json)
$CaseAId = $caseA.id
```

Indexe texto separado por páginas. Una indexación nueva responde `201`; repetir la misma entrada normalizada responde `200` con `already_indexed=true`.

```powershell
$documentA = Invoke-RestMethod -Method Post `
  -Uri "$ApiBaseUrl/v1/cases/$CaseAId/documents/text" `
  -Headers $HeadersA `
  -ContentType "application/json" `
  -Body (@{
    name = "cotizacion-proveedor-a.pdf"
    pages = @(
      @{ page = 1; text = "El proveedor A ofrece soporte técnico." }
      @{ page = 2; text = "La garantía del proveedor A dura 24 meses." }
    )
  } | ConvertTo-Json -Depth 4)
```

Haga una pregunta. La respuesta `200` será `answered` con citas `[S#]` validadas, o `insufficient_context` sin citas.

```powershell
$answerA = Invoke-RestMethod -Method Post `
  -Uri "$ApiBaseUrl/v1/cases/$CaseAId/questions" `
  -Headers $HeadersA `
  -ContentType "application/json" `
  -Body (@{
    question = "¿Cuánto dura la garantía del proveedor A?"
    top_k = 5
  } | ConvertTo-Json)
$answerA | ConvertTo-Json -Depth 6
```

## Smoke test RLS con dos usuarios

Cree primero un expediente propio para el usuario B:

```powershell
$HeadersB = @{ Authorization = "Bearer $JwtB" }
$caseB = Invoke-RestMethod -Method Post `
  -Uri "$ApiBaseUrl/v1/cases" `
  -Headers $HeadersB `
  -ContentType "application/json" `
  -Body (@{ objective = "Expediente privado del usuario B" } | ConvertTo-Json)
$CaseBId = $caseB.id
```

Después compruebe ambos cruces. Cada solicitud debe devolver `404`, no `403`, para no revelar la existencia de un expediente ajeno:

```powershell
function Assert-CrossUserNotFound {
  param([string]$CaseId, [hashtable]$Headers)

  $statusCode = $null
  try {
    $null = Invoke-RestMethod -Method Post `
      -Uri "$ApiBaseUrl/v1/cases/$CaseId/questions" `
      -Headers $Headers `
      -ContentType "application/json" `
      -Body (@{ question = "¿Qué contiene este expediente?"; top_k = 5 } | ConvertTo-Json)
  } catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
  }

  if ($statusCode -ne 404) {
    throw "Se esperaba 404 para acceso cruzado; se recibió $statusCode"
  }
}

Assert-CrossUserNotFound -CaseId $CaseAId -Headers $HeadersB
Assert-CrossUserNotFound -CaseId $CaseBId -Headers $HeadersA
```

Este smoke test remoto **no se ha ejecutado**. Todavía no se afirma que el proyecto esté enlazado, que la migración se haya aplicado, que RLS haya sido verificado entre dos usuarios ni que se hayan completado llamadas reales a OpenAI. Ejecute los pasos anteriores cuando existan un proyecto InsForge enlazado, dos usuarios de prueba y una clave de OpenAI válida.
