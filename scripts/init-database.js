#!/usr/bin/env node
// init-database.js - Script simplificado para inicializar la base de datos
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
  console.log('Iniciando creación de tablas base...');

  const config = {
    connectionString: process.env.DATABASE_URL,
  };

  // Añadir SSL si estamos en producción (URL remota)
  if (
    process.env.DATABASE_URL &&
    (process.env.DATABASE_URL.startsWith('postgres://') ||
      process.env.DATABASE_URL.startsWith('postgresql://'))
  ) {
    config.ssl = {
      rejectUnauthorized: false,
    };
  }

  // Crear cliente de PostgreSQL
  const client = new Client(config);

  try {
    // Conectar a la base de datos
    await client.connect();
    console.log('Conexión a la base de datos establecida');

    // Leer el archivo SQL
    const sqlFilePath = path.join(__dirname, 'base-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Ejecutar las sentencias SQL
    console.log('Ejecutando script SQL para crear tablas base...');
    await client.query(sqlContent);

    console.log('Tablas base creadas correctamente');

    // Verificar tablas creadas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'sedes', 'boxes', 'planes', 'suscripciones', 'pagos', 'configuracion_sistema');
    `);

    const existingTables = tablesResult.rows.map((row) => row.table_name);
    console.log('Tablas verificadas:', existingTables);

    await client.end();
    console.log('Inicialización de base de datos completada');
    return true;
  } catch (error) {
    console.error(
      'Error durante la inicialización de la base de datos:',
      error,
    );
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
  initDatabase()
    .then((success) => {
      if (success) {
        console.log('✅ Script de inicialización completado exitosamente');
        process.exit(0);
      } else {
        console.error('❌ Falló la inicialización de la base de datos');
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Error fatal en el script:', err);
      process.exit(1);
    });
}

module.exports = { initDatabase };
