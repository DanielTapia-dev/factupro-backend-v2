# Identidades — FactuPro

API NestJS para consultar cédula y RUC mediante proveedores HTTP externos. **No utiliza PostgreSQL** y rechaza `DB_*` o `DATABASE_URL` al arrancar. La clave `API_KEY` protege las consultas; debe tener al menos 32 caracteres y nunca se confirma en Git.

## Desarrollo

Usar Node 24.18.0 (`nvm use`) y npm con `package-lock.json`:

```bash
npm ci
# Crear .env local con API_KEY aleatoria de al menos 32 caracteres; no copiar claves al chat.
npm run start:dev
```

Pruebas sin datos personales ni llamadas a proveedores reales:

```bash
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
```

`GET /api/v1/health` comprueba el proceso y devuelve su revisión. No comprueba la disponibilidad de terceros. Las rutas `/api/v1/ciudadano/cedula/:id` y `/api/v1/ciudadano/ruc/:id` requieren el header `api-key`. Se conserva la política CORS existente hasta definir los clientes del entorno temporal.

## Imagen y despliegue AWS

La imagen usa Node 24.18.0 fijado por digest, usuario 1000, build ARM64 y una lista explícita de archivos permitidos. El Compose de desarrollo publica únicamente `127.0.0.1:3001:3000`. En AWS, infraestructura administra un Compose separado con filesystem de solo lectura, 400 MiB, 0.5 CPU, límites de procesos y rotación de logs.

`.github/workflows/aws-deploy.yml` valida PR sin credenciales AWS. Un push a main o una ejecución manual desde main valida, construye y prueba en un runner ARM64; después usa OIDC para publicar en `factupro/identity-backend` y ejecutar el documento fijo `factupro-platform-production-deploy-identity`. Los tags son el SHA completo e inmutables. Una repetición conserva la imagen previamente publicada para ese commit.

El host descarga exclusivamente `/factupro/production/identity-backend/API_KEY` desde SSM Standard SecureString. El workflow no recibe el secreto, acceso a PostgreSQL, shell arbitrario ni credenciales permanentes. No cargar los antiguos parámetros de base de datos de identity-backend.

Variables GitHub no secretas requeridas, ya previstas en Fase 5:

- `AWS_ACCOUNT_ID`
- `AWS_OIDC_ROLE_ARN`
- `PLATFORM_INSTANCE_ID`

Al fallar el healthcheck, el documento restaura la imagen, Compose y configuración secreta de la versión anterior, y devuelve un fallo de despliegue. Para comprobarlo, ejecutar manualmente el workflow con `rollback_test=true`: primero despliega el commit saludable y luego una imagen de prueba que devuelve 503. El workflow exige evidencia de la restauración de ese mismo SHA. Nunca usar esta fixture como versión normal.

## Acceso temporal

Por decisión del propietario, DNS y HTTPS están pendientes. El puerto 3001 solo es accesible por loopback en la EC2; usar un túnel administrativo SSO:

```bash
aws sso login --profile factupro-admin
aws ssm start-session --target INSTANCE_ID --profile factupro-admin --region us-east-1 \
  --document-name AWS-StartPortForwardingSession \
  --parameters '{"portNumber":["3001"],"localPortNumber":["3001"]}'
```

En otra terminal: `curl --fail http://127.0.0.1:3001/api/v1/health`. Usar el instance ID exportado por factupro-infrastructure. No abrir puertos públicos adicionales.

La aceptación AWS/GitHub y las limitaciones de Fase 6 se registran en `factupro-infrastructure/docs/PHASE6.md`; el código preparado no implica que el despliegue ya haya sido ejecutado. No modifica Heroku ni sus datos.
