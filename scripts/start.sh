#!/bin/sh
# Script de inicio para ejecutar en Fly.io (Alpine Linux)

# Mostrar directorio actual e información del sistema
echo "Directorio actual: $(pwd)"
ls -la

# Verificar variables de entorno críticas
echo "Variables de entorno importantes:"
env | grep -E 'NODE_|PORT|HOST'

# Comprobar existencia de archivos críticos
if [ -f "dist/src/main.js" ]; then
    echo "✅ dist/src/main.js encontrado"
else 
    echo "❌ ERROR: dist/src/main.js no encontrado"
    ls -la dist || echo "Directorio dist no existe"
    exit 1
fi

# Comprobar archivo de configuración de base de datos
if [ -f "dist/src/database/config/typeorm.config.js" ]; then
    echo "✅ typeorm.config.js encontrado"
else
    echo "⚠️ ADVERTENCIA: typeorm.config.js no encontrado"
    # Continuamos de todas formas
fi

# Espera para servicios externos (p.ej., base de datos)
echo "Esperando a que los servicios externos estén disponibles..."
sleep 5

# Ejecutar las migraciones si existe el módulo necesario
if [ -f "dist/src/database/config/typeorm.config.js" ]; then
    echo "Ejecutando migraciones..."
    NODE_ENV=production node dist/src/database/config/typeorm.config.js migration:run || echo "⚠️ Error al ejecutar migraciones, pero continuando..."
fi

# Iniciar la aplicación
echo "Iniciando aplicación NestJS..."
exec NODE_ENV=production node dist/src/main.js
