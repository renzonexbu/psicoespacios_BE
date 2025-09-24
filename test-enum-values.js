require('dotenv').config();
const { Client } = require('pg');

async function checkEnumValues() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'psicoespacios',
    user: process.env.DB_USERNAME || 'psicoespacios',
    password: process.env.DB_PASSWORD || 'psicoespacios',
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Verificar los valores del enum
    console.log('\n🔍 Verificando valores del enum estado_reserva_psicologo_enum...');
    
    const enumQuery = `
      SELECT unnest(enum_range(NULL::estado_reserva_psicologo_enum)) as valor_enum;
    `;
    
    const enumResult = await client.query(enumQuery);
    console.log('📋 Valores del enum:');
    enumResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.valor_enum}`);
    });

    // Verificar si hay reservas con diferentes estados
    console.log('\n🔍 Verificando estados existentes en reservas_sesiones...');
    
    const estadosQuery = `
      SELECT DISTINCT estado, COUNT(*) as cantidad
      FROM reservas_sesiones 
      GROUP BY estado 
      ORDER BY estado;
    `;
    
    const estadosResult = await client.query(estadosQuery);
    console.log('📊 Estados encontrados en la tabla:');
    estadosResult.rows.forEach(row => {
      console.log(`   - ${row.estado}: ${row.cantidad} reservas`);
    });

    // Verificar la estructura de la tabla
    console.log('\n🔍 Verificando estructura de reservas_sesiones...');
    
    const structureQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'reservas_sesiones' 
      AND column_name = 'estado'
      ORDER BY ordinal_position;
    `;
    
    const structureResult = await client.query(structureQuery);
    console.log('🏗️  Estructura de la columna estado:');
    structureResult.rows.forEach(row => {
      console.log(`   - Columna: ${row.column_name}`);
      console.log(`   - Tipo: ${row.data_type}`);
      console.log(`   - Nullable: ${row.is_nullable}`);
      console.log(`   - Default: ${row.column_default}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

checkEnumValues();



