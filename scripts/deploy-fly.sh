#!/bin/bash

# Script para desplegar en Fly.io
# Uso: ./scripts/deploy-fly.sh

set -e

echo "🚀 Preparando despliegue en Fly.io..."

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

# Verificar si la aplicación ya existe
if ! flyctl apps list | grep -q "psicoespacios-api"; then
    echo "🆕 Creando nueva aplicación en Fly.io..."
    flyctl apps create psicoespacios-api
fi

# Verificar si necesitamos crear una base de datos PostgreSQL
if ! flyctl postgres list | grep -q "psicoespacios-db"; then
    echo "🔄 Creando base de datos PostgreSQL..."
    flyctl postgres create --name psicoespacios-db --region scl || {
        echo "⚠️ Error al crear la base de datos. Puede que ya exista con otro nombre o haya problemas de permisos."
        echo "⚠️ Continuando con el despliegue de todas formas..."
    }
    
    # Conectar la base de datos a la aplicación
    echo "🔄 Conectando base de datos a la aplicación..."
    flyctl postgres attach psicoespacios-db --app psicoespacios-api || {
        echo "⚠️ Error al conectar la base de datos a la aplicación."
        echo "⚠️ Puede que necesite conectarla manualmente más tarde."
        echo "⚠️ Continuando con el despliegue de todas formas..."
    }
fi

# Ejecutar script para corregir enums antes del despliegue con timeout
echo "🔧 Verificando y corrigiendo enums en la base de datos..."

# Determinar qué comando de timeout usar (en macOS es gtimeout si se instaló con brew)
TIMEOUT_CMD="timeout"
if command -v gtimeout &> /dev/null; then
    TIMEOUT_CMD="gtimeout"
elif ! command -v timeout &> /dev/null; then
    echo "⚠️ El comando 'timeout' no está disponible. Saltando la verificación de enums..."
    echo "⚠️ Para instalar timeout en macOS: brew install coreutils"
    echo "⚠️ Continuando con el despliegue de todas formas..."
else
    $TIMEOUT_CMD 30 bash ./scripts/fix-enum.sh || {
      echo "⚠️ El script fix-enum.sh ha excedido el tiempo de espera o ha fallado. Continuando con el despliegue de todas formas..."
    }
fi

# Desplegar la aplicación
echo "🚀 Desplegando aplicación..."
echo "⚠️ Si la migración falla, ejecute ./scripts/fix-enum.sh para corregir los enums y luego vuelva a desplegar."

# Realizar el despliegue con un timeout largo para evitar bloqueos
if command -v timeout &> /dev/null || command -v gtimeout &> /dev/null; then
    TIMEOUT_CMD="timeout"
    if command -v gtimeout &> /dev/null; then
        TIMEOUT_CMD="gtimeout"
    fi
    
    echo "⏱️ Aplicando timeout de 10 minutos al despliegue..."
    $TIMEOUT_CMD 600 flyctl deploy || {
        echo "⚠️ El despliegue ha excedido el tiempo límite o ha fallado."
        echo "⚠️ Puede intentar de nuevo más tarde o verificar los logs con 'flyctl logs -a psicoespacios-api'."
        exit 1
    }
else
    # Sin timeout disponible
    flyctl deploy || {
        echo "⚠️ El despliegue ha fallado."
        echo "⚠️ Puede intentar de nuevo más tarde o verificar los logs con 'flyctl logs -a psicoespacios-api'."
        exit 1
    }
fi

echo "✅ Despliegue completado con éxito!"
echo "🌐 La aplicación está disponible en: https://psicoespacios-api.fly.dev/"
echo "📜 Para ver los logs: fly logs -a psicoespacios-api"
