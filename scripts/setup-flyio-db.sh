#!/bin/bash

# Script para configurar la base de datos en Fly.io
# Uso: ./scripts/setup-flyio-db.sh

set -e

echo "🔄 Configurando base de datos PostgreSQL en Fly.io..."

# Verificar si Flyctl está instalado
if ! command -v flyctl &> /dev/null; then
    echo "🔴 Flyctl no está instalado. Instalando..."
    curl -L https://fly.io/install.sh | sh
    export PATH="$HOME/.fly/bin:$PATH"
fi

# Verificar si el usuario está autenticado
if ! flyctl auth whoami &> /dev/null; then
    echo "🔑 Iniciando sesión en Fly.io..."
    flyctl auth login
fi

# Verificar si la base de datos PostgreSQL ya existe
if ! flyctl postgres list | grep -q "psicoespacios-db"; then
    echo "🆕 Creando base de datos PostgreSQL..."
    flyctl postgres create --name psicoespacios-db --region scl
else
    echo "✅ Base de datos PostgreSQL ya existe."
fi

# Obtener la cadena de conexión a la base de datos
DB_URL=$(flyctl postgres connect --app psicoespacios-db --command "\\conninfo" | grep "postgresql://" | awk '{print $3}')

if [ -z "$DB_URL" ]; then
    echo "🔴 No se pudo obtener la cadena de conexión a la base de datos."
    exit 1
fi

echo "🔄 Configurando variables de entorno para la aplicación..."
flyctl secrets set DATABASE_URL="$DB_URL" --app psicoespacios-api

echo "🔄 Ejecutando migraciones..."
flyctl ssh console --app psicoespacios-api --command "cd /app && npm run migration:run"

echo "✅ Configuración de base de datos completada con éxito!"
