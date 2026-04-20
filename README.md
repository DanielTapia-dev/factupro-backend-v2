<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# FacturPRO Backend

## Desarrollo local

1. Clonar el proyecto
2. `yarn install`
3. Clonar el archivo `.env.example` y renombrarlo a `.env`
4. Cambiar las variables de entorno
   - Si el puerto `5432` esta ocupado, usar otro puerto en `DB_PORT`.
   - Ejemplo: `DB_PORT=5433`.
5. Levantar la aplicacion

```
yarn start:dev
```

La base de datos esta deshabilitada por defecto con `DB_ENABLED=false`, porque
actualmente el proyecto no usa tablas propias.

## Variables para Docker local

Docker Compose toma las variables desde `.env`.

```
PORT=3000
CORS_ORIGIN=*
DB_ENABLED=false
DB_PORT=5433
DB_CONTAINER_NAME=factuPro
API_CONTAINER_NAME=facturpro-api
DB_DATA_PATH=./postgres
```

`DB_PORT` controla el puerto expuesto en tu maquina. Por ejemplo, con
`DB_PORT=5433`, PostgreSQL queda disponible en `localhost:5433`.

`CORS_ORIGIN` controla que frontend puede consumir la API. Para pruebas puede
usarse `*`; para produccion conviene usar el dominio real, por ejemplo
`https://app.example.com`. Si hay varios origenes, separarlos por coma.

Dentro de Docker, la API se conecta al servicio `db` por el puerto interno
`5432`. Por eso `docker-compose.yaml` mantiene `DB_PORT: 5432` para el
contenedor de la API, aunque tu maquina use `5433` hacia afuera.

Para levantar solo la API con Docker:

```
docker compose up -d --build api
```

Para levantar tambien PostgreSQL localmente:

```
yarn db:up
```

En ese caso, configurar `DB_ENABLED=true` y ejecutar `yarn migrations` cuando
existan migraciones.

## Migraciones de base de datos

El proyecto usa PostgreSQL con TypeORM. La base se debe modificar con
migraciones versionadas, no con `synchronize`.

Por ahora la base esta deshabilitada por defecto. Para crear una base local
desde cero cuando el proyecto ya tenga entidades o migraciones:

```
yarn db:up
yarn migrations
yarn start:dev
```

En Docker Compose la API ejecuta migraciones pendientes al iniciar si
`DB_MIGRATIONS_RUN=true`.

Esto es practico para desarrollo local cuando se use base de datos. Para
produccion se recomienda dejar `DB_MIGRATIONS_RUN=false` y ejecutar las
migraciones como un paso separado del despliegue.

Flujo recomendado cuando cambian entidades:

1. Crear o modificar entidades `*.entity.ts`.
2. Crear la migracion correspondiente en `src/database/migrations`.
3. Aplicarla localmente:

```
yarn migrations
```

4. Subir al repositorio la entidad y la migracion.

Nota: este repositorio no contiene entidades ni migraciones antiguas, asi que
no se puede reconstruir una estructura previa que no quedo guardada en el
codigo. A partir de ahora, los cambios nuevos si quedan versionados.

## Estado actual de la base

Actualmente el repositorio no tiene entidades `*.entity.ts` ni migraciones con
tablas de negocio. Si se crea una base nueva y se ejecuta `yarn migrations`,
no se crearan tablas de la aplicacion porque todavia no hay migraciones para
aplicar.

Como el backend actual solo consulta servicios externos, puede ejecutarse sin
base de datos usando:

```
DB_ENABLED=false
DB_MIGRATIONS_RUN=false
```

Cuando se agreguen entidades y migraciones, cualquier integrante del equipo
podra reconstruir la estructura de la base desde cero ejecutando:

```
yarn db:up
yarn migrations
```

## Produccion en AWS

Para AWS, el flujo recomendado cambia respecto al entorno local:

1. Si se usa base de datos, usar Amazon RDS PostgreSQL o Aurora PostgreSQL.
2. No levantar PostgreSQL con Docker Compose en produccion final.
3. Mientras el proyecto no use base, configurar `DB_ENABLED=false`.
4. Ejecutar la API en un servicio como ECS Fargate, App Runner, Elastic
   Beanstalk o EC2 con Docker.
5. Guardar credenciales y llaves en AWS Secrets Manager o SSM Parameter Store.
6. Configurar `DB_MIGRATIONS_RUN=false` en produccion.
7. Cuando existan migraciones, ejecutar `yarn migrations` una sola vez antes de
   desplegar la nueva version de la API.

Ejemplo de pipeline recomendado:

```
yarn install
yarn build
yarn test
docker build
docker push
deploy api
```

Si `DB_ENABLED=true` y ya existen migraciones, agregar `yarn migrations` antes
de `deploy api`.

La migracion en produccion debe ejecutarse como una tarea puntual, por ejemplo:

- Una tarea one-off de ECS dentro de la misma VPC de RDS.
- Un paso de AWS CodeBuild con acceso a la VPC.
- Un job de GitHub Actions conectado a AWS y con acceso seguro a la base.

No se recomienda que cada contenedor de la API ejecute migraciones al arrancar,
porque con varias replicas dos contenedores podrian intentar migrar la base al
mismo tiempo.

Antes de produccion, revisar que el comando de migraciones se pueda ejecutar en
el entorno elegido. El comando actual usa `ts-node`, lo cual es comodo en local;
si se ejecuta dentro de una imagen Docker de produccion, puede convenir agregar
un script de migraciones sobre los archivos compilados en `dist`.

## Staging en Lightsail con PM2

El ambiente de pruebas usa una instancia Lightsail con Node.js, PM2 y Nginx.
Por ahora no usa base de datos, asi que el `.env` de la instancia debe tener:

```
PORT=3000
API_KEY=change-me
CORS_ORIGIN=*
DB_ENABLED=false
DB_MIGRATIONS_RUN=false
```

El archivo debe vivir en:

```
~/apps/factupro-identity-backend/.env
```

En GitHub Actions usar la ruta absoluta equivalente. Para el usuario `ubuntu`
seria:

```
/home/ubuntu/apps/factupro-identity-backend
```

El proceso PM2 se define en `ecosystem.config.cjs` y se llama:

```
facturpro-api-staging
```

Para probar manualmente en la instancia:

```
cd ~/apps/factupro-identity-backend
npm ci
npm run build
npm prune --omit=dev
pm2 start ecosystem.config.cjs --update-env
pm2 save
```

Nginx debe hacer proxy hacia el puerto interno de la API:

```
server {
  listen 80;
  server_name _;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

Despues de cambiar Nginx:

```
sudo nginx -t
sudo systemctl reload nginx
```

La API debe responder en:

```
http://IP_PUBLICA/api/v1/docs
```

## Pipeline GitHub Actions

El pipeline esta en `.github/workflows/deploy-staging.yml`.

Se ejecuta cuando hay push a la rama:

```
stagging
```

Tambien se puede ejecutar manualmente desde la pestana Actions de GitHub.

Secrets requeridos en GitHub:

```
STAGING_HOST=IP_PUBLICA_DE_LIGHTSAIL
STAGING_USER=ubuntu
STAGING_SSH_KEY=llave privada SSH
STAGING_PATH=/home/ubuntu/apps/factupro-identity-backend
```

El pipeline hace:

1. Instala dependencias en GitHub Actions.
2. Compila el proyecto.
3. Ejecuta tests.
4. Prepara dependencias de produccion en GitHub Actions.
5. Copia el codigo, `dist` y `node_modules` de produccion a Lightsail con `rsync`.
6. No sobrescribe `.env`.
7. Reinicia `facturpro-api-staging` con PM2.

La instancia no ejecuta `npm ci` ni `npm run build` durante el deploy. Eso evita
que Lightsail se quede sin memoria o corte la conexion SSH en planes pequenos.

Antes del primer deploy, la instancia debe tener instalado:

```
node --version
npm --version
pm2 --version
nginx -v
rsync --version
```

Si Node.js fue instalado con `nvm`, el pipeline carga `~/.nvm/nvm.sh` antes de
ejecutar `npm`. Para validar lo mismo manualmente en la instancia:

```
source ~/.nvm/nvm.sh
nvm use 20
node --version
npm --version
pm2 --version
```
