// Script para verificar directamente la base de datos
// Ejecutar con: node debug-database.js

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

async function debugDatabase() {
  const boxId = '63ded203-3d25-4387-bb21-15ed2d994c5e';
  
  log('🔍 Debuggeando base de datos...', 'blue');
  log(`Box ID: ${boxId}`, 'cyan');
  
  try {
    // 1. Verificar si el box existe
    log('\n📋 1. Verificando si el box existe...', 'yellow');
    try {
      const boxResponse = await axios.get(
        `${API_BASE_URL}/boxes/${boxId}`,
        {
          headers: {
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YTY0OTQ2Mi0xMzQ5LTRkMGQtYmU5ZS1jNTM0MjIxZjBkODciLCJlbWFpbCI6ImFkbWluQHBzaWNvZXNwYWNpb3MuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU0NTExMjc1LCJleHAiOjE3NTQ1OTc2NzV9.o56NtwhVRfXw-jNJnGkoYVPz3C_RNnqaMErVkS4YZM8'
          }
        }
      );
      log('✅ Box encontrado:', 'green');
      console.log(JSON.stringify(boxResponse.data, null, 2));
    } catch (error) {
      log('❌ Box no encontrado:', 'red');
      log(`   Status: ${error.response?.status}`, 'red');
      log(`   Message: ${error.response?.data?.message || error.message}`, 'red');
    }
    
    // 2. Verificar todas las reservas (sin filtros)
    log('\n📋 2. Verificando todas las reservas...', 'yellow');
    try {
      const reservasResponse = await axios.get(
        `${API_BASE_URL}/boxes/reservations`,
        {
          headers: {
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YTY0OTQ2Mi0xMzQ5LTRkMGQtYmU5ZS1jNTM0MjIxZjBkODciLCJlbWFpbCI6ImFkbWluQHBzaWNvZXNwYWNpb3MuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU0NTExMjc1LCJleHAiOjE3NTQ1OTc2NzV9.o56NtwhVRfXw-jNJnGkoYVPz3C_RNnqaMErVkS4YZM8'
          }
        }
      );
      log(`✅ Total reservas encontradas: ${reservasResponse.data.length}`, 'green');
      
      if (reservasResponse.data.length > 0) {
        log('📋 Primeras 5 reservas:', 'cyan');
        reservasResponse.data.slice(0, 5).forEach((reserva, index) => {
          log(`  ${index + 1}. ID: ${reserva.id}`, 'cyan');
          log(`     Box ID: ${reserva.boxId}`, 'cyan');
          log(`     Fecha: ${reserva.fecha}`, 'cyan');
          log(`     Estado: ${reserva.estado}`, 'cyan');
        });
      }
    } catch (error) {
      log('❌ Error obteniendo reservas:', 'red');
      log(`   Status: ${error.response?.status}`, 'red');
      log(`   Message: ${error.response?.data?.message || error.message}`, 'red');
    }
    
    // 3. Verificar reservas del box específico
    log('\n📋 3. Verificando reservas del box específico...', 'yellow');
    try {
      const boxReservasResponse = await axios.get(
        `${API_BASE_URL}/boxes/reservations/box/${boxId}`,
        {
          headers: {
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YTY0OTQ2Mi0xMzQ5LTRkMGQtYmU5ZS1jNTM0MjIxZjBkODciLCJlbWFpbCI6ImFkbWluQHBzaWNvZXNwYWNpb3MuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU0NTExMjc1LCJleHAiOjE3NTQ1OTc2NzV9.o56NtwhVRfXw-jNJnGkoYVPz3C_RNnqaMErVkS4YZM8'
          }
        }
      );
      log(`✅ Reservas del box ${boxId}: ${boxReservasResponse.data.length}`, 'green');
      
      if (boxReservasResponse.data.length > 0) {
        log('📋 Reservas del box:', 'cyan');
        boxReservasResponse.data.forEach((reserva, index) => {
          log(`  ${index + 1}. ID: ${reserva.id}`, 'cyan');
          log(`     Fecha: ${reserva.fecha}`, 'cyan');
          log(`     Estado: ${reserva.estado}`, 'cyan');
          log(`     Horario: ${reserva.horaInicio} - ${reserva.horaFin}`, 'cyan');
        });
      } else {
        log('❌ No hay reservas para este box', 'red');
      }
    } catch (error) {
      log('❌ Error obteniendo reservas del box:', 'red');
      log(`   Status: ${error.response?.status}`, 'red');
      log(`   Message: ${error.response?.data?.message || error.message}`, 'red');
    }
    
    // 4. Verificar disponibilidad para diferentes fechas
    log('\n📋 4. Verificando disponibilidad para diferentes fechas...', 'yellow');
    const fechas = ['2024-01-14', '2024-02-14', '2025-08-04', '2025-01-01'];
    
    for (const fecha of fechas) {
      try {
        const disponibilidadResponse = await axios.get(
          `${API_BASE_URL}/boxes/reservations/box/${boxId}/availability/${fecha}`,
          {
            headers: {
              Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YTY0OTQ2Mi0xMzQ5LTRkMGQtYmU5ZS1jNTM0MjIxZjBkODciLCJlbWFpbCI6ImFkbWluQHBzaWNvZXNwYWNpb3MuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU0NTExMjc1LCJleHAiOjE3NTQ1OTc2NzV9.o56NtwhVRfXw-jNJnGkoYVPz3C_RNnqaMErVkS4YZM8'
            }
          }
        );
        log(`✅ ${fecha}: ${disponibilidadResponse.data.totalReservas} reservas, ${disponibilidadResponse.data.reservasConfirmadas} confirmadas`, 'green');
      } catch (error) {
        log(`❌ ${fecha}: Error - ${error.response?.data?.message || error.message}`, 'red');
      }
    }
    
  } catch (error) {
    log('\n❌ Error general:', 'red');
    log(`   Error: ${error.message}`, 'red');
    
    if (error.code === 'ECONNREFUSED') {
      log('\n💡 Asegúrate de que el servidor esté corriendo en http://127.0.0.1:3000', 'yellow');
    }
  }
}

// Ejecutar el debug
debugDatabase(); 