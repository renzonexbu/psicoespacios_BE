#!/bin/sh
# Script de inicio para ejecutar en Fly.io

# Asegurarse de que estamos en el directorio /app
cd /app
if [ $? -ne 0 ]; then
    echo "No se pudo cambiar al directorio /app"
    exit 1
fi

# Imprimir información sobre el entorno para depuración
echo "Directorio de trabajo actual: $(pwd)"
echo "Estructura del directorio actual:"
ls -l

# Verificar variables de entorno críticas
echo "Variables de entorno:"
env | grep -E 'NODE_|PORT|HOST'

# Explorar la estructura de 'dist' para depuración
echo "Estructura del directorio dist:"
find dist -type d 2>/dev/null | sort
if [ $? -ne 0 ]; then
    echo "No se encontró directorio dist"
fi

# Verificar que los archivos necesarios existen
echo "Verificando archivos principales:"
if [ -f dist/src/main.js ]; then
    ls -l dist/src/main.js
else
    echo "main.js no encontrado"
fi

if [ -f dist/src/database/config/typeorm.config.js ]; then
    ls -l dist/src/database/config/typeorm.config.js
else
    echo "typeorm.config.js no encontrado"
fi

# Esperando a que la base de datos esté disponible
echo "Esperando a que la base de datos esté disponible..."
sleep 10

# Ejecutar las migraciones
echo "Ejecutando migraciones..."
NODE_ENV=production node dist/src/database/config/typeorm.config.js migration:run
if [ $? -ne 0 ]; then
    echo "Error al ejecutar migraciones, pero continuando el despliegue..."
fi

# Iniciar la aplicación
echo "Iniciando aplicación..."
NODE_ENV=production node dist/src/main.js
