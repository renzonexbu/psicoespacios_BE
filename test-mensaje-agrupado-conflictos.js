const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Token de autenticación (reemplazar con un token válido)
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testMensajeAgrupadoConflictos() {
  try {
    console.log('🧪 Probando mensaje agrupado de conflictos...\n');

    const packId = 'pack-id-aqui';
    const usuarioId = 'usuario-id-aqui';
    const boxId = 'box-id-aqui';

    // Horarios que probablemente tengan muchos conflictos (84 como mencionaste)
    const asignarPackData = {
      packId: packId,
      usuarioId: usuarioId,
      recurrente: true,
      fechaLimite: '2024-03-31', // 3 meses = ~84 días
      horarios: [
        {
          diaSemana: 1, // Lunes
          horaInicio: '09:00',
          horaFin: '10:00',
          boxId: boxId
        },
        {
          diaSemana: 1, // Lunes
          horaInicio: '10:00',
          horaFin: '11:00',
          boxId: boxId
        },
        {
          diaSemana: 2, // Martes
          horaInicio: '14:00',
          horaFin: '15:00',
          boxId: boxId
        }
      ]
    };

    console.log('📋 Datos de asignación (esperando muchos conflictos):');
    console.log(JSON.stringify(asignarPackData, null, 2));

    try {
      const response = await axios.post(`${BASE_URL}/packs/asignar`, asignarPackData, { headers });
      console.log('\n✅ Pack asignado (inesperado):');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('\n❌ Conflictos detectados:');
        console.log('=' .repeat(80));
        console.log('📊 INFORMACIÓN DEL ERROR:');
        console.log(`   Status Code: ${error.response.status}`);
        console.log(`   Total conflictos: ${error.response.data.totalConflictos}`);
        
        console.log('\n📋 MENSAJE AGRUPADO:');
        console.log('=' .repeat(80));
        console.log(error.response.data.message);
        console.log('=' .repeat(80));
        
        // Análisis del mensaje
        const mensaje = error.response.data.message;
        const lineas = mensaje.split('\n');
        console.log('\n📊 ANÁLISIS DEL MENSAJE AGRUPADO:');
        console.log(`   Total líneas: ${lineas.length}`);
        console.log(`   Total caracteres: ${mensaje.length}`);
        console.log(`   Contiene horarios agrupados: ${mensaje.includes('Horarios solicitados:') ? 'Sí' : 'No'}`);
        console.log(`   Contiene horarios ocupados: ${mensaje.includes('Horarios ocupados:') ? 'Sí' : 'No'}`);
        console.log(`   Contiene psicólogos: ${mensaje.includes('Psicólogos:') ? 'Sí' : 'No'}`);
        console.log(`   Contiene rango de fechas: ${mensaje.includes('Fechas:') ? 'Sí' : 'No'}`);
        
        // Contar grupos
        const grupos = mensaje.match(/\d+\.\s+\w+\s+en\s+Box/g) || [];
        console.log(`   Número de grupos: ${grupos.length}`);
        
        // Verificar que no se repiten horarios individuales
        const horariosIndividuales = mensaje.match(/\d{2}:\d{2}\s+-\s+\d{2}:\d{2}/g) || [];
        console.log(`   Horarios individuales mencionados: ${horariosIndividuales.length}`);
        
      } else {
        console.error('❌ Error inesperado:', error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
  }
}

async function testSimulacionMensajeAgrupado() {
  try {
    console.log('\n🧪 Simulando mensaje agrupado con datos de ejemplo...\n');

    // Simular 84 conflictos como mencionaste
    const conflictosSimulados = [];
    
    // Generar conflictos para 3 meses (84 días) en diferentes días de la semana
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const horarios = ['09:00 - 10:00', '10:00 - 11:00', '14:00 - 15:00'];
    const psicologos = ['Dr. Juan Pérez', 'Dra. María García', 'Dr. Carlos López'];
    
    let fecha = new Date();
    let contador = 0;
    
    // Generar conflictos para 84 días
    for (let i = 0; i < 84 && contador < 84; i++) {
      fecha.setDate(fecha.getDate() + 1);
      const diaSemana = diasSemana[i % diasSemana.length];
      const horario = horarios[i % horarios.length];
      const psicologo = psicologos[i % psicologos.length];
      
      conflictosSimulados.push({
        fecha: fecha.toISOString().split('T')[0],
        diaSemana: diaSemana,
        boxId: 'box-1',
        boxNombre: 'Box 1',
        horarioSolicitado: horario,
        horarioExistente: horario,
        psicologoExistente: {
          nombre: psicologo,
          email: `${psicologo.toLowerCase().replace(/\s+/g, '.')}@email.com`
        }
      });
      contador++;
    }

    // Simular el método generarMensajeConflictos mejorado
    function generarMensajeConflictosAgrupado(conflictos) {
      if (conflictos.length === 0) return '';

      let mensaje = `Existen ${conflictos.length} conflicto${conflictos.length > 1 ? 's' : ''} de reservas:\n\n`;
      
      // Agrupar conflictos por día de la semana y box para mejor legibilidad
      const conflictosAgrupados = {};
      
      conflictos.forEach(conflicto => {
        const clave = `${conflicto.diaSemana}-${conflicto.boxId}`;
        if (!conflictosAgrupados[clave]) {
          conflictosAgrupados[clave] = {
            diaSemana: conflicto.diaSemana,
            boxNombre: conflicto.boxNombre,
            horariosSolicitados: new Set(),
            horariosExistentes: new Set(),
            psicologos: new Set(),
            fechas: new Set()
          };
        }
        
        conflictosAgrupados[clave].horariosSolicitados.add(conflicto.horarioSolicitado);
        conflictosAgrupados[clave].horariosExistentes.add(conflicto.horarioExistente);
        conflictosAgrupados[clave].psicologos.add(conflicto.psicologoExistente.nombre);
        conflictosAgrupados[clave].fechas.add(conflicto.fecha);
      });

      // Generar mensaje agrupado
      Object.values(conflictosAgrupados).forEach((grupo, index) => {
        mensaje += `${index + 1}. ${grupo.diaSemana} en Box "${grupo.boxNombre}":\n`;
        
        // Mostrar horarios solicitados
        const horariosSolicitados = Array.from(grupo.horariosSolicitados).sort();
        mensaje += `   Horarios solicitados: ${horariosSolicitados.join(', ')}\n`;
        
        // Mostrar horarios existentes
        const horariosExistentes = Array.from(grupo.horariosExistentes).sort();
        mensaje += `   Horarios ocupados: ${horariosExistentes.join(', ')}\n`;
        
        // Mostrar psicólogos involucrados
        const psicologos = Array.from(grupo.psicologos);
        mensaje += `   Psicólogos: ${psicologos.join(', ')}\n`;
        
        // Mostrar rango de fechas afectadas
        const fechas = Array.from(grupo.fechas).sort();
        if (fechas.length === 1) {
          mensaje += `   Fecha: ${fechas[0]}\n`;
        } else {
          mensaje += `   Fechas: ${fechas[0]} a ${fechas[fechas.length - 1]} (${fechas.length} fechas)\n`;
        }
        
        mensaje += '\n';
      });

      mensaje += 'Por favor, ajuste los horarios solicitados para evitar estos conflictos.';
      
      return mensaje;
    }

    const mensajeGenerado = generarMensajeConflictosAgrupado(conflictosSimulados);
    
    console.log('📋 MENSAJE AGRUPADO GENERADO:');
    console.log('=' .repeat(80));
    console.log(mensajeGenerado);
    console.log('=' .repeat(80));
    
    console.log('\n📊 ANÁLISIS DEL FORMATO AGRUPADO:');
    console.log(`   Total conflictos simulados: ${conflictosSimulados.length}`);
    console.log(`   Longitud del mensaje: ${mensajeGenerado.length} caracteres`);
    console.log(`   Número de líneas: ${mensajeGenerado.split('\n').length}`);
    
    // Contar grupos
    const grupos = mensajeGenerado.match(/\d+\.\s+\w+\s+en\s+Box/g) || [];
    console.log(`   Número de grupos: ${grupos.length}`);
    
    // Verificar eficiencia
    const horariosIndividuales = mensajeGenerado.match(/\d{2}:\d{2}\s+-\s+\d{2}:\d{2}/g) || [];
    console.log(`   Horarios individuales mencionados: ${horariosIndividuales.length}`);
    console.log(`   Reducción de información: ${conflictosSimulados.length} → ${grupos.length} grupos`);
    console.log(`   Eficiencia: ${Math.round((1 - grupos.length / conflictosSimulados.length) * 100)}% menos información`);

  } catch (error) {
    console.error('❌ Error en la simulación:', error.message);
  }
}

async function testComparacionFormatos() {
  try {
    console.log('\n🧪 Comparando formato anterior vs nuevo formato...\n');

    const conflictosEjemplo = [
      {
        fecha: '2024-01-22',
        diaSemana: 'Lunes',
        boxId: 'box-1',
        boxNombre: 'Box 1',
        horarioSolicitado: '09:00 - 10:00',
        horarioExistente: '09:00 - 10:00',
        psicologoExistente: { nombre: 'Dr. Juan Pérez' }
      },
      {
        fecha: '2024-01-22',
        diaSemana: 'Lunes',
        boxId: 'box-1',
        boxNombre: 'Box 1',
        horarioSolicitado: '10:00 - 11:00',
        horarioExistente: '10:30 - 11:30',
        psicologoExistente: { nombre: 'Dra. María García' }
      },
      {
        fecha: '2024-01-29',
        diaSemana: 'Lunes',
        boxId: 'box-1',
        boxNombre: 'Box 1',
        horarioSolicitado: '09:00 - 10:00',
        horarioExistente: '09:00 - 10:00',
        psicologoExistente: { nombre: 'Dr. Juan Pérez' }
      },
      {
        fecha: '2024-01-23',
        diaSemana: 'Martes',
        boxId: 'box-2',
        boxNombre: 'Box 2',
        horarioSolicitado: '14:00 - 15:00',
        horarioExistente: '14:00 - 15:00',
        psicologoExistente: { nombre: 'Dr. Carlos López' }
      }
    ];

    // Formato anterior (individual)
    function formatoAnterior(conflictos) {
      let mensaje = `Existen ${conflictos.length} conflictos de reservas:\n\n`;
      conflictos.forEach((conflicto, index) => {
        mensaje += `📅 ${conflicto.fecha} (${conflicto.diaSemana}):\n`;
        mensaje += `   ${index + 1}. Box "${conflicto.boxNombre}" - `;
        mensaje += `Horario solicitado: ${conflicto.horarioSolicitado} `;
        mensaje += `conflicta con horario existente: ${conflicto.horarioExistente} `;
        mensaje += `(Psicólogo: ${conflicto.psicologoExistente.nombre})\n\n`;
      });
      mensaje += 'Por favor, ajuste los horarios solicitados para evitar estos conflictos.';
      return mensaje;
    }

    // Formato nuevo (agrupado)
    function formatoNuevo(conflictos) {
      let mensaje = `Existen ${conflictos.length} conflictos de reservas:\n\n`;
      
      const conflictosAgrupados = {};
      conflictos.forEach(conflicto => {
        const clave = `${conflicto.diaSemana}-${conflicto.boxId}`;
        if (!conflictosAgrupados[clave]) {
          conflictosAgrupados[clave] = {
            diaSemana: conflicto.diaSemana,
            boxNombre: conflicto.boxNombre,
            horariosSolicitados: new Set(),
            horariosExistentes: new Set(),
            psicologos: new Set(),
            fechas: new Set()
          };
        }
        
        conflictosAgrupados[clave].horariosSolicitados.add(conflicto.horarioSolicitado);
        conflictosAgrupados[clave].horariosExistentes.add(conflicto.horarioExistente);
        conflictosAgrupados[clave].psicologos.add(conflicto.psicologoExistente.nombre);
        conflictosAgrupados[clave].fechas.add(conflicto.fecha);
      });

      Object.values(conflictosAgrupados).forEach((grupo, index) => {
        mensaje += `${index + 1}. ${grupo.diaSemana} en Box "${grupo.boxNombre}":\n`;
        mensaje += `   Horarios solicitados: ${Array.from(grupo.horariosSolicitados).sort().join(', ')}\n`;
        mensaje += `   Horarios ocupados: ${Array.from(grupo.horariosExistentes).sort().join(', ')}\n`;
        mensaje += `   Psicólogos: ${Array.from(grupo.psicologos).join(', ')}\n`;
        
        const fechas = Array.from(grupo.fechas).sort();
        if (fechas.length === 1) {
          mensaje += `   Fecha: ${fechas[0]}\n`;
        } else {
          mensaje += `   Fechas: ${fechas[0]} a ${fechas[fechas.length - 1]} (${fechas.length} fechas)\n`;
        }
        mensaje += '\n';
      });

      mensaje += 'Por favor, ajuste los horarios solicitados para evitar estos conflictos.';
      return mensaje;
    }

    const mensajeAnterior = formatoAnterior(conflictosEjemplo);
    const mensajeNuevo = formatoNuevo(conflictosEjemplo);

    console.log('📋 FORMATO ANTERIOR (Individual):');
    console.log('=' .repeat(60));
    console.log(mensajeAnterior);
    console.log('=' .repeat(60));
    console.log(`Caracteres: ${mensajeAnterior.length}, Líneas: ${mensajeAnterior.split('\n').length}`);

    console.log('\n📋 FORMATO NUEVO (Agrupado):');
    console.log('=' .repeat(60));
    console.log(mensajeNuevo);
    console.log('=' .repeat(60));
    console.log(`Caracteres: ${mensajeNuevo.length}, Líneas: ${mensajeNuevo.split('\n').length}`);

    console.log('\n📊 COMPARACIÓN:');
    console.log(`   Reducción de caracteres: ${mensajeAnterior.length - mensajeNuevo.length} caracteres`);
    console.log(`   Reducción de líneas: ${mensajeAnterior.split('\n').length - mensajeNuevo.split('\n').length} líneas`);
    console.log(`   Porcentaje de reducción: ${Math.round((1 - mensajeNuevo.length / mensajeAnterior.length) * 100)}%`);

  } catch (error) {
    console.error('❌ Error en la comparación:', error.message);
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🚀 Iniciando pruebas de mensaje agrupado de conflictos\n');
  console.log('=' .repeat(80));
  
  try {
    await testMensajeAgrupadoConflictos();
    await testSimulacionMensajeAgrupado();
    await testComparacionFormatos();
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('✅ Pruebas completadas');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testMensajeAgrupadoConflictos,
  testSimulacionMensajeAgrupado,
  testComparacionFormatos,
  runAllTests
};
