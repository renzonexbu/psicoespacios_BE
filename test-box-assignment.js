const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const JWT_TOKEN = 'TU_TOKEN_JWT_AQUI'; // Reemplazar con token válido

console.log('🧪 Probando endpoints de asignación automática de boxes...\n');

// Configurar headers con autenticación
const headers = {
  'Authorization': `Bearer ${JWT_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testBoxAssignment() {
  try {
    console.log('📋 1. Verificar disponibilidad de boxes en una sede...');
    
    // Endpoint: GET /api/v1/sedes/:sede_id/disponibilidad
    const sedeId = 'UUID-DE-LA-SEDE'; // Reemplazar con UUID real
    const fecha = '2025-08-28';
    const horaInicio = '09:00';
    const horaFin = '10:00';
    
    const disponibilidadUrl = `${BASE_URL}/api/v1/sedes/${sedeId}/disponibilidad?fecha=${fecha}&hora_inicio=${horaInicio}&hora_fin=${horaFin}`;
    
    console.log(`   URL: ${disponibilidadUrl}`);
    
    const disponibilidadResponse = await axios.get(disponibilidadUrl, { headers });
    
    console.log('✅ Disponibilidad verificada:');
    console.log(`   - Fecha: ${disponibilidadResponse.data.fecha}`);
    console.log(`   - Hora: ${disponibilidadResponse.data.horaInicio} - ${disponibilidadResponse.data.horaFin}`);
    console.log(`   - Boxes disponibles: ${disponibilidadResponse.data.total}`);
    
    if (disponibilidadResponse.data.boxesDisponibles.length > 0) {
      console.log('   - Primer box disponible:', disponibilidadResponse.data.boxesDisponibles[0].nombre);
    }
    
    console.log('\n📋 2. Asignar automáticamente un box...');
    
    // Endpoint: POST /api/v1/sedes/:sede_id/asignar-box
    const asignarBoxUrl = `${BASE_URL}/api/v1/sedes/${sedeId}/asignar-box`;
    const asignarBoxData = {
      fecha: fecha,
      horaInicio: horaInicio,
      horaFin: horaFin
    };
    
    console.log(`   URL: ${asignarBoxUrl}`);
    console.log(`   Body:`, JSON.stringify(asignarBoxData, null, 2));
    
    const asignarBoxResponse = await axios.post(asignarBoxUrl, asignarBoxData, { headers });
    
    console.log('✅ Box asignado automáticamente:');
    console.log(`   - Box: ${asignarBoxResponse.data.box.nombre}`);
    console.log(`   - Capacidad: ${asignarBoxResponse.data.box.capacidad}`);
    console.log(`   - Sede: ${asignarBoxResponse.data.sede.nombre}`);
    console.log(`   - Fecha: ${asignarBoxResponse.data.fecha}`);
    console.log(`   - Hora: ${asignarBoxResponse.data.horaInicio} - ${asignarBoxResponse.data.horaFin}`);
    
    console.log('\n📋 3. Ahora puedes usar este box en tu reserva de sesión...');
    console.log(`   - Box ID: ${asignarBoxResponse.data.box.id}`);
    console.log(`   - Sede ID: ${asignarBoxResponse.data.sede.id}`);
    
    // Ejemplo de cómo usar en la reserva de sesión
    const reservaSesionData = {
      psicologoId: 'UUID-DEL-PSICOLOGO',
      pacienteId: 'UUID-DEL-PACIENTE',
      fecha: fecha,
      horaInicio: horaInicio,
      horaFin: horaFin,
      modalidad: 'presencial',
      boxId: asignarBoxResponse.data.box.id, // Box asignado automáticamente
      observaciones: 'Sesión presencial con box asignado automáticamente'
    };
    
    console.log('\n📝 Ejemplo de reserva de sesión con box asignado:');
    console.log(JSON.stringify(reservaSesionData, null, 2));
    
  } catch (error) {
    console.error('❌ Error durante la prueba:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message || error.response.statusText}`);
      console.error(`   Details:`, error.response.data);
    } else {
      console.error(`   Error: ${error.message}`);
    }
  }
}

// Función para probar solo verificación de disponibilidad
async function testOnlyAvailability() {
  try {
    console.log('📋 Probando solo verificación de disponibilidad...');
    
    const sedeId = 'UUID-DE-LA-SEDE'; // Reemplazar con UUID real
    const fecha = '2025-08-28';
    const horaInicio = '09:00';
    const horaFin = '10:00';
    
    const url = `${BASE_URL}/api/v1/sedes/${sedeId}/disponibilidad?fecha=${fecha}&hora_inicio=${horaInicio}&hora_fin=${horaFin}`;
    
    console.log(`   URL: ${url}`);
    
    const response = await axios.get(url, { headers });
    
    console.log('✅ Respuesta:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Función para probar solo asignación automática
async function testOnlyAssignment() {
  try {
    console.log('📋 Probando solo asignación automática...');
    
    const sedeId = 'UUID-DE-LA-SEDE'; // Reemplazar con UUID real
    const data = {
      fecha: '2025-08-28',
      horaInicio: '09:00',
      horaFin: '10:00'
    };
    
    const url = `${BASE_URL}/api/v1/sedes/${sedeId}/asignar-box`;
    
    console.log(`   URL: ${url}`);
    console.log(`   Body:`, JSON.stringify(data, null, 2));
    
    const response = await axios.post(url, data, { headers });
    
    console.log('✅ Respuesta:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Ejecutar pruebas
if (process.argv.includes('--availability-only')) {
  testOnlyAvailability();
} else if (process.argv.includes('--assignment-only')) {
  testOnlyAssignment();
} else {
  testBoxAssignment();
}

module.exports = {
  testBoxAssignment,
  testOnlyAvailability,
  testOnlyAssignment
};



