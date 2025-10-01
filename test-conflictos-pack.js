const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Token de autenticación (reemplazar con un token válido)
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testAsignarPackSinConflictos() {
  try {
    console.log('🧪 Probando asignación de pack SIN conflictos...\n');

    const packId = 'pack-id-aqui';
    const usuarioId = 'usuario-id-aqui';
    const boxId = 'box-id-aqui';

    // Horarios que probablemente no tengan conflictos (horarios tempranos)
    const asignarPackData = {
      packId: packId,
      usuarioId: usuarioId,
      recurrente: true,
      fechaLimite: '2024-03-31',
      horarios: [
        {
          diaSemana: 1, // Lunes
          horaInicio: '07:00',
          horaFin: '08:00',
          boxId: boxId
        },
        {
          diaSemana: 3, // Miércoles
          horaInicio: '07:30',
          horaFin: '08:30',
          boxId: boxId
        }
      ]
    };

    console.log('📋 Datos de asignación (sin conflictos esperados):');
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

async function testAsignarPackConConflictos() {
  try {
    console.log('\n🧪 Probando asignación de pack CON conflictos...\n');

    const packId = 'pack-id-aqui';
    const usuarioId = 'usuario-id-aqui';
    const boxId = 'box-id-aqui';

    // Horarios que probablemente tengan conflictos (horarios populares)
    const asignarPackData = {
      packId: packId,
      usuarioId: usuarioId,
      recurrente: true,
      fechaLimite: '2024-03-31',
      horarios: [
        {
          diaSemana: 1, // Lunes
          horaInicio: '09:00',
          horaFin: '10:00',
          boxId: boxId
        },
        {
          diaSemana: 2, // Martes
          horaInicio: '10:00',
          horaFin: '11:00',
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

    console.log('📋 Datos de asignación (con conflictos esperados):');
    console.log(JSON.stringify(asignarPackData, null, 2));

    try {
      const response = await axios.post(`${BASE_URL}/packs/asignar`, asignarPackData, { headers });
      console.log('\n✅ Pack asignado (inesperado - no había conflictos):');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('\n❌ Conflictos detectados (esperado):');
        console.log('📊 Resumen de conflictos:');
        console.log(`   Total conflictos: ${error.response.data.totalConflictos}`);
        console.log(`   Mensaje: ${error.response.data.message}`);
        
        console.log('\n📋 Detalles de conflictos:');
        error.response.data.conflictos.forEach((conflicto, index) => {
          console.log(`   ${index + 1}. ${conflicto.diaSemana} ${conflicto.fecha}`);
          console.log(`      Box: ${conflicto.boxNombre}`);
          console.log(`      Horario solicitado: ${conflicto.horarioSolicitado}`);
          console.log(`      Horario existente: ${conflicto.horarioExistente}`);
          console.log(`      Psicólogo existente: ${conflicto.psicologoExistente.nombre} (${conflicto.psicologoExistente.email})`);
          console.log(`      Reserva ID: ${conflicto.reservaExistenteId}`);
          console.log('');
        });
      } else {
        console.error('❌ Error inesperado:', error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
  }
}

async function testConflictosSolapamiento() {
  try {
    console.log('\n🧪 Probando diferentes tipos de solapamiento...\n');

    const packId = 'pack-id-aqui';
    const usuarioId = 'usuario-id-aqui';
    const boxId = 'box-id-aqui';

    const casosSolapamiento = [
      {
        nombre: 'Solapamiento completo',
        horarios: [
          {
            diaSemana: 1,
            horaInicio: '09:00',
            horaFin: '10:00',
            boxId: boxId
          }
        ]
      },
      {
        nombre: 'Solapamiento parcial inicio',
        horarios: [
          {
            diaSemana: 1,
            horaInicio: '09:30',
            horaFin: '10:30',
            boxId: boxId
          }
        ]
      },
      {
        nombre: 'Solapamiento parcial fin',
        horarios: [
          {
            diaSemana: 1,
            horaInicio: '08:30',
            horaFin: '09:30',
            boxId: boxId
          }
        ]
      },
      {
        nombre: 'Sin solapamiento',
        horarios: [
          {
            diaSemana: 1,
            horaInicio: '11:00',
            horaFin: '12:00',
            boxId: boxId
          }
        ]
      }
    ];

    for (const caso of casosSolapamiento) {
      console.log(`📅 Probando: ${caso.nombre}`);
      
      try {
        const response = await axios.post(`${BASE_URL}/packs/asignar`, {
          packId,
          usuarioId,
          fechaLimite: '2024-03-31',
          horarios: caso.horarios
        }, { headers });

        console.log(`✅ ${caso.nombre}: Sin conflictos - ${response.data.reservasGeneradas} reservas generadas`);
        
      } catch (error) {
        if (error.response?.status === 400 && error.response.data.conflictos) {
          console.log(`❌ ${caso.nombre}: ${error.response.data.totalConflictos} conflictos detectados`);
          error.response.data.conflictos.forEach(conflicto => {
            console.log(`   - ${conflicto.fecha}: ${conflicto.horarioSolicitado} vs ${conflicto.horarioExistente}`);
          });
        } else {
          console.log(`❌ ${caso.nombre}: Error inesperado - ${error.response?.data?.message || error.message}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

async function testConflictosMultiplesBoxes() {
  try {
    console.log('\n🧪 Probando conflictos en múltiples boxes...\n');

    const packId = 'pack-id-aqui';
    const usuarioId = 'usuario-id-aqui';
    const boxId1 = 'box-id-1';
    const boxId2 = 'box-id-2';

    const asignarPackData = {
      packId: packId,
      usuarioId: usuarioId,
      recurrente: true,
      fechaLimite: '2024-03-31',
      horarios: [
        {
          diaSemana: 1,
          horaInicio: '09:00',
          horaFin: '10:00',
          boxId: boxId1
        },
        {
          diaSemana: 1,
          horaInicio: '09:00',
          horaFin: '10:00',
          boxId: boxId2
        },
        {
          diaSemana: 2,
          horaInicio: '10:00',
          horaFin: '11:00',
          boxId: boxId1
        }
      ]
    };

    console.log('📋 Datos de asignación (múltiples boxes):');
    console.log(JSON.stringify(asignarPackData, null, 2));

    try {
      const response = await axios.post(`${BASE_URL}/packs/asignar`, asignarPackData, { headers });
      console.log('\n✅ Pack asignado exitosamente:');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('\n❌ Conflictos detectados:');
        console.log(`   Total conflictos: ${error.response.data.totalConflictos}`);
        
        // Agrupar conflictos por box
        const conflictosPorBox = {};
        error.response.data.conflictos.forEach(conflicto => {
          if (!conflictosPorBox[conflicto.boxId]) {
            conflictosPorBox[conflicto.boxId] = [];
          }
          conflictosPorBox[conflicto.boxId].push(conflicto);
        });

        Object.keys(conflictosPorBox).forEach(boxId => {
          console.log(`\n   📦 Box ${boxId}:`);
          conflictosPorBox[boxId].forEach(conflicto => {
            console.log(`      - ${conflicto.fecha}: ${conflicto.horarioSolicitado} vs ${conflicto.horarioExistente}`);
          });
        });
      } else {
        console.error('❌ Error inesperado:', error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
  }
}

async function testValidacionesConflictos() {
  try {
    console.log('\n🧪 Probando validaciones de conflictos...\n');

    const packId = 'pack-id-aqui';
    const usuarioId = 'usuario-id-aqui';
    const boxId = 'box-id-aqui';

    // Test 1: Horarios inválidos
    console.log('📝 Test 1: Horarios inválidos');
    try {
      await axios.post(`${BASE_URL}/packs/asignar`, {
        packId,
        usuarioId,
        horarios: [
          {
            diaSemana: 1,
            horaInicio: '10:00',
            horaFin: '09:00', // Hora fin antes que inicio
            boxId: boxId
          }
        ]
      }, { headers });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

    // Test 2: Box inexistente
    console.log('\n📝 Test 2: Box inexistente');
    try {
      await axios.post(`${BASE_URL}/packs/asignar`, {
        packId,
        usuarioId,
        horarios: [
          {
            diaSemana: 1,
            horaInicio: '09:00',
            horaFin: '10:00',
            boxId: 'box-inexistente'
          }
        ]
      }, { headers });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🚀 Iniciando pruebas de validación de conflictos en packs\n');
  console.log('=' .repeat(70));
  
  try {
    await testAsignarPackSinConflictos();
    await testAsignarPackConConflictos();
    await testConflictosSolapamiento();
    await testConflictosMultiplesBoxes();
    await testValidacionesConflictos();
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
  
  console.log('\n' + '=' .repeat(70));
  console.log('✅ Pruebas completadas');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testAsignarPackSinConflictos,
  testAsignarPackConConflictos,
  testConflictosSolapamiento,
  testConflictosMultiplesBoxes,
  testValidacionesConflictos,
  runAllTests
};
