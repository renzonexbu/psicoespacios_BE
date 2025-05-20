// db-check.js
const { Client } = require('pg');
require('dotenv').config();

async function checkDatabaseConnection() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_ORBSApcN7Vd5@ep-plain-sound-a48dlyhv-pooler.us-east-1.aws.neon.tech/psicoespacios?sslmode=require';

  console.log('Intentando conectar a:', connectionString);

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log('Conexión exitosa!');

    const result = await client.query('SELECT NOW()');
    console.log('Fecha y hora del servidor:', result.rows[0].now);

    // Verificar tablas existentes
    const tablesResult = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
    );

    console.log('Tablas en la base de datos:');
    tablesResult.rows.forEach((row) => {
      console.log(`- ${row.table_name}`);
    });

    // Verificar tabla users
    try {
      const usersCount = await client.query('SELECT COUNT(*) FROM users');
      console.log(`Total de usuarios: ${usersCount.rows[0].count}`);
    } catch (err) {
      console.error('Error al consultar tabla users:', err.message);
    }
  } catch (err) {
    console.error('Error de conexión:', err);
  } finally {
    await client.end();
  }
}

checkDatabaseConnection();
