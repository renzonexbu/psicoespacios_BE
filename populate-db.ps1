# populate-db.ps1 - Script de PowerShell para ejecutar el script de población de datos

# Establecer codificación a UTF-8 para caracteres especiales
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Iniciando proceso de población de la base de datos..." -ForegroundColor Cyan

# Comprobar conexión a la base de datos
Write-Host "Comprobando conexión a la base de datos..." -ForegroundColor Yellow
node scripts/test-db.js
$testExitCode = $LASTEXITCODE

if ($testExitCode -ne 0) {
    Write-Host "Error al conectar con la base de datos. Verifique su configuración." -ForegroundColor Red
    exit 1
}
else {
    Write-Host "Conexión a la base de datos establecida correctamente." -ForegroundColor Green
}

# Reparar el esquema primero
Write-Host "Reparando el esquema de la base de datos..." -ForegroundColor Yellow
node scripts/fix-db-schema.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al reparar el esquema de la base de datos." -ForegroundColor Red
    exit 1
}
else {
    Write-Host "Esquema de la base de datos reparado correctamente." -ForegroundColor Green
}

# Añadir columnas a la tabla sedes si es necesario
Write-Host "Verificando y añadiendo columnas a la tabla sedes..." -ForegroundColor Yellow
node scripts/add-sedes-columns.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al añadir columnas a la tabla sedes." -ForegroundColor Red
    exit 1
}
else {
    Write-Host "Columnas de la tabla sedes verificadas correctamente." -ForegroundColor Green
}

# Ejecutar el script de población de datos
Write-Host "Insertando datos de prueba en todas las tablas..." -ForegroundColor Yellow
node scripts/populate-test-data.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al insertar los datos de prueba." -ForegroundColor Red
    exit 1
}
else {
    Write-Host "Datos de prueba insertados correctamente." -ForegroundColor Green
}

# Verificar la base de datos después de la inserción
Write-Host "Verificando el estado final de la base de datos..." -ForegroundColor Yellow
node scripts/verify-db-schema.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "Advertencia: La verificación final del esquema encontró problemas." -ForegroundColor Yellow
}
else {
    Write-Host "Verificación final del esquema completada sin problemas." -ForegroundColor Green
}

# Mostrar resumen final
Write-Host "`n===== RESUMEN DE LA OPERACIÓN =====" -ForegroundColor Cyan
Write-Host "✅ Esquema de la base de datos reparado" -ForegroundColor Green
Write-Host "✅ Columnas de la tabla sedes verificadas" -ForegroundColor Green
Write-Host "✅ Datos de prueba insertados en todas las tablas" -ForegroundColor Green
Write-Host "✅ Verificación final del esquema realizada" -ForegroundColor Green
Write-Host "Proceso completado exitosamente." -ForegroundColor Cyan
