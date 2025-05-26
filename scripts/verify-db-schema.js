#!/usr/bin/env node
// verify-db-schema.js - Script para verificar la consistencia del esquema de la base de datos
const { Client } = require('pg');
require('dotenv').config();

async function verifyDatabaseSchema() {
  console.log('Verificando consistencia del esquema de la base de datos...');

  // Configuración explícita para desarrollo local
  const config = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'psicoespacios',
    user: process.env.DATABASE_USERNAME || 'psicoespacios_user',
    password: process.env.DATABASE_PASSWORD || 'psicoespacios_password',
  };

  // Usar DATABASE_URL si está definida (para producción)
  if (process.env.DATABASE_URL) {
    console.log('Usando DATABASE_URL para conectar a la base de datos');
    config.connectionString = process.env.DATABASE_URL;

    // Añadir SSL solo si estamos en producción y no en desarrollo local
    if (
      (process.env.DATABASE_URL.startsWith('postgres://') ||
        process.env.DATABASE_URL.startsWith('postgresql://')) &&
      process.env.NODE_ENV === 'production'
    ) {
      config.ssl = {
        rejectUnauthorized: false,
      };
    }
  }

  // Crear cliente de PostgreSQL
  const client = new Client(config);

  try {
    // Conectar a la base de datos
    await client.connect();
    console.log('Conexión a la base de datos establecida');

    // Verificar tablas existentes
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const existingTables = tablesResult.rows.map((row) => row.table_name);
    console.log('Tablas existentes en la base de datos:', existingTables);

    // Verificar columnas de configuracion_sistema
    if (existingTables.includes('configuracion_sistema')) {
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'configuracion_sistema'
        ORDER BY ordinal_position;
      `);

      console.log('\nEstructura de la tabla configuracion_sistema:');
      columnsResult.rows.forEach((col) => {
        console.log(
          `- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`,
        );
      });
    } else {
      console.log('\nLa tabla configuracion_sistema no existe');
    }

    // Verificar columnas de planes
    if (existingTables.includes('planes')) {
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'planes'
        ORDER BY ordinal_position;
      `);

      console.log('\nEstructura de la tabla planes:');
      columnsResult.rows.forEach((col) => {
        console.log(
          `- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`,
        );
      });
    } else {
      console.log('\nLa tabla planes no existe');
    }

    // Verificar tablas faltantes en comparación con las entidades TypeORM
    const expectedTables = [
      'users',
      'configuracion_sistema',
      'sedes',
      'boxes',
      'planes',
      'suscripciones',
      'contactos',
      'pagos',
      'reservas',
    ];

    const missingTables = expectedTables.filter(
      (table) => !existingTables.includes(table),
    );
    if (missingTables.length > 0) {
      console.log('\nTablas esperadas que faltan en la base de datos:');
      missingTables.forEach((table) => console.log(`- ${table}`));
    } else {
      console.log('\nTodas las tablas esperadas existen en la base de datos');
    }

    await client.end();
    console.log('\nVerificación de esquema completada');
    return true;
  } catch (error) {
    console.error('Error durante la verificación del esquema:', error);
    try {
      await client.end();
    } catch (e) {
      // Ignorar errores al cerrar conexión
    }
    return false;
  }
}

// Ejecutar el script directamente
if (require.main === module) {
  verifyDatabaseSchema()
    .then((success) => {
      if (success) {
        console.log('✅ Script de verificación completado exitosamente');
        process.exit(0);
      } else {
        console.error(
          '❌ Falló la verificación del esquema de la base de datos',
        );
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Error fatal en el script:', err);
      process.exit(1);
    });
}

module.exports = { verifyDatabaseSchema };
