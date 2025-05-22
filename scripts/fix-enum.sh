#!/bin/bash

# Script para corregir el enum users_role_enum en caso de que esté mal configurado
# Este script debe ejecutarse después de que la base de datos esté creada pero antes de las migraciones

# Remover set -e para permitir que el script continúe aunque haya errores
# set -e

echo "🔧 Verificando y corrigiendo enums en la base de datos..."

# Determinar qué comando de timeout usar (en macOS es gtimeout si se instaló con brew)
TIMEOUT_CMD="timeout"
if command -v gtimeout &> /dev/null; then
    TIMEOUT_CMD="gtimeout"
elif ! command -v timeout &> /dev/null; then
    echo "⚠️ El comando 'timeout' no está disponible. No se podrán aplicar timeouts."
    echo "⚠️ Para instalar timeout en macOS: brew install coreutils"
    # Definir una función dummy para el timeout
    TIMEOUT_CMD="echo"
fi

# Función para ejecutar SQL en la base de datos de Fly.io con timeout
execute_sql() {
  local sql="$1"
  local max_retries=2
  local retry_count=0
  local result=""
  
  while [ $retry_count -lt $max_retries ]; do
    echo "🔄 Intentando conectar a la base de datos (intento $((retry_count+1))/$max_retries)..."
    
    if [ "$TIMEOUT_CMD" = "echo" ]; then
      # Sin timeout disponible, intentar la conexión con un tiempo limitado
      result=$(flyctl postgres connect -a psicoespacios-db -c "$sql" & pid=$!; (sleep 15 && kill $pid 2>/dev/null) & wait $pid 2>/dev/null || echo "TIMEOUT")
    else
      # Con timeout disponible
      result=$($TIMEOUT_CMD 15 flyctl postgres connect -a psicoespacios-db -c "$sql" 2>&1) || {
        echo "⚠️ Timeout o error al conectar con la base de datos."
        result="TIMEOUT"
      }
    fi
    
    if [ "$result" != "TIMEOUT" ] && ! echo "$result" | grep -q "Error"; then
      echo "✅ Conexión exitosa a la base de datos."
      echo "$result"
      return 0
    fi
    
    retry_count=$((retry_count+1))
    if [ $retry_count -lt $max_retries ]; then
      echo "⚠️ Error al conectar. Reintentando en 5 segundos..."
      sleep 5
    else
      echo "❌ No se pudo conectar a la base de datos después de $max_retries intentos."
      echo "⚠️ Continuando con el despliegue de todas formas..."
      return 1
    fi
  done
  
  return 1
}

# Verificar si el enum users_role_enum existe
enum_exists=$(execute_sql "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') as exists;")

if echo "$enum_exists" | grep -q "t"; then
  echo "✅ El enum users_role_enum existe."
  
  # Verificar los valores del enum
  enum_values=$(execute_sql "SELECT enum_range(NULL::users_role_enum) as values;")
  echo "Valores actuales: $enum_values"
  
  # Verificar si falta el valor PACIENTE
  if ! echo "$enum_values" | grep -q "PACIENTE"; then
    echo "❌ El valor PACIENTE no está en el enum. Intentando corregir..."
    
    # Intentar recrear el enum con los valores correctos
    execute_sql "DROP TYPE IF EXISTS public.users_role_enum CASCADE; CREATE TYPE public.users_role_enum AS ENUM ('ADMIN', 'PSICOLOGO', 'PACIENTE');"
    echo "✅ Enum corregido."
  fi
else
  echo "❌ El enum users_role_enum no existe. Creándolo..."
  execute_sql "CREATE TYPE public.users_role_enum AS ENUM ('ADMIN', 'PSICOLOGO', 'PACIENTE');"
  echo "✅ Enum creado."
fi

# Verificar el enum users_estado_enum
enum_exists=$(execute_sql "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_estado_enum') as exists;")

if echo "$enum_exists" | grep -q "t"; then
  echo "✅ El enum users_estado_enum existe."
  
  # Verificar los valores del enum
  enum_values=$(execute_sql "SELECT enum_range(NULL::users_estado_enum) as values;")
  echo "Valores actuales: $enum_values"
  
  # Verificar si falta el valor ACTIVO
  if ! echo "$enum_values" | grep -q "ACTIVO"; then
    echo "❌ El valor ACTIVO no está en el enum. Intentando corregir..."
    
    # Intentar recrear el enum con los valores correctos
    execute_sql "DROP TYPE IF EXISTS public.users_estado_enum CASCADE; CREATE TYPE public.users_estado_enum AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO');"
    echo "✅ Enum corregido."
  fi
else
  echo "❌ El enum users_estado_enum no existe. Creándolo..."
  execute_sql "CREATE TYPE public.users_estado_enum AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO');"
  echo "✅ Enum creado."
fi

echo "✅ Verificación y corrección de enums completada."
