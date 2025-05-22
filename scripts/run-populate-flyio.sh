#!/bin/bash
# Script para configurar y poblar la base de datos en fly.io

echo "Configurando base de datos en fly.io..."

# Verificar que estamos conectados a fly.io
if ! fly status > /dev/null 2>&1; then
  echo "Error: No estás conectado a fly.io. Ejecuta 'flyctl auth login' primero."
  exit 1
fi

# Obtenemos el nombre de la aplicación del archivo fly.toml
APP_NAME=$(grep "^app =" fly.toml | cut -d "=" -f2 | tr -d " \"")

if [ -z "$APP_NAME" ]; then
  echo "Error: No se pudo obtener el nombre de la aplicación desde fly.toml."
  exit 1
fi

echo "Configurando conexión para la aplicación: $APP_NAME"

# Verificar que la base de datos PostgreSQL existe
PG_APP=$(fly postgres list | grep psicoespacios | head -1 | awk '{print $1}')

if [ -z "$PG_APP" ]; then
  echo "Error: No se encontró ninguna base de datos PostgreSQL."
  echo "Ejecuta el script de configuración primero: ./scripts/setup-postgres-flyio.sh"
  exit 1
fi

echo "Base de datos PostgreSQL encontrada: $PG_APP"

# Crear un proxy temporal a la base de datos (en segundo plano)
echo "Creando proxy a la base de datos PostgreSQL..."
fly proxy 5432 --app "$PG_APP" &
PROXY_PID=$!

# Esperar a que el proxy esté listo
sleep 5

# Variable para indicar si la conexión fue exitosa
CONNECTION_SUCCESS=false
SUCCESSFUL_CRED=""

# Lista de posibles credenciales para probar
POSSIBLE_CREDENTIALS=(
  "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable"
  "postgres://postgres:psicoespacios_BE@localhost:5432/postgres?sslmode=disable"
  "postgres://postgres:${APP_NAME}@localhost:5432/postgres?sslmode=disable"
  "postgres://postgres:${PG_APP}@localhost:5432/postgres?sslmode=disable"
  "postgres://postgres@localhost:5432/postgres?sslmode=disable"
)

# Probar cada conjunto de credenciales
for CRED in "${POSSIBLE_CREDENTIALS[@]}"; do
  echo "Probando conexión con: $CRED"
  export DATABASE_URL="$CRED"

  # Script de Node.js para verificar la conexión
  node -e '
  const { Pool } = require("pg");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  async function checkConnection() {
    let client;
    try {
      client = await pool.connect();
      console.log("✅ Conexión exitosa");
      return 0;
    } catch (error) {
      console.error("❌ Error:", error.message);
      return 1;
    } finally {
      if (client) client.release();
      await pool.end();
    }
  }

  checkConnection()
    .then(exitCode => process.exit(exitCode))
    .catch(err => {
      console.error("Error inesperado:", err);
      process.exit(1);
    });
  ' > /dev/null 2>&1
  
  # Verificar si la conexión fue exitosa
  if [ $? -eq 0 ]; then
    CONNECTION_SUCCESS=true
    SUCCESSFUL_CRED="$CRED"
    break
  fi
done

# Si no se pudo establecer conexión con ninguna credencial
if [ "$CONNECTION_SUCCESS" = false ]; then
  echo -e "\n❌ No se pudo establecer conexión con ninguna de las credenciales probadas."
  echo "Verifica las credenciales y asegúrate de que la base de datos esté correctamente configurada."
  
  # Cerrar el proxy
  if [ -n "$PROXY_PID" ]; then
    echo "Cerrando conexión proxy..."
    kill $PROXY_PID >/dev/null 2>&1
  fi
  
  exit 1
fi

# Configurar variables de entorno para la conexión
export DATABASE_URL="$SUCCESSFUL_CRED"
export NODE_ENV="production"

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias..."
  npm install
fi

# Ejecutar el script de población
echo "Ejecutando script de población de datos..."
node scripts/populate-flyio-db.js
RESULT=$?

# Cerrar el proxy
if [ -n "$PROXY_PID" ]; then
  echo "Cerrando conexión proxy..."
  kill $PROXY_PID >/dev/null 2>&1
fi

if [ $RESULT -eq 0 ]; then
  echo "Proceso completado con éxito."
else
  echo "Hubo errores durante el proceso de población."
fi

exit $RESULT
