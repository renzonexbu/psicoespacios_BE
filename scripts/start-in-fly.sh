#!/bin/sh
# Script de inicio para ejecutar en Fly.io

# Imprimir la estructura del directorio para depuración
echo "Estructura del directorio actual:"
ls -la

# Explorar la estructura de 'dist' para depuración
echo "Estructura del directorio dist:"
find dist -type d | sort

# Esperando a que la base de datos esté disponible
echo "Esperando a que la base de datos esté disponible..."
sleep 10

# Ejecutar las migraciones
echo "Ejecutando migraciones..."
NODE_ENV=production node /app/dist/src/database/config/typeorm.config.js migration:run || {
    echo "Error al ejecutar migraciones, pero continuando el despliegue..."
}

# Iniciar la aplicación
echo "Iniciando aplicación..."
node /app/dist/src/main.js
