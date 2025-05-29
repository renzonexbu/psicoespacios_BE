/**
 * Script simplificado para resetear y configurar la base de datos usando Docker directamente
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

/**
 * Ejecuta un comando de shell y devuelve la salida
 */
function execCommand(command, args = [], cwd = process.cwd()) {
  console.log(`Ejecutando: ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
  });

  if (result.error) {
    console.error(`Error ejecutando el comando: ${result.error.message}`);
    return false;
  }

  return result.status === 0;
}

/**
 * Verifica si el contenedor Docker está en ejecución
 */
function checkDockerContainer() {
  try {
    const result = spawnSync(
      'docker',
      ['ps', '--filter', 'name=psicoespacios_db', '--format', '{{.Names}}'],
      {
        encoding: 'utf-8',
        shell: true,
      },
    );

    if (!result.stdout || !result.stdout.includes('psicoespacios_db')) {
      console.log(
        'El contenedor de Docker no está en ejecución. Iniciándolo...',
      );

      // Verificar si el contenedor existe
      const containerExists = spawnSync(
        'docker',
        [
          'ps',
          '-a',
          '--filter',
          'name=psicoespacios_db',
          '--format',
          '{{.Names}}',
        ],
        {
          encoding: 'utf-8',
          shell: true,
        },
      );

      if (
        containerExists.stdout &&
        containerExists.stdout.includes('psicoespacios_db')
      ) {
        // El contenedor existe, iniciarlo
        execCommand('docker', ['start', 'psicoespacios_db']);
      } else {
        // El contenedor no existe, iniciar con docker-compose
        execCommand('docker-compose', ['up', '-d'], process.cwd());
      }

      // Esperar a que el contenedor esté listo
      console.log('Esperando a que el contenedor esté listo...');
      spawnSync('timeout', ['5'], { shell: true });
    } else {
      console.log('El contenedor Docker está en ejecución.');
    }

    return true;
  } catch (error) {
    console.error('Error verificando el contenedor Docker:', error);
    return false;
  }
}

/**
 * Recrea la base de datos usando Docker directamente
 */
function recreateDatabaseWithDocker() {
  try {
    console.log('Recreando la base de datos utilizando Docker...');

    // Detener el contenedor actual para reiniciarlo limpio
    console.log('Deteniendo el contenedor actual...');
    execCommand('docker', ['stop', 'psicoespacios_db']);

    // Eliminar el contenedor
    console.log('Eliminando el contenedor actual...');
    execCommand('docker', ['rm', 'psicoespacios_db']);

    // Eliminar el volumen para asegurar que la base de datos se crea desde cero
    console.log('Eliminando el volumen de datos...');
    execCommand('docker', ['volume', 'rm', 'psicoespacios_data']);

    // Iniciar un nuevo contenedor con docker-compose
    console.log('Iniciando un nuevo contenedor limpio...');
    execCommand('docker-compose', ['up', '-d']);

    // Esperar a que PostgreSQL esté listo
    console.log('Esperando a que PostgreSQL inicie (15 segundos)...');
    spawnSync('timeout', ['15'], { shell: true });

    return true;
  } catch (error) {
    console.error('Error recreando la base de datos con Docker:', error);
    return false;
  }
}

/**
 * Inicializa la base de datos con la extensión UUID
 */
function initializeDatabase() {
  try {
    console.log('Inicializando la base de datos...');

    // Ejecutar la extensión uuid-ossp directamente en el contenedor
    const extResult = execCommand('docker', [
      'exec',
      'psicoespacios_db',
      'psql',
      '-U',
      'psicoespacios_user',
      '-d',
      'psicoespacios',
      '-c',
      'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
    ]);

    if (!extResult) {
      console.error('Error al crear la extensión uuid-ossp.');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error inicializando la base de datos:', error);
    return false;
  }
}

/**
 * Ejecuta las migraciones usando el runner de migraciones
 */
function runMigrations() {
  try {
    console.log('Ejecutando migraciones...');

    // En Windows, usar npx ts-node
    return execCommand('npx', ['ts-node', 'src/database/migration-runner.ts']);
  } catch (error) {
    console.error('Error al ejecutar las migraciones:', error);
    return false;
  }
}

/**
 * Función principal que ejecuta todo el proceso
 */
async function setupDatabase() {
  try {
    console.log('=== CONFIGURACIÓN DE BASE DE DATOS PSICOESPACIOS ===');

    // Verificar contenedor Docker
    if (!checkDockerContainer()) {
      console.error('Error verificando el contenedor Docker. Abortando.');
      process.exit(1);
    }

    // Recrear la base de datos usando Docker
    if (!recreateDatabaseWithDocker()) {
      console.error('Error recreando la base de datos. Abortando.');
      process.exit(1);
    }

    // Inicializar la base de datos
    if (!initializeDatabase()) {
      console.error('Error inicializando la base de datos. Abortando.');
      process.exit(1);
    }

    // Ejecutar migraciones
    if (!runMigrations()) {
      console.error('Error ejecutando las migraciones. Abortando.');
      process.exit(1);
    }

    console.log('=== BASE DE DATOS CONFIGURADA CORRECTAMENTE ===');
    console.log(
      'La base de datos ha sido recreada y todas las migraciones han sido aplicadas.',
    );
    process.exit(0);
  } catch (error) {
    console.error('Error en el proceso:', error);
    process.exit(1);
  }
}

// Ejecutar el proceso
setupDatabase();
