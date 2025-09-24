// scripts/debug-septiembre-3.js
const { Client } = require('pg');
require('dotenv').config();

async function debugSeptiembre3() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Query EXACTA que está fallando
    const query = `
      SELECT "reserva"."id" AS "reserva_id", "reserva"."fecha" AS "reserva_fecha", 
      "reserva"."hora_inicio" AS "reserva_hora_inicio", "reserva"."hora_fin" AS "reserva_hora_fin", 
      "reserva"."box_id" AS "reserva_box_id", "reserva"."modalidad" AS "reserva_modalidad", 
      "reserva"."estado" AS "reserva_estado", "reserva"."observaciones" AS "reserva_observaciones", 
      "reserva"."cupon_id" AS "reserva_cupon_id", "reserva"."descuento_aplicado" AS "reserva_descuento_aplicado", 
      "reserva"."metadatos" AS "reserva_metadatos", "reserva"."created_at" AS "reserva_created_at", 
      "reserva"."updated_at" AS "reserva_updated_at", "reserva"."psicologo_id" AS "reserva_psicologo_id", 
      "reserva"."paciente_id" AS "reserva_paciente_id" 
      FROM "reservas_sesiones" "reserva" 
      WHERE "reserva"."psicologo_id" = $1 AND "reserva"."fecha" = $2 AND "reserva"."estado" = $3
    `;

    const params = [
      '0289e826-187c-48cc-b08f-2104ecfea8ae', // psicologo_id
      '2025-09-03T00:00:00.000Z', // fecha EXACTA que está fallando
      'confirmada' // estado
    ];

    console.log('\n🔍 Ejecutando query EXACTA del backend:');
    console.log('SQL:', query);
    console.log('Parámetros:', params);

    const result = await client.query(query, params);

    console.log('\n�� Resultados:');
    console.log(`Filas encontradas: ${result.rowCount}`);

    if (result.rows.length > 0) {
      result.rows.forEach((row, index) => {
        console.log(`\n${index + 1}. Reserva encontrada:`);
        console.log(`   ID: ${row.id}`);
        console.log(`   Psicólogo ID: ${row.psicologo_id}`);
        console.log(`   Fecha: ${row.fecha}`);
        console.log(`   Hora: ${row.hora_inicio} - ${row.hora_fin}`);
        console.log(`   Estado: ${row.estado}`);
      });
    } else {
      console.log('❌ No se encontraron reservas');
    }

    // Verificar si hay algún problema con la fecha
    console.log('\n🔍 Verificando formato de fecha en la BD:');
    const fechaCheck = await client.query(
      'SELECT id, psicologo_id, fecha, hora_inicio, hora_fin, estado FROM reservas_sesiones WHERE psicologo_id = $1',
      ['0289e826-187c-48cc-b08f-2104ecfea8ae']
    );

    fechaCheck.rows.forEach(row => {
      console.log(`   ID: ${row.id}, Fecha: ${row.fecha} (${typeof row.fecha}), Estado: ${row.estado}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

debugSeptiembre3().catch(console.error);