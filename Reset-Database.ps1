# Script de PowerShell para configurar la base de datos PostgreSQL para PsicoEspacios
# Este script recrea completamente la base de datos usando Docker

# Función para mostrar mensajes con colores
function Write-ColorOutput($ForegroundColor) {
    # Guardar la configuración actual del color del texto y restaurarla al final
    $prevForegroundColor = $host.UI.RawUI.ForegroundColor
    
    # Cambiar el color del texto
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    
    # Si se proporciona un mensaje, mostrarlo
    if ($args) {
        Write-Output $args
    }
    
    # Restaurar el color del texto
    $host.UI.RawUI.ForegroundColor = $prevForegroundColor
}

# Mostrar encabezado
Write-ColorOutput Green "===== Configuración de Base de Datos PsicoEspacios ====="
Write-Output ""
Write-ColorOutput Yellow "Este script eliminará y recreará la base de datos desde cero."
Write-Output "Todos los datos existentes serán eliminados."
Write-Output ""

# Confirmar antes de continuar
$confirmation = Read-Host "¿Desea continuar? (S/N)"
if ($confirmation -ne 'S' -and $confirmation -ne 's') {
    Write-Output "Operación cancelada."
    exit
}

Write-Output ""
Write-ColorOutput Cyan "Iniciando proceso de configuración de la base de datos..."
Write-Output ""

# Paso 1: Verificar que Docker esté en ejecución
Write-Output "Verificando que Docker esté en ejecución..."
try {
    $dockerStatus = docker ps
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "Error: Docker no está en ejecución. Por favor, inicie Docker Desktop y vuelva a intentarlo."
        exit 1
    }
    Write-ColorOutput Green "Docker está en ejecución."
} catch {
    Write-ColorOutput Red "Error: No se pudo ejecutar Docker. Asegúrese de que Docker Desktop esté instalado y en ejecución."
    exit 1
}

# Paso 2: Detener y eliminar el contenedor existente (si existe)
Write-Output ""
Write-Output "Deteniendo y eliminando el contenedor existente (si existe)..."
docker stop psicoespacios_db 2>$null
docker rm psicoespacios_db 2>$null

# Paso 3: Eliminar el volumen (si existe)
Write-Output ""
Write-Output "Eliminando el volumen de datos existente..."
docker volume rm psicoespacios_data 2>$null

# Paso 4: Iniciar el contenedor con docker-compose
Write-Output ""
Write-Output "Iniciando nuevo contenedor con docker-compose..."
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "Error al iniciar el contenedor con docker-compose."
    exit 1
}

# Paso 5: Esperar a que PostgreSQL esté listo
Write-Output ""
Write-Output "Esperando a que PostgreSQL esté listo (30 segundos)..."
Start-Sleep -Seconds 30

# Paso 6: Crear la extensión uuid-ossp
Write-Output ""
Write-Output "Creando extensión uuid-ossp en la base de datos..."

# Usar una variable para almacenar el comando completo
$psqlCommand = "psql -U psicoespacios_user -d psicoespacios -c 'CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";'"
docker exec -it psicoespacios_db bash -c "$psqlCommand"

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Yellow "Advertencia: Es posible que la extensión no se haya creado correctamente."
    Write-Output "Intentando un enfoque alternativo..."
    
    # Intentar un enfoque diferente
    $checkCommand = "until pg_isready -U psicoespacios_user -h localhost; do echo 'Esperando a PostgreSQL...'; sleep 2; done; $psqlCommand"
    docker exec -it psicoespacios_db bash -c "$checkCommand"
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "Error al crear la extensión uuid-ossp."
        exit 1
    }
}

# Paso 7: Ejecutar las migraciones
Write-Output ""
Write-Output "Ejecutando migraciones..."
npx ts-node src/database/migration-runner.ts
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "Error al ejecutar las migraciones."
    exit 1
}

# Finalizar con mensaje de éxito
Write-Output ""
Write-ColorOutput Green "===== Base de datos configurada correctamente ====="
Write-ColorOutput Green "La base de datos ha sido recreada y todas las migraciones han sido aplicadas."
Write-Output ""
Write-Output "Ya puede ejecutar la aplicación con: npm run start:dev"
Write-Output ""

# Pausa para que el usuario pueda ver el resultado
Read-Host -Prompt "Presione Enter para continuar"
