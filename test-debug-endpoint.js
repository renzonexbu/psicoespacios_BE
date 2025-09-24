// Script para probar el endpoint de debug
// Ejecutar con: node test-debug-endpoint.js

const axios = require('axios');

const API_BASE_URL = 'http://127.0.0.1:3000/api/v1';

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testDebugEndpoint() {
  const boxId = '63ded203-3d25-4387-bb21-15ed2d994c5e';
  const fecha = '2025-08-04';
  
  log('🔍 Probando endpoint de debug...', 'blue');
  log(`Box ID: ${boxId}`, 'cyan');
  log(`Fecha: ${fecha}`, 'cyan');
  
  try {
    // Probar el endpoint de debug
    const debugResponse = await axios.get(
      `${API_BASE_URL}/boxes/reservations/debug/box/${boxId}/fecha/${fecha}`,
      {
        headers: {
          Authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YTY0OTQ2Mi0xMzQ5LTRkMGQtYmU5ZS1jNTM0MjIxZjBkODciLCJlbWFpbCI6ImFkbWluQHBzaWNvZXNwYWNpb3MuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU0NTExMjc1LCJleHAiOjE3NTQ1OTc2NzV9.o56NtwhVRfXw-jNJnGkoYVPz3C_RNnqaMErVkS4YZM8' // Reemplazar con token válido
        }
      }
    );
    
    log('\n✅ Respuesta del debug:', 'green');
    console.log(JSON.stringify(debugResponse.data, null, 2));
    
    // Análisis de los resultados
    const data = debugResponse.data;
    
    log('\n📊 Análisis de resultados:', 'yellow');
    log(`Total reservas del box: ${data.todasLasReservas}`, 'cyan');
    log(`Reservas fecha exacta: ${data.reservasFechaExacta}`, 'cyan');
    log(`Reservas fecha string: ${data.reservasFechaString}`, 'cyan');
    log(`Reservas query builder: ${data.reservasQueryBuilder}`, 'cyan');
    log(`Fechas coincidentes: ${data.fechasCoincidentes.length}`, 'cyan');
    log(`Reservas confirmadas: ${data.reservasConfirmadas.length}`, 'cyan');
    
    // Mostrar reservas confirmadas
    if (data.reservasConfirmadas.length > 0) {
      log('\n📋 Reservas confirmadas encontradas:', 'green');
      data.reservasConfirmadas.forEach((reserva, index) => {
        log(`  ${index + 1}. ID: ${reserva.id}`, 'green');
        log(`     Estado: ${reserva.estado}`, 'green');
        log(`     Horario: ${reserva.horaInicio} - ${reserva.horaFin}`, 'green');
        log(`     Fecha: ${reserva.fechaString}`, 'green');
      });
    } else {
      log('\n❌ No se encontraron reservas confirmadas', 'red');
    }
    
    // Mostrar todas las reservas del box
    if (data.analisisFechas.length > 0) {
      log('\n📋 Todas las reservas del box:', 'yellow');
      data.analisisFechas.forEach((reserva, index) => {
        log(`  ${index + 1}. ID: ${reserva.id}`, 'cyan');
        log(`     Estado: ${reserva.estado}`, 'cyan');
        log(`     Fecha original: ${reserva.fechaOriginal}`, 'cyan');
        log(`     Fecha ISO: ${reserva.fechaISO}`, 'cyan');
        log(`     Fecha string: ${reserva.fechaString}`, 'cyan');
        log(`     Coincide con ${fecha}: ${reserva.coincideConFecha ? '✅' : '❌'}`, 'cyan');
      });
    }
    
  } catch (error) {
    log('\n❌ Error en el debug:', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Message: ${error.response.data?.message || error.message}`, 'red');
    } else {
      log(`   Error: ${error.message}`, 'red');
    }
    
    // Verificar si el servidor está corriendo
    if (error.code === 'ECONNREFUSED') {
      log('\n💡 Asegúrate de que el servidor esté corriendo en http://localhost:3000', 'yellow');
    }
  }
}

// Ejecutar el test
testDebugEndpoint(); 