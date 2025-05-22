#!/bin/bash
# Script para poblar la base de datos en fly.io

echo "Poblando la base de datos en fly.io..."

# Verificar que estamos conectados a fly.io
if ! fly status > /dev/null 2>&1; then
  echo "Error: No estás conectado a fly.io. Ejecuta 'flyctl auth login' primero."
  exit 1
fi

# Verificar que NODE_ENV y DATABASE_URL están configurados
if ! fly secrets list | grep -q "DATABASE_URL"; then
  echo "Error: DATABASE_URL no está configurado en fly.io. Configúralo con 'fly secrets set DATABASE_URL=...'."
  exit 1
fi

# Ejecutar el script de población
echo "Ejecutando script de población de datos..."
node scripts/populate-flyio-db.js

echo "Proceso completado."
