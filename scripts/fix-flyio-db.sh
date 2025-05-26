#!/bin/bash
# fix-flyio-db.sh - Script para corregir el esquema de la base de datos en Fly.io

echo "===== Iniciando script de corrección de base de datos en Fly.io ====="

# Configurar variables
APP_NAME="psicoespacios-api"
SCRIPT_PATH="scripts/fix-db-schema.js"

echo "Aplicación: $APP_NAME"
echo "Script a ejecutar: $SCRIPT_PATH"

# Verificar si flyctl está instalado
if ! command -v flyctl &> /dev/null; then
    echo "Error: flyctl no está instalado. Por favor, instálalo primero."
    exit 1
fi

# Verificar la autenticación de Fly.io
echo "Verificando autenticación en Fly.io..."
flyctl auth whoami || {
    echo "Error: No estás autenticado en Fly.io. Por favor, ejecuta 'flyctl auth login' primero."
    exit 1
}

# Verificar que la aplicación existe
echo "Verificando la aplicación en Fly.io..."
flyctl status -a $APP_NAME || {
    echo "Error: La aplicación $APP_NAME no existe o no tienes acceso a ella."
    exit 1
}

# Ejecutar el script de corrección de esquema
echo "Ejecutando script de corrección de esquema en Fly.io..."
flyctl ssh console -a $APP_NAME -C "cd /app && node $SCRIPT_PATH"

# Verificar el resultado
if [ $? -eq 0 ]; then
    echo "✅ Corrección de esquema completada exitosamente."
else
    echo "❌ Error al ejecutar el script de corrección de esquema."
    exit 1
fi

echo "===== Script de corrección finalizado ====="
