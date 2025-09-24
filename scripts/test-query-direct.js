const { Client } = require('pg');
require('dotenv').config();

async function testQueryDirect() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Query directa para verificar la reserva
    const query = `
      SELECT id, psicologo_id, paciente_id, fecha, hora_inicio, hora_fin, modalidad, estado
      FROM reservas_sesiones 
      WHERE psicologo_id = $1 
      AND fecha = $2
      AND estado IN ($3, $4)
    `;

    const params = [
      '0289e826-187c-48cc-b08f-2104ecfea8ae', // psicologo_id
      '2025-09-03', // fecha
      'confirmada', // estado 1
      'pendiente'   // estado 2
    ];

    console.log('\n🔍 Ejecutando query directa:');
    console.log('SQL:', query);
    console.log('Parámetros:', params);

    const result = await client.query(query, params);
    
    console.log('\n📊 Resultados:');
    console.log(`Filas encontradas: ${result.rowCount}`);
    
    if (result.rows.length > 0) {
      result.rows.forEach((row, index) => {
        console.log(`\n${index + 1}. Reserva encontrada:`);
        console.log(`   ID: ${row.id}`);
        console.log(`   Psicólogo ID: ${row.psicologo_id}`);
        console.log(`   Paciente ID: ${row.paciente_id}`);
        console.log(`   Fecha: ${row.fecha}`);
        console.log(`   Hora: ${row.hora_inicio} - ${row.hora_fin}`);
        console.log(`   Modalidad: ${row.modalidad}`);
        console.log(`   Estado: ${row.estado}`);
      });
    } else {
      console.log('❌ No se encontraron reservas');
    }

    // Verificar todas las reservas para este psicólogo
    console.log('\n🔍 Verificando todas las reservas del psicólogo:');
    const allReservas = await client.query(
      'SELECT * FROM reservas_sesiones WHERE psicologo_id = $1',
      ['0289e826-187c-48cc-b08f-2104ecfea8ae']
    );
    
    console.log(`Total de reservas para este psicólogo: ${allReservas.rowCount}`);
    allReservas.rows.forEach(row => {
      console.log(`   ${row.fecha} ${row.hora_inicio}-${row.hora_fin} (${row.estado})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

testQueryDirect().catch(console.error);



