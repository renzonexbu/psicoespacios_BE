#!/bin/bash

echo "🧹 Cleaning project..."
# Eliminar archivos y carpetas innecesarios
rm -rf dist
rm -rf coverage
rm -rf .vercel
rm -rf node_modules/.cache

echo "📦 Installing production dependencies only..."
# Instalar solo dependencias de producción
npm ci --only=production

echo "🏗️ Building project..."
# Construir el proyecto
npm run build

echo "🗑️ Removing unnecessary files..."
# Eliminar archivos de desarrollo después del build
find . -name "*.ts" ! -name "*.d.ts" -type f -delete
find . -name "*.map" -type f -delete
find . -name "*.spec.ts" -type f -delete
find . -name "*.test.ts" -type f -delete

echo "✨ Project ready for deployment!"
