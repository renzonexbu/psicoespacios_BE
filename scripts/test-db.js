const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function testConnection() {
  try {
    console.log('Intentando conectar a la base de datos...');
    await client.connect();
    console.log('✅ Conexión establecida');

    const res = await client.query('SELECT NOW()');
    console.log('✅ Consulta ejecutada exitosamente:', res.rows[0]);

    await client.end();
    console.log('✅ Conexión cerrada correctamente');
    return true;
  } catch (err) {
    console.error('❌ Error al conectar:', err.message);
    return false;
  }
}

testConnection().then((success) => {
  process.exit(success ? 0 : 1);
});
