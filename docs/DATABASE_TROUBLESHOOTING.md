# Guía de Configuración y Solución de Problemas de Base de Datos

## Configuración Rápida

Para configurar la base de datos desde cero (eliminar todos los datos existentes e inicializar una base de datos limpia):

### En Windows:

```bash
# Opción 1: Usando el archivo batch
setup-database.bat

# Opción 2: Usando npm directamente
npm run db:reset
```

### En Linux/Mac:

```bash
npm run db:reset
```

## Solución de Problemas Comunes

### 1. Error de autenticación con PostgreSQL

Si encuentras un error como:

```
Error al recrear la base de datos: error: password authentication failed for user "postgres"
```

Esto significa que las credenciales de conexión a la base de datos no son correctas. Soluciones:

- Verifica que Docker está en ejecución con `docker ps`
- Revisa las credenciales en tu archivo `.env` y en `docker-compose.yml`
- Usa el script `db:reset` que recrea el contenedor Docker completamente

### 2. Error en las migraciones

Si las migraciones fallan con errores como "column X does not exist":

```bash
# Usa el script de reinicio completo para recrear la base de datos desde cero
npm run db:reset
```

### 3. Contenedor Docker no inicia correctamente

Si el contenedor Docker no está iniciando:

```bash
# Detén todos los servicios
docker-compose down

# Elimina volúmenes para asegurar un inicio limpio
docker-compose down -v

# Inicia los contenedores nuevamente
docker-compose up -d
```

### 4. Acceder a la base de datos directamente

Para conectarse directamente a la base de datos:

```bash
# Usando el cliente psql dentro del contenedor
docker exec -it psicoespacios_db psql -U psicoespacios_user -d psicoespacios

# O usando el panel de administración web Adminer
# Accede a: http://localhost:8084
# Sistema: PostgreSQL
# Servidor: postgres (¡importante: usar este nombre exacto!)
# Usuario: psicoespacios_user
# Contraseña: psicoespacios_password
# Base de datos: psicoespacios
```

### 5. Verificar estructura de tablas

Para verificar la estructura de una tabla específica:

```bash
# Ejemplo para la tabla users
docker exec -it psicoespacios_db psql -U psicoespacios_user -d psicoespacios -c "\d users"

# Listar todas las tablas
docker exec -it psicoespacios_db psql -U psicoespacios_user -d psicoespacios -c "\dt"
```

## Comandos Útiles

### Recrear base de datos

```bash
npm run db:reset
```

### Ejecutar solo migraciones (sin recrear la base de datos)

```bash
# En Windows
npm run db:migrate:win

# En Linux/Mac
npm run db:migrate
```

### Verificar estado de los contenedores Docker

```bash
docker ps
```

### Verificar logs del contenedor de PostgreSQL

```bash
docker logs psicoespacios_db
```

## Estructura de la Base de Datos

La base de datos consta de las siguientes tablas principales:

- `users`: Usuarios del sistema (administradores, psicólogos, etc.)
- `sedes`: Sedes o ubicaciones físicas
- `boxes`: Espacios de consulta disponibles para reserva
- `planes`: Planes de suscripción
- `reservas`: Reservas de boxes
- `pagos`: Registro de pagos
- `configuracion_sistema`: Configuración general del sistema

Para más detalles sobre el esquema, consulta las migraciones en `src/database/migrations/`.
