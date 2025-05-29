/**
 * Script para inicializar la base de datos completa desde cero
 * Este script elimina la base de datos existente (si existe), la crea nuevamente y ejecuta todas las migraciones
 */

const { Client } = require('pg');
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Configuración de conexión para administrador de PostgreSQL
const pgAdminConfig = {
  user: 'psicoespacios_user', // En Docker Compose este es el usuario principal
  host: 'localhost',
  password: 'psicoespacios_password', // Contraseña definida en Docker Compose
  port: 5432,
};

// Configuración de conexión para la base de datos del proyecto
const dbConfig = {
  user: process.env.DATABASE_USERNAME || 'psicoespacios_user',
  host: process.env.DATABASE_HOST || 'localhost',
  database: process.env.DATABASE_NAME || 'psicoespacios',
  password: process.env.DATABASE_PASSWORD || 'psicoespacios_password',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
};

/**
 * Ejecuta el comando en un proceso separado y devuelve la salida
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
 * Verifica si el contenedor de Docker está en ejecución
 */
async function checkDockerContainer() {
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

      // Verificar si el contenedor existe pero está detenido
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
        // El contenedor existe, lo iniciamos
        execCommand('docker', ['start', 'psicoespacios_db']);
      } else {
        // El contenedor no existe, ejecutamos docker-compose
        execCommand('docker-compose', ['up', '-d'], process.cwd());
      }

      // Esperamos unos segundos para que el contenedor esté listo
      console.log('Esperando a que el contenedor esté listo...');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } else {
      console.log('El contenedor de Docker está en ejecución.');
    }

    return true;
  } catch (error) {
    console.error('Error al verificar el estado del contenedor Docker:', error);
    return false;
  }
}

/**
 * Elimina y crea la base de datos
 */
async function recreateDatabase() {
  const adminClient = new Client(pgAdminConfig);

  try {
    await adminClient.connect();

    // Verificar si hay conexiones activas a la base de datos
    const activeConnections = await adminClient.query(
      `
      SELECT pid, usename, application_name, client_addr
      FROM pg_stat_activity 
      WHERE datname = $1 AND pid <> pg_backend_pid()
    `,
      [dbConfig.database],
    );

    // Cerrar todas las conexiones activas
    if (activeConnections.rows.length > 0) {
      console.log(
        `Cerrando ${activeConnections.rows.length} conexiones activas a la base de datos...`,
      );

      for (const conn of activeConnections.rows) {
        await adminClient.query(`SELECT pg_terminate_backend(${conn.pid})`);
      }
    }

    // Verificar si el usuario tiene permisos para recrear la base de datos
    try {
      // Intentar limpiar la base de datos en lugar de recrearla
      console.log(`Limpiando la base de datos ${dbConfig.database}...`);

      // Eliminar todas las tablas públicas
      await adminClient.query(`
        DO $$ DECLARE
          r RECORD;
        BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
        END $$;
      `);

      // Limpiar otras estructuras como secuencias, funciones, etc.
      await adminClient.query(`
        DO $$ DECLARE
          r RECORD;
        BEGIN
          -- Eliminar vistas
          FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
            EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
          END LOOP;
          
          -- Eliminar tipos personalizados
          FOR r IN (SELECT typname FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typtype = 'c') LOOP
            EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
          END LOOP;
        END $$;
      `);

      // Eliminar extensiones
      await adminClient.query(`DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;`);
    } catch (cleanError) {
      console.error('Error al limpiar la base de datos:', cleanError);
      console.log('Continuando con la inicialización...');
    }

    console.log('Base de datos recreada correctamente.');
    return true;
  } catch (error) {
    console.error('Error al recrear la base de datos:', error);
    return false;
  } finally {
    await adminClient.end();
  }
}

/**
 * Inicializa la base de datos con las extensiones necesarias
 */
async function initializeDatabase() {
  const client = new Client(dbConfig);

  try {
    await client.connect();

    // Crear la extensión uuid-ossp si no existe
    console.log('Creando extensiones necesarias...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    console.log('Base de datos inicializada correctamente.');
    return true;
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    return false;
  } finally {
    await client.end();
  }
}

/**
 * Ejecuta las migraciones usando el runner de migraciones
 */
async function runMigrations() {
  try {
    console.log('Ejecutando migraciones...');

    // Verificar si estamos en Windows para usar el comando correcto
    const isWindows = process.platform === 'win32';

    if (isWindows) {
      // En Windows, ejecutar directamente con ts-node
      return execCommand('npx', [
        'ts-node',
        'src/database/migration-runner.ts',
      ]);
    } else {
      // En Linux/Mac, usar el script bash
      return execCommand('./scripts/run-migrations.sh');
    }
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
    // Verificar si el contenedor Docker está en ejecución
    const dockerReady = await checkDockerContainer();
    if (!dockerReady) {
      console.error('No se pudo iniciar el contenedor Docker. Abortando.');
      process.exit(1);
    }

    // Recrear la base de datos
    const dbRecreated = await recreateDatabase();
    if (!dbRecreated) {
      console.error('No se pudo recrear la base de datos. Abortando.');
      process.exit(1);
    }

    // Inicializar la base de datos
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      console.error('No se pudo inicializar la base de datos. Abortando.');
      process.exit(1);
    }

    // Ejecutar las migraciones
    const migrationsRun = await runMigrations();
    if (!migrationsRun) {
      console.error('No se pudieron ejecutar las migraciones. Abortando.');
      process.exit(1);
    }

    console.log(
      '¡Base de datos configurada correctamente y lista para ser usada!',
    );
    process.exit(0);
  } catch (error) {
    console.error(
      'Error durante el proceso de configuración de la base de datos:',
      error,
    );
    process.exit(1);
  }
}

// Ejecutar el script
setupDatabase();
