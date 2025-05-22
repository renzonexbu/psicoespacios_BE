#!/bin/bash

# Script para ejecutar migraciones de base de datos
# Autor: Copilot
# Fecha: 22 de mayo de 2025

# Cargar variables de entorno
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
  echo "Variables de entorno cargadas desde .env"
else
  echo "Archivo .env no encontrado, utilizando valores por defecto"
fi

echo "Ejecutando migraciones de base de datos..."

# Ejecutar el script de migraciones con Node.js
npx ts-node src/database/migration-runner.ts

# Verificar el resultado
if [ $? -eq 0 ]; then
  echo "Migraciones completadas con éxito"
  exit 0
else
  echo "Error al ejecutar migraciones"
  exit 1
fi
