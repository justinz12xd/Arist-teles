# Autodesplegar Aristóteles desde `main`

Cada `push` a `main` validará y desplegará frontend y backend en los recursos
Azure existentes. GitHub se autenticará con OIDC; no se almacenarán contraseñas,
publish profiles ni archivos `.env` en GitHub.

## Flujo

1. GitHub Actions obtiene el commit de `main`.
2. Ejecuta pruebas del backend y build del frontend.
3. Construye `backend/` en ACR con una etiqueta basada en el SHA del commit.
4. Actualiza Container Apps únicamente si la construcción termina correctamente.
5. Empaqueta el frontend excluyendo `.env*`, backend, cachés y artefactos locales.
6. Despliega el paquete en App Service y comprueba ambas URLs HTTPS.

## Seguridad

- Una identidad administrada exclusiva tendrá una credencial federada limitada a
  `repo:justinz12xd/Arist-teles:ref:refs/heads/main`.
- La identidad tendrá `Contributor` solo sobre `rg-aristoteles-prod-eus`.
- El workflow solicitará `id-token: write` y `contents: read`.
- Los identificadores Azure necesarios no se consideran secretos; las
  credenciales de aplicación permanecen exclusivamente en Key Vault.
- El workflow nunca leerá ni sincronizará `backend/.env`.

## Concurrencia y fallos

- `concurrency` cancelará una ejecución anterior de la misma rama.
- Ningún fallo de pruebas o build actualizará recursos Azure.
- El backend conservará revisiones anteriores para rollback.
- El frontend solo se actualizará después de completar su build.
- También existirá `workflow_dispatch` para reintentos manuales.

## Alcance

- Trigger automático: únicamente `push` a `main`.
- Los pull requests no desplegarán producción.
- No se crearán nuevos entornos ni se migrarán InsForge/OpenRouter.
- La rotación o eliminación de secretos seguirá siendo una operación separada.

## Criterios de aceptación

- [ ] Existe `.github/workflows/deploy-azure.yml`.
- [ ] Azure acepta OIDC desde `main` sin secretos permanentes de GitHub.
- [ ] Un commit nuevo produce una imagen ACR etiquetada con su SHA.
- [ ] Container Apps usa esa imagen y queda saludable.
- [ ] App Service publica el frontend del mismo commit.
- [ ] Los logs del workflow no contienen valores del `.env`.
