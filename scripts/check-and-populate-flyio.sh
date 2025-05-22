#!/bin/bash
# Script para verificar la conexión a la base de datos en fly.io antes de poblarla

echo "Verificando conexión a la base de datos en fly.io..."

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

echo "Verificando conexión para la aplicación: $APP_NAME"

# Verificar que la base de datos está conectada a la aplicación
if ! fly secrets list --app "$APP_NAME" | grep -q DATABASE_URL; then
  echo "Error: No se encontró la variable DATABASE_URL en los secretos de la aplicación."
  echo "Ejecuta el script de configuración primero: ./scripts/setup-postgres-flyio.sh"
  exit 1
fi

# Obtener la cadena de conexión a través de proxy
echo "Obteniendo conexión a la base de datos vía proxy..."
echo "Esto puede tardar unos segundos..."

# Usar fly proxy para obtener una conexión local a la base de datos PostgreSQL
PG_APP=$(fly postgres list | grep psicoespacios | head -1 | awk '{print $1}')

if [ -z "$PG_APP" ]; then
  echo "Error: No se encontró ninguna base de datos PostgreSQL."
  echo "Ejecuta el script de configuración primero: ./scripts/setup-postgres-flyio.sh"
  exit 1
fi

# Crear un proxy temporal a la base de datos (en segundo plano)
echo "Creando proxy a la base de datos PostgreSQL..."
fly proxy 5432 --app "$PG_APP" &
PROXY_PID=$!

# Esperar a que el proxy esté listo
sleep 5

# Variable para indicar si la conexión fue exitosa
CONNECTION_SUCCESS=false
SUCCESSFUL_CRED=""

# Intentar establecer conexión con diferentes credenciales
echo "Intentando conexión con diferentes credenciales..."

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
  echo "Probando con: $CRED"
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

# Cerrar el proxy temporal
if [ -n "$PROXY_PID" ]; then
  echo "Cerrando conexión proxy temporal..."
  kill $PROXY_PID >/dev/null 2>&1
  sleep 2
fi

# Si no se pudo establecer conexión con ninguna credencial
if [ "$CONNECTION_SUCCESS" = false ]; then
  echo -e "\n❌ No se pudo establecer conexión con ninguna de las credenciales probadas."
  echo "Verifica las credenciales y asegúrate de que la base de datos esté correctamente configurada."
  exit 1
fi

# Mostrar información detallada sobre la base de datos
echo -e "\n🔍 Obteniendo información detallada de la base de datos..."

# Crear un nuevo proxy para la verificación final
fly proxy 5432 --app "$PG_APP" &
PROXY_PID=$!
sleep 5

export DATABASE_URL="$SUCCESSFUL_CRED"

# Ejecutar script de verificación detallada
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
    const result = await client.query("SELECT NOW()");
    console.log("✅ Conexión exitosa a la base de datos");
    console.log(`🕒 Hora del servidor: ${result.rows[0].now}`);

    // Verificar tablas existentes
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`\n📋 Tablas encontradas (${tables.rows.length}):`);
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Verificar cantidad de registros en cada tabla
    console.log("\n📊 Cantidad de registros por tabla:");
    for (const row of tables.rows) {
      const tableName = row.table_name;
      const countResult = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
      const count = countResult.rows[0].count;
      console.log(`  - ${tableName}: ${count} registros`);
    }

    console.log("\n✅ La base de datos está lista para ser poblada.");
    return 0;
  } catch (error) {
    console.error("❌ Error al conectar a la base de datos:", error.message);
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
'

CONNECTION_STATUS=$?

# Cerrar el proxy después de la verificación
if [ -n "$PROXY_PID" ]; then
  echo "Cerrando conexión proxy..."
  kill $PROXY_PID >/dev/null 2>&1
fi

if [ $CONNECTION_STATUS -eq 0 ]; then
  echo -e "\n🚀 ¿Deseas continuar y poblar la base de datos? (s/n)"
  read -r respuesta
  if [[ "$respuesta" =~ ^[Ss]$ ]]; then
    echo "Ejecutando script de población..."
    # Crear un nuevo proxy para el script de población
    fly proxy 5432 --app "$PG_APP" &
    PROXY_PID=$!
    sleep 5
    
    # Ejecutar script con la conexión exitosa
    export DATABASE_URL="$SUCCESSFUL_CRED"
    node scripts/populate-flyio-db.js
    POPULATE_STATUS=$?
    
    # Cerrar el proxy después de la población
    if [ -n "$PROXY_PID" ]; then
      echo "Cerrando conexión proxy..."
      kill $PROXY_PID >/dev/null 2>&1
    fi
    
    if [ $POPULATE_STATUS -eq 0 ]; then
      echo -e "\n✅ Base de datos poblada exitosamente."
    else
      echo -e "\n❌ Hubo problemas al poblar la base de datos."
    fi
  else
    echo "Operación cancelada."
  fi
else
  echo -e "\n❌ Hay problemas con la conexión a la base de datos. Corrige los errores antes de intentar poblarla."
  exit 1
fi
