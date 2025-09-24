const { Client } = require('pg');
require('dotenv').config();

async function debugSuscripciones() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'psicoespacios',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('🔍 Conectado a la base de datos');

    // Verificar estructura de la tabla suscripciones
    console.log('\n📋 Estructura de la tabla suscripciones:');
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'suscripciones' 
      ORDER BY ordinal_position
    `);
    
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });

    // Verificar si hay datos en la tabla
    console.log('\n📋 Datos en la tabla suscripciones:');
    const dataResult = await client.query('SELECT COUNT(*) as count FROM suscripciones');
    console.log(`  - Total de registros: ${dataResult.rows[0].count}`);

    if (parseInt(dataResult.rows[0].count) > 0) {
      const sampleResult = await client.query('SELECT * FROM suscripciones LIMIT 3');
      console.log('\n📋 Muestra de datos:');
      sampleResult.rows.forEach((row, index) => {
        console.log(`  Registro ${index + 1}:`, JSON.stringify(row, null, 2));
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

debugSuscripciones();
















