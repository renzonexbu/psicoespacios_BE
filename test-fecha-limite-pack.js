const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Token de autenticación (reemplazar con un token válido)
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testAsignarPackConFechaLimite() {
  try {
    console.log('🧪 Probando asignación de pack con fecha límite...\n');

    // Datos de prueba
    const packId = 'pack-id-aqui'; // Reemplazar con un ID válido
    const usuarioId = 'usuario-id-aqui'; // Reemplazar con un ID válido
    const boxId = 'box-id-aqui'; // Reemplazar con un ID válido

    // Calcular fecha límite: 2 meses desde hoy
    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaLimite.getMonth() + 2);
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`📅 Fecha límite calculada: ${fechaLimiteStr}`);

    const asignarPackData = {
      packId: packId,
      usuarioId: usuarioId,
      recurrente: true,
      fechaLimite: fechaLimiteStr,
      horarios: [
        {
          diaSemana: 1, // Lunes
          horaInicio: '09:00',
          horaFin: '10:00',
          boxId: boxId
        },
        {
          diaSemana: 3, // Miércoles
          horaInicio: '14:00',
          horaFin: '15:00',
          boxId: boxId
        }
      ]
    };

    console.log('📋 Datos de asignación:');
    console.log(JSON.stringify(asignarPackData, null, 2));

    const response = await axios.post(`${BASE_URL}/packs/asignar`, asignarPackData, { headers });
    
    console.log('\n✅ Pack asignado exitosamente:');
    console.log(JSON.stringify(response.data, null, 2));

    return response.data;

  } catch (error) {
    console.error('❌ Error al asignar pack:', error.response?.data || error.message);
    throw error;
  }
}

async function testAsignarPackSinFechaLimite() {
  try {
    console.log('\n🧪 Probando asignación de pack SIN fecha límite (debería usar 3 meses por defecto)...\n');

    const packId = 'pack-id-aqui';
    const usuarioId = 'usuario-id-aqui';
    const boxId = 'box-id-aqui';

    const asignarPackData = {
      packId: packId,
      usuarioId: usuarioId,
      recurrente: true,
      // Sin fechaLimite - debería usar 3 meses por defecto
      horarios: [
        {
          diaSemana: 2, // Martes
          horaInicio: '10:00',
          horaFin: '11:00',
          boxId: boxId
        }
      ]
    };

    console.log('📋 Datos de asignación (sin fecha límite):');
    console.log(JSON.stringify(asignarPackData, null, 2));

    const response = await axios.post(`${BASE_URL}/packs/asignar`, asignarPackData, { headers });
    
    console.log('\n✅ Pack asignado exitosamente:');
    console.log(JSON.stringify(response.data, null, 2));

    return response.data;

  } catch (error) {
    console.error('❌ Error al asignar pack:', error.response?.data || error.message);
    throw error;
  }
}

async function testValidacionesFechaLimite() {
  try {
    console.log('\n🧪 Probando validaciones de fecha límite...\n');

    const packId = 'pack-id-aqui';
    const usuarioId = 'usuario-id-aqui';
    const boxId = 'box-id-aqui';

    // Test 1: Fecha límite en el pasado
    console.log('📝 Test 1: Fecha límite en el pasado');
    try {
      const fechaPasado = new Date();
      fechaPasado.setDate(fechaPasado.getDate() - 10);
      const fechaPasadoStr = fechaPasado.toISOString().split('T')[0];

      await axios.post(`${BASE_URL}/packs/asignar`, {
        packId,
        usuarioId,
        fechaLimite: fechaPasadoStr,
        horarios: [{ diaSemana: 1, horaInicio: '09:00', horaFin: '10:00', boxId }]
      }, { headers });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

    // Test 2: Fecha límite muy lejana (más de 1 año)
    console.log('\n📝 Test 2: Fecha límite muy lejana (>1 año)');
    try {
      const fechaLejana = new Date();
      fechaLejana.setFullYear(fechaLejana.getFullYear() + 2);
      const fechaLejanaStr = fechaLejana.toISOString().split('T')[0];

      await axios.post(`${BASE_URL}/packs/asignar`, {
        packId,
        usuarioId,
        fechaLimite: fechaLejanaStr,
        horarios: [{ diaSemana: 1, horaInicio: '09:00', horaFin: '10:00', boxId }]
      }, { headers });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

    // Test 3: Formato de fecha inválido
    console.log('\n📝 Test 3: Formato de fecha inválido');
    try {
      await axios.post(`${BASE_URL}/packs/asignar`, {
        packId,
        usuarioId,
        fechaLimite: 'fecha-invalida',
        horarios: [{ diaSemana: 1, horaInicio: '09:00', horaFin: '10:00', boxId }]
      }, { headers });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

async function testDiferentesFechasLimite() {
  try {
    console.log('\n🧪 Probando diferentes fechas límite...\n');

    const packId = 'pack-id-aqui';
    const usuarioId = 'usuario-id-aqui';
    const boxId = 'box-id-aqui';

    const casosPrueba = [
      {
        nombre: '1 mes',
        fechaLimite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        nombre: '6 meses',
        fechaLimite: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        nombre: '11 meses (casi 1 año)',
        fechaLimite: new Date(Date.now() + 330 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ];

    for (const caso of casosPrueba) {
      console.log(`📅 Probando caso: ${caso.nombre} (${caso.fechaLimite})`);
      
      try {
        const response = await axios.post(`${BASE_URL}/packs/asignar`, {
          packId,
          usuarioId,
          fechaLimite: caso.fechaLimite,
          horarios: [{ diaSemana: 1, horaInicio: '09:00', horaFin: '10:00', boxId }]
        }, { headers });

        console.log(`✅ ${caso.nombre}: ${response.data.reservasGeneradas} reservas generadas`);
        console.log(`   Desde: ${response.data.fechaInicio}`);
        console.log(`   Hasta: ${response.data.fechaFin}`);
        
      } catch (error) {
        console.log(`❌ ${caso.nombre}: ${error.response?.data?.message || error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🚀 Iniciando pruebas de fecha límite en asignación de packs\n');
  console.log('=' .repeat(60));
  
  try {
    await testAsignarPackConFechaLimite();
    await testAsignarPackSinFechaLimite();
    await testValidacionesFechaLimite();
    await testDiferentesFechasLimite();
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Pruebas completadas');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testAsignarPackConFechaLimite,
  testAsignarPackSinFechaLimite,
  testValidacionesFechaLimite,
  testDiferentesFechasLimite,
  runAllTests
};
