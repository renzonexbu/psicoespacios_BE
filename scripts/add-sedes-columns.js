// add-sedes-columns.js
const { Client } = require('pg');
require('dotenv').config();

async function addColumns() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'psicoespacios',
    user: process.env.DATABASE_USERNAME || 'psicoespacios_user',
    password: process.env.DATABASE_PASSWORD || 'psicoespacios_password',
  });

  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // Agregar la columna estado si no existe
    await client.query(`
      ALTER TABLE sedes 
      ADD COLUMN IF NOT EXISTS estado character varying(20) DEFAULT 'ACTIVA'
    `);
    console.log('Columna estado agregada a la tabla sedes');

    await client.end();
    console.log('Operación completada');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

addColumns();
