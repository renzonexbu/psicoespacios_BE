const { Client } = require('pg');
require('dotenv').config();

async function addFonasaColumn() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'psicoespacios',
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('✓ Conectado a la base de datos');

    // Verificar si la columna ya existe
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='psicologo' AND column_name='fonasa';
    `;
    
    const checkResult = await client.query(checkColumnQuery);
    
    if (checkResult.rows.length > 0) {
      console.log('⚠ La columna "fonasa" ya existe en la tabla psicologo');
      return;
    }

    // Agregar la columna fonasa
    console.log('Agregando columna "fonasa" a la tabla psicologo...');
    
    await client.query(`
      ALTER TABLE psicologo 
      ADD COLUMN fonasa boolean DEFAULT false NOT NULL;
    `);

    console.log('✓ Columna "fonasa" agregada exitosamente');

    // Verificar que se agregó correctamente
    const verifyResult = await client.query(checkColumnQuery);
    if (verifyResult.rows.length > 0) {
      console.log('✓ Verificación exitosa: la columna existe en la base de datos');
    }

    // Mostrar algunos registros
    const sampleQuery = await client.query(`
      SELECT id, "precioOnline", "precioPresencial", fonasa 
      FROM psicologo 
      LIMIT 5;
    `);

    console.log('\n=== Muestra de datos (primeros 5 registros) ===');
    console.table(sampleQuery.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n✓ Conexión cerrada');
  }
}

addFonasaColumn();

