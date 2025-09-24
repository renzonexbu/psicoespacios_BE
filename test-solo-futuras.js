const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 'test-user-id'; // Reemplazar con un ID de usuario válido

async function testSoloFuturas() {
  try {
    console.log('🧪 Probando endpoint con parámetro soloFuturas...\n');

    // Test 1: Sin parámetro soloFuturas (comportamiento actual)
    console.log('1️⃣ Probando sin parámetro soloFuturas:');
    const response1 = await axios.get(`${BASE_URL}/api/v1/reservas-sesiones/usuario/${TEST_USER_ID}/sesiones`);
    console.log(`   ✅ Respuesta: ${response1.data.length} sesiones encontradas`);
    console.log(`   📅 Fechas: ${response1.data.map(r => r.fecha).join(', ')}\n`);

    // Test 2: Con soloFuturas=true
    console.log('2️⃣ Probando con soloFuturas=true:');
    const response2 = await axios.get(`${BASE_URL}/api/v1/reservas-sesiones/usuario/${TEST_USER_ID}/sesiones?soloFuturas=true`);
    console.log(`   ✅ Respuesta: ${response2.data.length} sesiones futuras encontradas`);
    console.log(`   📅 Fechas: ${response2.data.map(r => r.fecha).join(', ')}\n`);

    // Test 3: Con soloFuturas=false
    console.log('3️⃣ Probando con soloFuturas=false:');
    const response3 = await axios.get(`${BASE_URL}/api/v1/reservas-sesiones/usuario/${TEST_USER_ID}/sesiones?soloFuturas=false`);
    console.log(`   ✅ Respuesta: ${response3.data.length} sesiones encontradas`);
    console.log(`   📅 Fechas: ${response3.data.map(r => r.fecha).join(', ')}\n`);

    // Verificar que soloFuturas=true devuelve solo fechas >= hoy
    const hoy = new Date().toISOString().split('T')[0];
    const fechasFuturas = response2.data.map(r => r.fecha);
    const todasFuturas = fechasFuturas.every(fecha => fecha >= hoy);
    
    console.log('🔍 Verificación:');
    console.log(`   📅 Fecha actual: ${hoy}`);
    console.log(`   ✅ Todas las fechas son futuras: ${todasFuturas ? 'SÍ' : 'NO'}`);
    
    if (todasFuturas) {
      console.log('   🎉 ¡Test exitoso! El filtro soloFuturas funciona correctamente.');
    } else {
      console.log('   ❌ Error: Se encontraron fechas pasadas en el resultado.');
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
  }
}

// Ejecutar la prueba
testSoloFuturas();
