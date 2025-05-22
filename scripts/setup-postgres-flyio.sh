#!/bin/bash
# Script para configurar y obtener la cadena de conexión de la base de datos PostgreSQL en fly.io

echo "Configurando conexión a la base de datos PostgreSQL en fly.io..."

# Verificar que estamos conectados a fly.io
if ! fly status > /dev/null 2>&1; then
  echo "Error: No estás conectado a fly.io. Ejecuta 'flyctl auth login' primero."
  exit 1
fi

# Obtener el nombre de la aplicación desde fly.toml
APP_NAME=$(grep "^app =" fly.toml | cut -d "=" -f2 | tr -d " \"")

if [ -z "$APP_NAME" ]; then
  echo "Error: No se pudo obtener el nombre de la aplicación desde fly.toml."
  exit 1
fi

echo "Aplicación detectada: $APP_NAME"

# Verificar si ya existe una base de datos PostgreSQL
PG_EXISTS=$(fly postgres list | grep -c "psicoespacios")

if [ "$PG_EXISTS" -eq 0 ]; then
  echo "No se encontró una base de datos PostgreSQL. Creando una nueva..."
  fly postgres create --name psicoespacios-db --region scl
  
  if [ $? -ne 0 ]; then
    echo "Error al crear la base de datos PostgreSQL. Verifica tu conexión a fly.io."
    exit 1
  fi
  
  echo "Base de datos PostgreSQL creada con éxito."
else
  echo "Base de datos PostgreSQL existente encontrada."
fi

# Verificar si la base de datos está conectada a la aplicación
DB_ATTACHED=$(fly secrets list --app "$APP_NAME" | grep -c "DATABASE_URL")

if [ "$DB_ATTACHED" -eq 0 ]; then
  echo "Conectando la base de datos a la aplicación..."
  fly postgres attach --postgres-app psicoespacios-db --app "$APP_NAME"
  
  if [ $? -ne 0 ]; then
    echo "Error al conectar la base de datos a la aplicación. Verifica tus permisos."
    exit 1
  fi
  
  echo "Base de datos conectada con éxito a la aplicación."
else
  echo "La base de datos ya está conectada a la aplicación."
fi

# Obtener la cadena de conexión
echo "Obteniendo información de conexión..."
fly postgres connect -a psicoespacios-db --database postgres <<EOF
\conninfo
EOF

# Imprimir instrucciones adicionales
echo ""
echo "La cadena de conexión DATABASE_URL ha sido configurada como un secreto en tu aplicación."
echo "Puedes verificar que existe con: fly secrets list -a $APP_NAME"
echo ""
echo "Para ejecutar el script de población, usa:"
echo "npm run db:populate:flyio"
echo ""
echo "Para verificar la conexión y luego poblar, usa:"
echo "npm run db:check-and-populate"

exit 0
