# Configuración de la Base de Datos para PsicoEspacios

Este documento describe el proceso de configuración de la base de datos para el proyecto PsicoEspacios, permitiendo su fácil instalación en diferentes equipos.

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- Node.js (v20.11.1 o superior)
- Docker y docker-compose
- PostgreSQL (opcional, solo si no usas Docker)

## Configuración Rápida (Windows)

Para configurar la base de datos en Windows, simplemente ejecuta el archivo batch incluido en el proyecto:

```
setup-database.bat
```

Este script ejecutará automáticamente todos los pasos necesarios para configurar tu base de datos.

## Configuración Manual

Si prefieres configurar la base de datos manualmente o si estás usando otro sistema operativo, sigue estos pasos:

### 1. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=psicoespacios_user
DATABASE_PASSWORD=psicoespacios_password
DATABASE_NAME=psicoespacios
JWT_SECRET=tuSecretoAqui
JWT_EXPIRATION=24h
PORT=3000
```

### 2. Iniciar los contenedores Docker

```bash
# En Windows (PowerShell)
docker-compose up -d

# En Linux/Mac
docker-compose up -d
```

### 3. Ejecutar el script de configuración completa

```bash
# En Windows (PowerShell)
npm run db:setup-full

# En Linux/Mac
npm run db:setup-full
```

### 4. Ejecutar migraciones manualmente (si es necesario)

```bash
# En Windows (PowerShell)
npm run db:migrate:win

# En Linux/Mac
npm run db:migrate
```

## Estructura de la Base de Datos

El proyecto utiliza TypeORM con migraciones para definir y mantener la estructura de la base de datos. Las principales tablas son:

- `users`: Usuarios del sistema (psicólogos, administradores, etc.)
- `sedes`: Sedes o sucursales donde se encuentran los boxes
- `boxes`: Espacios de consulta que pueden reservarse
- `planes`: Planes de suscripción disponibles
- `reservas`: Reservas de boxes realizadas por los usuarios
- `pagos`: Registro de pagos realizados
- `configuracion_sistema`: Configuración general del sistema

## Resolución de Problemas

### Error de conexión a la base de datos

Verifica que:

- Docker esté corriendo y el contenedor `psicoespacios_db` esté activo
- Las credenciales en el archivo `.env` sean correctas
- El puerto 5432 esté disponible

### Errores en las migraciones

Si encuentras errores específicos en las migraciones:

1. Elimina la base de datos completamente:

```
npm run db:setup-full
```

2. Si el problema persiste, verifica los archivos de migración en `src/database/migrations/` para asegurarte de que no haya conflictos en los nombres de columnas.

## Uso en Diferentes Entornos

### Entorno de Desarrollo Local

Usa la configuración predeterminada con el archivo `.env` como se describió anteriormente.

### Entorno de Producción

Para producción, configura las siguientes variables de entorno:

```
NODE_ENV=production
DATABASE_URL=tu_url_de_conexion_postgres
JWT_SECRET=tu_secreto_seguro_para_produccion
```

Y ejecuta las migraciones con:

```
npm run db:migrate:prod
```
