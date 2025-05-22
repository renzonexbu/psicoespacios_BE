#!/bin/bash
# Script para ejecutar el script de población remotamente en fly.io

echo "Ejecutando script de población en fly.io..."

# Verificar que estamos conectados a fly.io
if ! fly status > /dev/null 2>&1; then
  echo "Error: No estás conectado a fly.io. Ejecuta 'flyctl auth login' primero."
  exit 1
fi

# Obtener el nombre de la aplicación de fly.toml
APP_NAME=$(grep "^app =" fly.toml | cut -d "=" -f2 | tr -d " \"")

if [ -z "$APP_NAME" ]; then
  echo "Error: No se pudo obtener el nombre de la aplicación desde fly.toml."
  exit 1
fi

echo "Aplicación detectada: $APP_NAME"

# Copiar script de población a la instancia de fly.io
echo "Copiando script de población a fly.io..."
fly ssh sftp shell --app "$APP_NAME" << EOF
mkdir -p /app/scripts
put scripts/populate-flyio-db.js /app/scripts/
EOF

# Ejecutar script de población en fly.io
echo "Ejecutando script de población en fly.io..."
fly ssh console --app "$APP_NAME" -C "cd /app && node scripts/populate-flyio-db.js"

echo "Proceso completado."
