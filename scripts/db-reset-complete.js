/**
 * Script para RESET COMPLETO de la base de datos PostgreSQL
 * ⚠️  ADVERTENCIA: Esto eliminará TODOS los datos
 */

const { spawnSync } = require('child_process');
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
 * RESET COMPLETO de la base de datos
 */
async function resetDatabaseComplete() {
  try {
    console.log('🗑️  === RESET COMPLETO DE BASE DE DATOS PSICOESPACIOS ===');
    console.log('⚠️  ADVERTENCIA: Esto eliminará TODOS los datos existentes');
    console.log('');

    // 1. Detener y eliminar contenedor actual
    console.log('🛑 Deteniendo contenedor actual...');
    execCommand('docker', ['stop', 'psicoespacios_db']);
    execCommand('docker', ['rm', 'psicoespacios_db']);

    // 2. Eliminar volumen COMPLETAMENTE
    console.log('🗑️  Eliminando volumen de datos...');
    execCommand('docker', ['volume', 'rm', 'psicoespacios_data']);

    // 3. Eliminar red si existe
    console.log('🌐 Eliminando red Docker...');
    execCommand('docker', ['network', 'rm', 'psicoespacios_default']);

    // 4. Crear nuevo contenedor limpio
    console.log('🐳 Creando nuevo contenedor PostgreSQL...');
    execCommand('docker-compose', ['up', '-d']);

    // 5. Esperar a que PostgreSQL esté listo
    console.log('⏳ Esperando a que PostgreSQL inicie (20 segundos)...');
    spawnSync('timeout', ['20'], { shell: true });

    // 6. Verificar que PostgreSQL esté funcionando
    console.log('🔍 Verificando conexión a PostgreSQL...');
    const checkResult = spawnSync('docker', [
      'exec', 'psicoespacios_db', 
      'pg_isready', '-U', 'psicoespacios_user', '-h', 'localhost'
    ], { stdio: 'pipe' });

    if (checkResult.status !== 0) {
      console.error('❌ PostgreSQL no está listo. Esperando más tiempo...');
      spawnSync('timeout', ['10'], { shell: true });
    }

    // 7. Crear extensión UUID
    console.log('🔧 Creando extensión UUID-OSSP...');
    execCommand('docker', [
      'exec', 'psicoespacios_db',
      'psql', '-U', 'psicoespacios_user', '-d', 'psicoespacios',
      '-c', 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    ]);

    console.log('✅ Base de datos reseteada completamente');
    return true;

  } catch (error) {
    console.error('❌ Error en reset completo:', error);
    return false;
  }
}

/**
 * Ejecutar migraciones
 */
function runMigrations() {
  try {
    console.log('🔄 Ejecutando migraciones...');
    return execCommand('npx', ['ts-node', 'src/database/migration-runner.ts']);
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
    return false;
  }
}

/**
 * Ejecutar seeds
 */
function runSeeds() {
  try {
    console.log('🌱 Ejecutando seeds...');
    return execCommand('npx', ['ts-node', 'src/database/seeds/seed.ts']);
  } catch (error) {
    console.error('❌ Error ejecutando seeds:', error);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  try {
    // Reset completo
    if (!await resetDatabaseComplete()) {
      console.error('❌ Error en reset completo. Abortando.');
      process.exit(1);
    }

    // Ejecutar migraciones
    if (!runMigrations()) {
      console.error('❌ Error ejecutando migraciones. Abortando.');
      process.exit(1);
    }

    // Ejecutar seeds
    if (!runSeeds()) {
      console.error('❌ Error ejecutando seeds. Abortando.');
      process.exit(1);
    }

    console.log('');
    console.log('🎉 === RESET COMPLETO EXITOSO ===');
    console.log('✅ Base de datos eliminada completamente');
    console.log('✅ Nuevas migraciones aplicadas');
    console.log('✅ Seeds ejecutados');
    console.log('');
    console.log('📊 Datos actuales:');
    console.log('👤 Usuario Admin: admin@psicoespacios.com (admin123)');
    console.log('📋 3 Planes de suscripción creados');
    console.log('🗑️  TODOS los datos anteriores fueron eliminados');

  } catch (error) {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar
main();











