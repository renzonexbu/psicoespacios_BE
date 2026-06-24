# 🏥 PsicoEspacios - Backend

> **Traspaso a nuevo desarrollador:** leer primero [docs/HANDOFF_DESARROLLADOR.md](docs/HANDOFF_DESARROLLADOR.md) y [docs/INDICE_DOCUMENTACION.md](docs/INDICE_DOCUMENTACION.md). Plantilla de entorno: [.env.example](.env.example).

<p>
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS Badge"/>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript Badge"/>
  <img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Badge"/>
  <img src="https://img.shields.io/badge/Fly.io-8e44ad?style=for-the-badge&logo=fly&logoColor=white" alt="Fly.io Badge"/>
</p>

## 📋 Descripción

PsicoEspacios es una plataforma integral para la gestión de espacios terapéuticos y consultas psicológicas. Este repositorio contiene el backend de la aplicación, desarrollado con NestJS.

### 🎯 Características Principales

- 👥 Gestión de usuarios y roles (profesionales, pacientes, administradores)
- 📅 Sistema de reservas y agenda
- 💰 Gestión de pagos y suscripciones
- 📍 Administración de sedes y boxes
- 📊 Reportes y estadísticas
- 🔄 Sistema de derivaciones
- 📝 Gestión de fichas de sesión
- 📞 Módulo de contacto y atención al cliente

## 🛠️ Tecnologías Utilizadas

- **Framework:** NestJS
- **Lenguaje:** TypeScript
- **Base de Datos:** PostgreSQL
- **Contenedorización:** Docker
- **Autenticación:** JWT

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js (v20.11.1 o superior)
- Docker y Docker Compose
- npm o yarn

### Instalación

1. Clonar el repositorio:

   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd psicoespacios_BE
   ```

2. Instalar dependencias:

   ```bash
   npm install
   ```

3. Configurar la base de datos:

   **En Windows**, usa el script automatizado:

   ```bash
   # Ejecutar el script batch para configurar completamente la base de datos
   setup-database.bat
   ```

   **En cualquier sistema operativo**:

   ```bash
   # Iniciar contenedores Docker
   docker-compose up -d

   # Configurar la base de datos completa
   npm run db:setup-full
   ```

   Para más detalles, consulta [la documentación de configuración de la base de datos](docs/DATABASE_SETUP.md)
   \`\`\`

4. Configurar variables de entorno:
   \`\`\`bash
   cp .env.example .env

# Editar .env con tus configuraciones

\`\`\`

4. Iniciar servicios con Docker:
   \`\`\`bash
   docker-compose up -d
   \`\`\`

5. Iniciar la aplicación:
   \`\`\`bash

# Desarrollo

npm run start:dev

# Producción

npm run start:prod
\`\`\`

## 🗂️ Estructura del Proyecto

- \`/src/admin\` - Módulo de administración
- \`/src/auth\` - Autenticación y autorización
- \`/src/boxes\` - Gestión de espacios terapéuticos
- \`/src/derivacion\` - Sistema de derivaciones
- \`/src/gestion\` - Gestión de pacientes y planes
- \`/src/pagos\` - Procesamiento de pagos
- \`/src/reportes\` - Generación de reportes
- \`/src/reservas\` - Sistema de reservas
- \`/src/sedes\` - Administración de sedes

## 🧪 Testing

\`\`\`bash

# Tests unitarios

npm run test

# Tests e2e

npm run test:e2e

# Cobertura

npm run test:cov
\`\`\`

## 🔄 Gestión de Migraciones

El sistema cuenta con un sistema de migraciones automático para crear y poblar la base de datos:

```bash
# Ejecutar migraciones en entorno de desarrollo
npm run db:migrate

# Ejecutar migraciones en entorno de producción
npm run db:migrate:prod
```

Para más información sobre el sistema de migraciones, consulta la [documentación detallada](./docs/MIGRATIONS.md).

Para gestionar migraciones manualmente, puedes usar el script `migrate.sh`:

````bash
# Ejecutar migraciones
./migrate.sh run

# Mostrar estado de migraciones
./migrate.sh show

# Crear una nueva migración
./migrate.sh create NuevaMigracion

# Generar una migración basada en cambios de entidades
./migrate.sh generate CambiosEntidad

# Revertir la última migración

./migrate.sh revert
\`\`\`

## 📚 Documentación API

La documentación de endpoints está en la carpeta [docs/](docs/). Índice: [docs/INDICE_DOCUMENTACION.md](docs/INDICE_DOCUMENTACION.md). Para traspaso y setup: [docs/HANDOFF_DESARROLLADOR.md](docs/HANDOFF_DESARROLLADOR.md).

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu Feature Branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit tus cambios (\`git commit -m 'Add some AmazingFeature'\`)
4. Push al Branch (\`git push origin feature/AmazingFeature\`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo \`LICENSE\` para más detalles.

## 🚀 Despliegue en Vercel

Para desplegar la aplicación en Vercel:

1. Preparar el proyecto para despliegue:

```bash
./scripts/prepare-deploy.sh
````

2. Configurar variables de entorno en Vercel:

   - DATABASE_URL
   - DATABASE_HOST
   - DATABASE_USER
   - DATABASE_PASSWORD
   - DATABASE_NAME
   - JWT_SECRET
   - JWT_EXPIRATION

3. Ejecutar el despliegue:

```bash
npm run deploy:vercel
```

### Solución de problemas de despliegue

Si encuentras el error "Function size too large":

1. Asegúrate de que el proyecto esté limpio (`./scripts/prepare-deploy.sh`)
2. Verifica que `.vercelignore` esté configurado correctamente
3. Usa solo las dependencias necesarias para producción

## 🚀 Despliegue en Fly.io

El proyecto está configurado para ser desplegado en Fly.io, una plataforma que permite alojar tanto la API como la base de datos PostgreSQL.

### Requisitos previos

1. Tener una cuenta en [Fly.io](https://fly.io)
2. Tener instalado `flyctl` (CLI de Fly.io):
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

### Pasos para el despliegue

1. Iniciar sesión en Fly.io:

   ```bash
   flyctl auth login
   ```

2. Ejecutar el script de despliegue:
   ```bash
   ./scripts/deploy-fly.sh
   ```

Este script automatiza el proceso de:

- Crear una aplicación en Fly.io (si no existe)
- Crear una base de datos PostgreSQL (si no existe)
- Conectar la base de datos a la aplicación
- Desplegar la aplicación con la configuración del archivo `fly.toml`

### Verificar el despliegue

Una vez completado el despliegue, puedes verificar el estado de tu aplicación:

```bash
flyctl status -a psicoespacios-api
```

Para ver los logs de la aplicación:

```bash
flyctl logs -a psicoespacios-api
```
