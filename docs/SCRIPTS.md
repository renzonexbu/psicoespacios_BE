## Scripts Unificados para PsicoEspacios Backend

Este documento describe los scripts y flujos de trabajo simplificados para la API de PsicoEspacios en entornos Docker y fly.io

### Flujo de Trabajo Principal

1. **Desarrollo Local**

   - `npm run start:dev` - Iniciar en modo desarrollo con recarga automática
   - `npm run db:migrate` - Ejecutar migraciones en ambiente local
   - `npm run db:seed` - Popular datos iniciales en ambiente local

2. **Despliegue en fly.io**
   - `fly deploy` - Desplegar la aplicación usando el Dockerfile principal
   - `npm run db:check-and-populate` - Verificar y popular la base de datos en fly.io
   - `npm run db:migrate:prod` - Ejecutar migraciones en producción

### Scripts Esenciales

- **Migraciones**

  - `scripts/run-migrations.sh` - Script wrapper para ejecutar migraciones
  - `src/database/migration-runner.ts` - Lógica principal para migraciones

- **Gestión de Base de Datos**

  - `scripts/init-database.js` - Inicializa la estructura básica de la base de datos
  - `scripts/populate-flyio-db.js` - Script para popular datos en fly.io
  - `scripts/check-and-populate-flyio-fixed.sh` - Versión mejorada para verificar y popular datos

- **Despliegue**
  - `Dockerfile` - Configuración para construir la imagen Docker

### Notas

Se han movido scripts redundantes o específicos para casos de uso único a `scripts/archived/` para mantener la estructura del proyecto limpia.
