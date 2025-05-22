#!/bin/bash

# Script para verificar el estado de la base de datos PostgreSQL en Fly.io

echo "🔍 Comprobando el estado de la base de datos en Fly.io..."

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

# Listar todas las aplicaciones
echo "📋 Listando aplicaciones en Fly.io..."
flyctl apps list

# Listar bases de datos PostgreSQL
echo "📋 Listando bases de datos PostgreSQL en Fly.io..."
flyctl postgres list

# Verificar si la base de datos psicoespacios-db existe
if flyctl postgres list | grep -q "psicoespacios-db"; then
    echo "✅ La base de datos psicoespacios-db existe."