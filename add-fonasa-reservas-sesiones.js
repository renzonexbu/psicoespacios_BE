const { Client } = require('pg');

async function addFonasaColumnReservasSesiones() {
  // Usar configuración local explícita
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'psicoespacios',
    user: 'admin',
    password: 'admin123',
  });

  try {
    await client.connect();
    console.log('✓ Conectado a la base de datos local');

    // Verificar si la columna ya existe
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='reservas_sesiones' AND column_name='fonasa';
    `;
    
    const checkResult = await client.query(checkColumnQuery);
    
    if (checkResult.rows.length > 0) {
      console.log('⚠ La columna "fonasa" ya existe en la tabla reservas_sesiones');
      
      // Mostrar algunos registros
      const sampleQuery = await client.query(`
        SELECT id, fecha, modalidad, fonasa, estado
        FROM reservas_sesiones 
        LIMIT 5;
      `);

      console.log('\n=== Muestra de datos (primeros 5 registros) ===');
      console.table(sampleQuery.rows);
      
      return;
    }

    // Agregar la columna fonasa
    console.log('Agregando columna "fonasa" a la tabla reservas_sesiones...');
    
    await client.query(`
      ALTER TABLE reservas_sesiones 
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
      SELECT id, fecha, modalidad, fonasa, estado
      FROM reservas_sesiones 
      LIMIT 5;
    `);

    console.log('\n=== Muestra de datos (primeros 5 registros) ===');
    console.table(sampleQuery.rows);

    console.log('\n✅ RESUMEN:');
    console.log('   - Columna "fonasa" agregada a reservas_sesiones');
    console.log('   - Tipo: boolean');
    console.log('   - Valor por defecto: false');
    console.log('   - NOT NULL');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\nAsegúrate de que PostgreSQL esté corriendo en tu máquina local.');
      console.error('Puerto: 5432');
      console.error('Base de datos: psicoespacios');
      console.error('Usuario: admin');
    } else if (error.code === '28P01') {
      console.error('\nCredenciales incorrectas. Verifica el usuario y contraseña en el archivo .env');
    }
    throw error;
  } finally {
    await client.end();
    console.log('\n✓ Conexión cerrada');
  }
}

addFonasaColumnReservasSesiones();

