// test-connection.js
const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  // Configuración usando variables de entorno
  const config = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'psicoespacios',
    user: process.env.DATABASE_USERNAME || 'psicoespacios_user',
    password: process.env.DATABASE_PASSWORD || 'psicoespacios_password',
  };

  const client = new Client(config);

  try {
    console.log('Intentando conectar a PostgreSQL...');
    await client.connect();
    console.log('¡Conexión exitosa a la base de datos!');

    const res = await client.query('SELECT NOW()');
    console.log('Fecha y hora del servidor:', res.rows[0].now);

    await client.end();
    console.log('Conexión cerrada.');
  } catch (err) {
    console.error('Error al conectar a la base de datos:', err);
  }
}

testConnection();
