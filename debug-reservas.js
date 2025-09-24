// Script para debuggear las reservas
// Ejecutar con: node debug-reservas.js

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

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

async function debugReservas() {
  const boxId = '63ded203-3d25-4387-bb21-15ed2d994c5e';
  const fecha = '2025-08-04';
  
  log('🔍 Debuggeando reservas...', 'blue');
  log(`Box ID: ${boxId}`, 'cyan');
  log(`Fecha: ${fecha}`, 'cyan');
  
  try {
    // 1. Verificar disponibilidad con el endpoint
    log('\n📋 1. Probando endpoint de disponibilidad...', 'yellow');
    const disponibilidadResponse = await axios.get(
      `${API_BASE_URL}/boxes/reservations/box/${boxId}/availability/${fecha}`,
      {
        headers: {
          Authorization: 'Bearer YOUR_TOKEN_HERE' // Reemplazar con token válido
        }
      }
    );
    
    log('✅ Respuesta del endpoint:', 'green');
    console.log(JSON.stringify(disponibilidadResponse.data, null, 2));
    
    // 2. Verificar todas las reservas del box (sin filtro de fecha)
    log('\n📋 2. Probando endpoint de todas las reservas del box...', 'yellow');
    const reservasResponse = await axios.get(
      `${API_BASE_URL}/boxes/reservations/box/${boxId}`,
      {
        headers: {
          Authorization: 'Bearer YOUR_TOKEN_HERE' // Reemplazar con token válido
        }
      }
    );
    
    log('✅ Todas las reservas del box:', 'green');
    console.log(JSON.stringify(reservasResponse.data, null, 2));
    
    // 3. Verificar si hay reservas para la fecha específica
    log('\n📋 3. Filtrando reservas por fecha...', 'yellow');
    const reservasFecha = reservasResponse.data.filter(reserva => {
      const reservaFecha = new Date(reserva.fecha).toISOString().split('T')[0];
      return reservaFecha === fecha;
    });
    
    log(`📊 Reservas encontradas para ${fecha}:`, 'magenta');
    console.log(JSON.stringify(reservasFecha, null, 2));
    
    // 4. Verificar reservas confirmadas
    log('\n📋 4. Verificando reservas confirmadas...', 'yellow');
    const reservasConfirmadas = reservasFecha.filter(reserva => 
      reserva.estado === 'CONFIRMADA'
    );
    
    log(`📊 Reservas confirmadas para ${fecha}:`, 'magenta');
    console.log(JSON.stringify(reservasConfirmadas, null, 2));
    
    // 5. Análisis de fechas
    log('\n📋 5. Análisis de fechas...', 'yellow');
    reservasResponse.data.forEach((reserva, index) => {
      const fechaOriginal = new Date(reserva.fecha);
      const fechaISO = fechaOriginal.toISOString();
      const fechaLocal = fechaOriginal.toLocaleDateString();
      
      log(`Reserva ${index + 1}:`, 'cyan');
      log(`  - Fecha original: ${reserva.fecha}`, 'cyan');
      log(`  - Fecha ISO: ${fechaISO}`, 'cyan');
      log(`  - Fecha local: ${fechaLocal}`, 'cyan');
      log(`  - Estado: ${reserva.estado}`, 'cyan');
      log(`  - Box ID: ${reserva.boxId}`, 'cyan');
    });
    
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

// Ejecutar el debug
debugReservas(); 