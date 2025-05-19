#!/bin/bash

# Script para facilitar la ejecución de migraciones TypeORM
# Uso: ./migrate.sh [comando]
# Comandos disponibles: run, show, create, generate, revert

# Variables de entorno
export DATABASE_URL='postgresql://neondb_owner:npg_ORBSApcN7Vd5@ep-plain-sound-a48dlyhv-pooler.us-east-1.aws.neon.tech/psicoespacios?sslmode=require'

# Verificar que se proporciona un comando
if [ $# -lt 1 ]; then
  echo "Error: Se requiere un comando"
  echo "Uso: ./migrate.sh [comando] [opciones]"
  echo "Comandos disponibles: run, show, create, generate, revert"
  exit 1
fi

COMMAND=$1
shift

# Compilar el proyecto para asegurar que las migraciones están actualizadas
echo "Compilando el proyecto..."
npm run build

case $COMMAND in
  run)
    echo "Ejecutando migraciones..."
    npm run typeorm -- migration:run -d ./dist/database/config/typeorm.config.js
    ;;
  show)
    echo "Mostrando estado de migraciones..."
    npm run typeorm -- migration:show -d ./dist/database/config/typeorm.config.js
    ;;
  create)
    if [ $# -lt 1 ]; then
      echo "Error: Se requiere un nombre para la migración"
      echo "Uso: ./migrate.sh create [NombreDeMigracion]"
      exit 1
    fi
    MIGRATION_NAME=$1
    echo "Creando migración $MIGRATION_NAME..."
    npm run typeorm -- migration:create src/database/migrations/$MIGRATION_NAME
    ;;
  generate)
    if [ $# -lt 1 ]; then
      echo "Error: Se requiere un nombre para la migración"
      echo "Uso: ./migrate.sh generate [NombreDeMigracion]"
      exit 1
    fi
    MIGRATION_NAME=$1
    echo "Generando migración $MIGRATION_NAME a partir de cambios en entidades..."
    npm run typeorm -- migration:generate src/database/migrations/$MIGRATION_NAME -d ./dist/database/config/typeorm.config.js
    ;;
  revert)
    echo "Revirtiendo última migración..."
    npm run typeorm -- migration:revert -d ./dist/database/config/typeorm.config.js
    ;;
  *)
    echo "Comando desconocido: $COMMAND"
    echo "Comandos disponibles: run, show, create, generate, revert"
    exit 1
    ;;
esac
