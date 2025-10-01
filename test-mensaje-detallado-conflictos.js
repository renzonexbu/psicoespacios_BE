const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Token de autenticación (reemplazar con un token válido)
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testMensajeDetalladoConflictos() {
  try {
    console.log('🧪 Probando mensaje detallado de conflictos...\n');

    const packId = 'pack-id-aqui';
    const usuarioId = 'usuario-id-aqui';
    const boxId = 'box-id-aqui';

    // Horarios que probablemente tengan conflictos
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
          diaSemana: 1, // Lunes (mismo día, diferente horario)
          horaInicio: '10:00',
          horaFin: '11:00',
          boxId: boxId
        },
        {
          diaSemana: 2, // Martes
          horaInicio: '14:00',
          horaFin: '15:00',
          boxId: boxId
        },
        {
          diaSemana: 3, // Miércoles
          horaInicio: '16:00',
          horaFin: '17:00',
          boxId: boxId
        }
      ]
    };

    console.log('📋 Datos de asignación:');
    console.log(JSON.stringify(asignarPackData, null, 2));

    try {
      const response = await axios.post(`${BASE_URL}/packs/asignar`, asignarPackData, { headers });
      console.log('\n✅ Pack asignado (inesperado):');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('\n❌ Conflictos detectados:');
        console.log('=' .repeat(60));
        console.log('📊 INFORMACIÓN DEL ERROR:');
        console.log(`   Status Code: ${error.response.status}`);
        console.log(`   Error Type: ${error.response.data.error}`);
        console.log(`   Timestamp: ${error.response.data.timestamp}`);
        console.log(`   Path: ${error.response.data.path}`);
        console.log(`   Method: ${error.response.data.method}`);
        
        console.log('\n📋 MENSAJE DETALLADO:');
        console.log('=' .repeat(60));
        console.log(error.response.data.message);
        console.log('=' .repeat(60));
        
        console.log('\n📊 RESUMEN TÉCNICO:');
        console.log(`   Total conflictos: ${error.response.data.totalConflictos}`);
        console.log(`   Conflictos en array: ${error.response.data.conflictos?.length || 0}`);
        
        if (error.response.data.conflictos && error.response.data.conflictos.length > 0) {
          console.log('\n🔍 DETALLES TÉCNICOS DE CONFLICTOS:');
          error.response.data.conflictos.forEach((conflicto, index) => {
            console.log(`   ${index + 1}. Fecha: ${conflicto.fecha}`);
            console.log(`      Día: ${conflicto.diaSemana}`);
            console.log(`      Box: ${conflicto.boxNombre} (${conflicto.boxId})`);
            console.log(`      Horario solicitado: ${conflicto.horarioSolicitado}`);
            console.log(`      Horario existente: ${conflicto.horarioExistente}`);
            console.log(`      Psicólogo: ${conflicto.psicologoExistente.nombre} (${conflicto.psicologoExistente.email})`);
            console.log(`      Reserva ID: ${conflicto.reservaExistenteId}`);
            console.log('');
          });
        }
        
      } else {
        console.error('❌ Error inesperado:', error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
  }
}

async function testMensajeUnSoloConflicto() {
  try {
    console.log('\n🧪 Probando mensaje con un solo conflicto...\n');

    const packId = 'pack-id-aqui';
    const usuarioId = 'usuario-id-aqui';
    const boxId = 'box-id-aqui';

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
        }
      ]
    };

    try {
      const response = await axios.post(`${BASE_URL}/packs/asignar`, asignarPackData, { headers });
      console.log('\n✅ Pack asignado (inesperado):');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('\n❌ Un conflicto detectado:');
        console.log('=' .repeat(50));
        console.log('📋 MENSAJE:');
        console.log(error.response.data.message);
        console.log('=' .repeat(50));
        console.log(`Total conflictos: ${error.response.data.totalConflictos}`);
      } else {
        console.error('❌ Error inesperado:', error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
  }
}

async function testMensajeMultiplesFechas() {
  try {
    console.log('\n🧪 Probando mensaje con conflictos en múltiples fechas...\n');

    const packId = 'pack-id-aqui';
    const usuarioId = 'usuario-id-aqui';
    const boxId = 'box-id-aqui';

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

    try {
      const response = await axios.post(`${BASE_URL}/packs/asignar`, asignarPackData, { headers });
      console.log('\n✅ Pack asignado (inesperado):');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('\n❌ Conflictos en múltiples fechas:');
        console.log('=' .repeat(60));
        console.log('📋 MENSAJE DETALLADO:');
        console.log(error.response.data.message);
        console.log('=' .repeat(60));
        
        // Verificar que el mensaje esté bien estructurado
        const mensaje = error.response.data.message;
        const lineas = mensaje.split('\n');
        console.log('\n📊 ANÁLISIS DEL MENSAJE:');
        console.log(`   Total líneas: ${lineas.length}`);
        console.log(`   Contiene emojis: ${mensaje.includes('📅') ? 'Sí' : 'No'}`);
        console.log(`   Contiene fechas: ${mensaje.includes('2024-') ? 'Sí' : 'No'}`);
        console.log(`   Contiene días: ${mensaje.includes('Lunes') || mensaje.includes('Martes') || mensaje.includes('Miércoles') ? 'Sí' : 'No'}`);
        console.log(`   Contiene horarios: ${mensaje.includes('09:00') || mensaje.includes('10:00') ? 'Sí' : 'No'}`);
        console.log(`   Contiene nombres de psicólogos: ${mensaje.includes('Psicólogo:') ? 'Sí' : 'No'}`);
        
      } else {
        console.error('❌ Error inesperado:', error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
  }
}

async function testFormatoMensaje() {
  try {
    console.log('\n🧪 Verificando formato del mensaje...\n');

    // Simular conflictos para probar el formato
    const conflictosSimulados = [
      {
        fecha: '2024-01-22',
        diaSemana: 'Lunes',
        boxId: 'box-1',
        boxNombre: 'Box 1',
        horarioSolicitado: '09:00 - 10:00',
        horarioExistente: '09:00 - 10:00',
        psicologoExistente: {
          nombre: 'Dr. Juan Pérez',
          email: 'juan@email.com'
        }
      },
      {
        fecha: '2024-01-22',
        diaSemana: 'Lunes',
        boxId: 'box-1',
        boxNombre: 'Box 1',
        horarioSolicitado: '10:00 - 11:00',
        horarioExistente: '10:30 - 11:30',
        psicologoExistente: {
          nombre: 'Dra. María García',
          email: 'maria@email.com'
        }
      },
      {
        fecha: '2024-01-23',
        diaSemana: 'Martes',
        boxId: 'box-2',
        boxNombre: 'Box 2',
        horarioSolicitado: '14:00 - 15:00',
        horarioExistente: '14:00 - 15:00',
        psicologoExistente: {
          nombre: 'Dr. Carlos López',
          email: 'carlos@email.com'
        }
      }
    ];

    // Simular el método generarMensajeConflictos
    function generarMensajeConflictos(conflictos) {
      if (conflictos.length === 0) return '';

      let mensaje = `Existen ${conflictos.length} conflicto${conflictos.length > 1 ? 's' : ''} de reservas:\n\n`;
      
      // Agrupar conflictos por fecha para mejor legibilidad
      const conflictosPorFecha = {};
      conflictos.forEach(conflicto => {
        if (!conflictosPorFecha[conflicto.fecha]) {
          conflictosPorFecha[conflicto.fecha] = [];
        }
        conflictosPorFecha[conflicto.fecha].push(conflicto);
      });

      // Generar mensaje detallado
      Object.keys(conflictosPorFecha).sort().forEach(fecha => {
        const conflictosFecha = conflictosPorFecha[fecha];
        mensaje += `📅 ${fecha} (${conflictosFecha[0].diaSemana}):\n`;
        
        conflictosFecha.forEach((conflicto, index) => {
          mensaje += `   ${index + 1}. Box "${conflicto.boxNombre}" - `;
          mensaje += `Horario solicitado: ${conflicto.horarioSolicitado} `;
          mensaje += `conflicta con horario existente: ${conflicto.horarioExistente} `;
          mensaje += `(Psicólogo: ${conflicto.psicologoExistente.nombre})\n`;
        });
        mensaje += '\n';
      });

      mensaje += 'Por favor, ajuste los horarios solicitados para evitar estos conflictos.';
      
      return mensaje;
    }

    const mensajeGenerado = generarMensajeConflictos(conflictosSimulados);
    
    console.log('📋 MENSAJE GENERADO:');
    console.log('=' .repeat(60));
    console.log(mensajeGenerado);
    console.log('=' .repeat(60));
    
    console.log('\n📊 ANÁLISIS DEL FORMATO:');
    console.log(`   Longitud del mensaje: ${mensajeGenerado.length} caracteres`);
    console.log(`   Número de líneas: ${mensajeGenerado.split('\n').length}`);
    console.log(`   Contiene emojis: ${mensajeGenerado.includes('📅') ? 'Sí' : 'No'}`);
    console.log(`   Contiene fechas: ${mensajeGenerado.includes('2024-') ? 'Sí' : 'No'}`);
    console.log(`   Contiene días: ${mensajeGenerado.includes('Lunes') || mensajeGenerado.includes('Martes') ? 'Sí' : 'No'}`);
    console.log(`   Contiene horarios: ${mensajeGenerado.includes('09:00') || mensajeGenerado.includes('10:00') ? 'Sí' : 'No'}`);
    console.log(`   Contiene nombres de psicólogos: ${mensajeGenerado.includes('Psicólogo:') ? 'Sí' : 'No'}`);
    console.log(`   Termina con instrucción: ${mensajeGenerado.includes('Por favor, ajuste') ? 'Sí' : 'No'}`);

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🚀 Iniciando pruebas de mensaje detallado de conflictos\n');
  console.log('=' .repeat(70));
  
  try {
    await testMensajeDetalladoConflictos();
    await testMensajeUnSoloConflicto();
    await testMensajeMultiplesFechas();
    await testFormatoMensaje();
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
  testMensajeDetalladoConflictos,
  testMensajeUnSoloConflicto,
  testMensajeMultiplesFechas,
  testFormatoMensaje,
  runAllTests
};
