@echo off
echo ===== Configuracion completa de la base de datos de PsicoEspacios =====
echo.
echo Este script eliminara y recreara la base de datos para tu proyecto.
echo Asegurate de que Docker este corriendo antes de ejecutar este script.
echo.
echo ADVERTENCIA: Se eliminaran todos los datos existentes en la base de datos.
echo.
set /p CONTINUE="¿Deseas continuar? (S/N): "

if /i "%CONTINUE%" NEQ "S" (
    echo Operacion cancelada.
    exit /b 0
)

echo.
echo Iniciando proceso de configuracion completa de la base de datos...
echo.

REM Verificar que Docker esté en ejecución
docker ps > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker no esta en ejecucion. Por favor, inicia Docker Desktop y vuelve a intentarlo.
    goto :error
)

REM Detener y eliminar el contenedor existente (si existe)
echo Deteniendo y eliminando el contenedor existente (si existe)...
docker stop psicoespacios_db 2>nul
docker rm psicoespacios_db 2>nul

REM Eliminar el volumen (si existe)
echo Eliminando el volumen de datos existente...
docker volume rm psicoespacios_data 2>nul

REM Iniciar el contenedor con docker-compose
echo Iniciando nuevo contenedor con docker-compose...
docker-compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No se pudo iniciar el contenedor con docker-compose.
    goto :error
)

REM Esperar a que PostgreSQL esté listo
echo Esperando a que PostgreSQL este listo (30 segundos)...
timeout /t 30 /nobreak > nul

REM Crear la extensión uuid-ossp
echo Creando extension uuid-ossp en la base de datos...
docker exec psicoespacios_db bash -c "psql -U psicoespacios_user -d psicoespacios -c 'CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";'"
if %ERRORLEVEL% NEQ 0 (
    echo ADVERTENCIA: Es posible que la extension no se haya creado correctamente.
    echo Intentando un enfoque alternativo...
    
    docker exec psicoespacios_db bash -c "until pg_isready -U psicoespacios_user -h localhost; do echo 'Esperando a PostgreSQL...'; sleep 2; done; psql -U psicoespacios_user -d psicoespacios -c 'CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";'"
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: No se pudo crear la extension uuid-ossp.
        goto :error
    )
)

REM Ejecutar las migraciones
echo Ejecutando migraciones...
npx ts-node src\database\migration-runner.ts
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No se pudieron ejecutar las migraciones.
    goto :error
)

echo.
echo ===== Base de datos configurada correctamente =====
echo La base de datos ha sido recreada y todas las migraciones han sido aplicadas.
echo.
echo Ya puede ejecutar la aplicacion con: npm run start:dev
echo.
goto :end

:error
echo.
echo ERROR: Ha ocurrido un error en el proceso. Revisa los mensajes anteriores.
exit /b 1

:end
pause

echo.
if %ERRORLEVEL% EQU 0 (
    echo ===== PROCESO COMPLETADO EXITOSAMENTE =====
    echo.
    echo La base de datos ha sido configurada correctamente y esta lista para ser usada.
    echo Ahora puedes iniciar tu aplicacion con 'npm run start:dev'
) else (
    echo ===== ERROR EN EL PROCESO =====
    echo.
    echo Ocurrio un error durante la configuracion de la base de datos.
    echo Revisa los mensajes de error anteriores para mas informacion.
)

pause
