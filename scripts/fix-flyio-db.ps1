# fix-flyio-db.ps1 - Script para corregir el esquema de la base de datos en Fly.io

Write-Host "===== Iniciando script de corrección de base de datos en Fly.io =====" -ForegroundColor Cyan

# Configurar variables
$APP_NAME = "psicoespacios-api"
$SCRIPT_PATH = "scripts/fix-db-schema.js"

Write-Host "Aplicación: $APP_NAME"
Write-Host "Script a ejecutar: $SCRIPT_PATH"

# Verificar si flyctl está instalado
if (!(Get-Command flyctl -ErrorAction SilentlyContinue)) {
    Write-Host "Error: flyctl no está instalado. Por favor, instálalo primero." -ForegroundColor Red
    exit 1
}

# Verificar la autenticación de Fly.io
Write-Host "Verificando autenticación en Fly.io..." -ForegroundColor Yellow
try {
    flyctl auth whoami
}
catch {
    Write-Host "Error: No estás autenticado en Fly.io. Por favor, ejecuta 'flyctl auth login' primero." -ForegroundColor Red
    exit 1
}

# Verificar que la aplicación existe
Write-Host "Verificando la aplicación en Fly.io..." -ForegroundColor Yellow
try {
    flyctl status -a $APP_NAME
}
catch {
    Write-Host "Error: La aplicación $APP_NAME no existe o no tienes acceso a ella." -ForegroundColor Red
    exit 1
}

# Ejecutar el script de corrección de esquema
Write-Host "Ejecutando script de corrección de esquema en Fly.io..." -ForegroundColor Yellow
flyctl ssh console -a $APP_NAME -C "cd /app && node $SCRIPT_PATH"

# Verificar el resultado
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Corrección de esquema completada exitosamente." -ForegroundColor Green
}
else {
    Write-Host "❌ Error al ejecutar el script de corrección de esquema." -ForegroundColor Red
    exit 1
}

Write-Host "===== Script de corrección finalizado =====" -ForegroundColor Cyan
