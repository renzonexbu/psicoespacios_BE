const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuración
const API_BASE_URL = 'http://localhost:3000/api/v1';
const SIMULATE_ENDPOINTS = {
  payment: `${API_BASE_URL}/simulate/payment`,
  success: `${API_BASE_URL}/simulate/payment/success`,
  failed: `${API_BASE_URL}/simulate/payment/failed`,
  pending: `${API_BASE_URL}/simulate/payment/pending`,
  cancelled: `${API_BASE_URL}/simulate/payment/cancelled`,
  stats: `${API_BASE_URL}/simulate/stats`
};

// Función para obtener un usuario válido
async function getValidUserId() {
  try {
    console.log(`🔍 Buscando usuarios en: ${API_BASE_URL}/users`);
    const response = await axios.get(`${API_BASE_URL}/users`);
    if (response.data && response.data.length > 0) {
      const user = response.data[0];
      console.log(`✅ Usuario encontrado: ${user.nombre} ${user.apellido} (${user.email})`);
      return user.id;
    }
  } catch (error) {
    console.log('⚠️  No se pudo obtener usuarios de la API:', error.message);
  }
  return '5cafacfd-ff34-47fb-9b13-79038a53b93a';
}

// Función para obtener un psicólogo válido
async function getValidPsicologoId() {
  try {
    console.log(`🔍 Buscando psicólogos en: ${API_BASE_URL}/users`);
    const response = await axios.get(`${API_BASE_URL}/users`);
    const psicologosUsers = response.data.filter(user => user.role === 'PSICOLOGO');
    
    if (psicologosUsers.length > 0) {
      const psicologoUser = psicologosUsers[0];
      console.log(`✅ Psicólogo encontrado: ${psicologoUser.nombre} ${psicologoUser.apellido} (${psicologoUser.email})`);
      return psicologoUser.id; // Usar el userId del psicólogo
    }
  } catch (error) {
    console.log('⚠️  No se pudo obtener psicólogos de la API:', error.message);
  }
  return null;
}

// Datos de prueba
async function getTestData() {
  const userId = await getValidUserId();
  const psicologoId = await getValidPsicologoId();
  
  // Fecha de mañana a las 10:00 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  
  return {
    userId: userId,
    psicologoId: psicologoId,
    amount: 50000, // $50.000 CLP
    orderId: `SIM-${Date.now()}`, // ID único para la orden
    subject: 'Sesión de terapia - Simulación',
    tipo: 'SESION',
    fechaReserva: tomorrow.toISOString().split('T')[0], // YYYY-MM-DD
    horaReserva: '10:00',
    modalidad: 'presencial'
  };
}

async function testSimulatePayment() {
  console.log('🧪 Iniciando prueba de simulación de pago...\n');
  console.log(`🌐 API URL: ${API_BASE_URL}`);
  console.log(`🔧 Environment: Local Development\n`);
  
  try {
    // Obtener datos de prueba
    const testData = await getTestData();
    console.log('📋 Datos de prueba:');
    console.log(`   - User ID: ${testData.userId}`);
    console.log(`   - Psicólogo ID: ${testData.psicologoId || 'No especificado'}`);
    console.log(`   - Amount: $${testData.amount.toLocaleString('es-CL')} CLP`);
    console.log(`   - Order ID: ${testData.orderId}`);
    console.log(`   - Subject: ${testData.subject}`);
    console.log(`   - Tipo: ${testData.tipo}`);
    console.log(`   - Fecha Reserva: ${testData.fechaReserva}`);
    console.log(`   - Hora Reserva: ${testData.horaReserva}`);
    console.log(`   - Modalidad: ${testData.modalidad}\n`);
    
    // 1. Probar simulación exitosa
    console.log('1️⃣ Probando simulación de pago exitoso...');
    const successResponse = await axios.post(SIMULATE_ENDPOINTS.success, testData);
    
    console.log('✅ Simulación exitosa completada:');
    console.log(`   - Pago ID: ${successResponse.data.pago.id}`);
    console.log(`   - Estado: ${successResponse.data.pago.estado}`);
    console.log(`   - Monto: $${successResponse.data.pago.monto.toLocaleString('es-CL')} CLP`);
    console.log(`   - Reserva creada: ${successResponse.data.reserva ? 'Sí' : 'No'}`);
    if (successResponse.data.reserva) {
      console.log(`   - Reserva ID: ${successResponse.data.reserva.id}`);
      console.log(`   - Fecha: ${successResponse.data.reserva.fecha}`);
      console.log(`   - Hora: ${successResponse.data.reserva.hora}`);
      console.log(`   - Estado: ${successResponse.data.reserva.estado}`);
    }
    console.log(`   - Mensaje: ${successResponse.data.mensaje}\n`);
    
    // 2. Probar simulación fallida
    console.log('2️⃣ Probando simulación de pago fallido...');
    const failedResponse = await axios.post(SIMULATE_ENDPOINTS.failed, testData);
    
    console.log('❌ Simulación fallida completada:');
    console.log(`   - Pago ID: ${failedResponse.data.pago.id}`);
    console.log(`   - Estado: ${failedResponse.data.pago.estado}`);
    console.log(`   - Reserva creada: ${failedResponse.data.reserva ? 'Sí' : 'No'}`);
    console.log(`   - Mensaje: ${failedResponse.data.mensaje}\n`);
    
    // 3. Probar simulación pendiente
    console.log('3️⃣ Probando simulación de pago pendiente...');
    const pendingResponse = await axios.post(SIMULATE_ENDPOINTS.pending, testData);
    
    console.log('⏳ Simulación pendiente completada:');
    console.log(`   - Pago ID: ${pendingResponse.data.pago.id}`);
    console.log(`   - Estado: ${pendingResponse.data.pago.estado}`);
    console.log(`   - Reserva creada: ${pendingResponse.data.reserva ? 'Sí' : 'No'}`);
    console.log(`   - Mensaje: ${pendingResponse.data.mensaje}\n`);
    
    // 4. Consultar estadísticas
    console.log('4️⃣ Consultando estadísticas de simulaciones...');
    const statsResponse = await axios.get(SIMULATE_ENDPOINTS.stats);
    
    console.log('📊 Estadísticas de simulaciones:');
    console.log(`   - Total simulaciones: ${statsResponse.data.totalSimulaciones}`);
    console.log(`   - Simulaciones exitosas: ${statsResponse.data.simulacionesExitosas}`);
    console.log(`   - Simulaciones fallidas: ${statsResponse.data.simulacionesFallidas}`);
    console.log(`   - Tasa de éxito: ${statsResponse.data.tasaExito}\n`);
    
    // Guardar resultados
    const results = {
      testData,
      successResponse: successResponse.data,
      failedResponse: failedResponse.data,
      pendingResponse: pendingResponse.data,
      stats: statsResponse.data,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(__dirname, '../simulate-test-results.json'),
      JSON.stringify(results, null, 2)
    );
    
    console.log('📋 Resultados guardados en: simulate-test-results.json\n');
    
    // 5. Instrucciones para el usuario
    console.log('🎯 ENDPOINTS DISPONIBLES:');
    console.log(`   POST ${SIMULATE_ENDPOINTS.payment} - Simulación general`);
    console.log(`   POST ${SIMULATE_ENDPOINTS.success} - Pago exitoso`);
    console.log(`   POST ${SIMULATE_ENDPOINTS.failed} - Pago fallido`);
    console.log(`   POST ${SIMULATE_ENDPOINTS.pending} - Pago pendiente`);
    console.log(`   POST ${SIMULATE_ENDPOINTS.cancelled} - Pago cancelado`);
    console.log(`   GET ${SIMULATE_ENDPOINTS.stats} - Estadísticas\n`);
    
    console.log('💡 Tip: Puedes usar estos endpoints para probar diferentes escenarios');
    console.log('     sin necesidad de Flow. Las reservas se crean automáticamente');
    console.log('     cuando el pago es exitoso y se proporcionan datos de reserva.\n');
    
    return results;
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n💡 Posibles soluciones:');
      console.log('- Verifica que el userId existe en la base de datos');
      console.log('- Verifica que el psicologoId existe (si se proporciona)');
      console.log('- Asegúrate de que la API esté corriendo en puerto 3000');
      
      if (error.response?.data?.errors) {
        console.log('\n🔍 Errores de validación:');
        Object.entries(error.response.data.errors).forEach(([field, errors]) => {
          console.log(`   - ${field}: ${errors.join(', ')}`);
        });
      }
    }
    
    throw error;
  }
}

// Función para probar un escenario específico
async function testSpecificScenario(scenario, testData) {
  console.log(`🧪 Probando escenario: ${scenario}`);
  
  try {
    const response = await axios.post(SIMULATE_ENDPOINTS[scenario], testData);
    
    console.log(`✅ ${scenario} completado:`);
    console.log(`   - Pago ID: ${response.data.pago.id}`);
    console.log(`   - Estado: ${response.data.pago.estado}`);
    console.log(`   - Reserva: ${response.data.reserva ? 'Creada' : 'No creada'}`);
    console.log(`   - Mensaje: ${response.data.mensaje}\n`);
    
    return response.data;
    
  } catch (error) {
    console.error(`❌ Error en ${scenario}:`, error.response?.data || error.message);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'scenario' && args[1]) {
    // Modo escenario específico: node test-simulate-payment.js scenario success
    getTestData().then(testData => {
      testSpecificScenario(args[1], testData).catch(console.error);
    });
  } else {
    // Modo normal: probar todos los escenarios
    testSimulatePayment().catch(console.error);
  }
}

module.exports = { testSimulatePayment, testSpecificScenario }; 