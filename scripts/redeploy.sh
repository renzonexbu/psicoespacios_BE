#!/bin/bash
# Script para volver a desplegar la aplicación en Fly.io

echo "🚀 Redeployando la aplicación en Fly.io..."

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

# Desplegar la aplicación
echo "🔄 Desplegando la aplicación..."
flyctl deploy

# Verificar el estado después del despliegue
echo "📊 Verificando estado de la aplicación..."
flyctl status

# Mostrar los logs recientes
echo "📜 Mostrando logs recientes..."
flyctl logs
