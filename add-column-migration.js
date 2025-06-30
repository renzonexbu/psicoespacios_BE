const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Conectando a la base de datos...');

    // Comprobar si la columna existe
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'fotoUrl'
    `);

    if (checkResult.rows.length > 0) {
      console.log('La columna fotoUrl ya existe.');
    } else {
      // Añadir la columna
      console.log('Añadiendo la columna fotoUrl...');
      await client.query(
        'ALTER TABLE users ADD COLUMN "fotoUrl" character varying;',
      );
      console.log('Columna añadida correctamente.');
    }
  } catch (err) {
    console.error('Error en la migración:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    console.log('Migración completada.');
  }
}

migrate();
