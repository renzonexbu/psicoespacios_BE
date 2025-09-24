const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuración dinámica basada en variables de entorno
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
const FLOW_ENDPOINTS = {
  crearOrden: `${API_BASE_URL}/flow/crear-orden`,
  status: `${API_BASE_URL}/flow/status`,
  pago: `${API_BASE_URL}/flow/pago`
};

// Función para obtener un usuario válido de la base de datos
async function getValidUserId() {
  try {
    console.log(`🔍 Buscando usuarios en: ${API_BASE_URL}/users`);
    
    // Intentar obtener usuarios de la API
    const response = await axios.get(`${API_BASE_URL}/users`);
    if (response.data && response.data.length > 0) {
      return response.data[0].id;
    }
  } catch (error) {
    console.log('⚠️  No se pudo obtener usuarios de la API:', error.message);
  }
  
  // Fallback: usar un ID de ejemplo (deberás reemplazarlo con uno válido)
  return '5cafacfd-ff34-47fb-9b13-79038a53b93a';
}

// Datos de prueba
async function getTestData() {
  const userId = await getValidUserId();
  
  return {
    userId: userId,
    amount: 50000, // $50.000 CLP
    orderId: `TEST-${Date.now()}`, // ID único para la orden
    subject: 'Sesión de terapia - Prueba',
    tipo: 'SESION' // Usar el enum correcto
  };
}

async function testFlowPayment() {
  console.log('🧪 Iniciando prueba de pago con Flow...\n');
  console.log(`🌐 API URL: ${API_BASE_URL}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  
  try {
    // Obtener datos de prueba
    const testData = await getTestData();
    console.log('📋 Datos de prueba:');
    console.log(`   - User ID: ${testData.userId}`);
    console.log(`   - Amount: $${testData.amount.toLocaleString('es-CL')} CLP`);
    console.log(`   - Order ID: ${testData.orderId}`);
    console.log(`   - Subject: ${testData.subject}`);
    console.log(`   - Tipo: ${testData.tipo}\n`);
    
    // 1. Crear orden de pago
    console.log('1️⃣ Creando orden de pago...');
    const orderResponse = await axios.post(FLOW_ENDPOINTS.crearOrden, testData);
    
    console.log('✅ Orden creada exitosamente:');
    console.log(`   - Flow Order: ${orderResponse.data.flowOrder}`);
    console.log(`   - Token: ${orderResponse.data.token}`);
    console.log(`   - URL de pago: ${orderResponse.data.url}`);
    console.log(`   - Pago ID: ${orderResponse.data.pagoId}\n`);
    
    // Guardar datos de la orden
    const orderData = {
      ...orderResponse.data,
      testData,
      apiUrl: API_BASE_URL,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(__dirname, '../flow-test-order.json'),
      JSON.stringify(orderData, null, 2)
    );
    
    console.log('📋 Datos de la orden guardados en: flow-test-order.json\n');
    
    // 2. Simular consulta de estado (opcional)
    console.log('2️⃣ Consultando estado del pago...');
    try {
      const statusResponse = await axios.get(`${FLOW_ENDPOINTS.status}/${orderResponse.data.flowOrder}`);
      console.log('✅ Estado del pago:');
      console.log(`   - Estado local: ${statusResponse.data.estadoLocal}`);
      console.log(`   - Estado Flow: ${statusResponse.data.estadoFlow}`);
      console.log(`   - Monto: $${statusResponse.data.monto.toLocaleString('es-CL')} CLP\n`);
    } catch (error) {
      console.log('⚠️  No se pudo consultar el estado (normal si el pago aún no se ha procesado)\n');
    }
    
    // 3. Instrucciones para el usuario
    console.log('🎯 PRÓXIMOS PASOS:');
    console.log('1. Abre la URL de pago en tu navegador:');
    console.log(`   ${orderResponse.data.url}\n`);
    
    console.log('2. Completa el pago en Flow (usa datos de prueba)');
    console.log('3. Flow enviará un webhook a tu callback URL');
    console.log('4. Verifica que el estado se actualice correctamente\n');
    
    console.log('📊 Para monitorear el webhook:');
    console.log(`   GET ${API_BASE_URL}/flow/status/${orderResponse.data.flowOrder}\n`);
    
    console.log('🔍 Para ver detalles del pago:');
    console.log(`   GET ${API_BASE_URL}/flow/pago/${orderResponse.data.pagoId}\n`);
    
    console.log('💡 Tip: Mantén esta terminal abierta y ejecuta las consultas de estado');
    console.log('     mientras completas el pago en Flow.\n');
    
    return orderResponse.data;
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n💡 Posibles soluciones:');
      console.log('- Verifica que el userId existe en la base de datos');
      console.log('- Asegúrate de que la API esté corriendo');
      console.log('- Revisa que las variables de entorno de Flow estén configuradas');
      console.log('- Verifica que el enum TipoPago tenga el valor correcto');
      
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

// Función para consultar estado en tiempo real
async function monitorPayment(flowOrder, interval = 5000) {
  console.log(`\n👀 Monitoreando pago: ${flowOrder}`);
  console.log(`   API URL: ${API_BASE_URL}`);
  console.log(`   Intervalo: ${interval/1000} segundos`);
  console.log('   Presiona Ctrl+C para detener\n');
  
  const monitor = setInterval(async () => {
    try {
      const response = await axios.get(`${FLOW_ENDPOINTS.status}/${flowOrder}`);
      const timestamp = new Date().toLocaleTimeString();
      
      console.log(`[${timestamp}] Estado: ${response.data.estadoLocal} | Flow: ${response.data.estadoFlow}`);
      
      // Si el pago se completó, detener el monitoreo
      if (response.data.estadoLocal === 'COMPLETADO') {
        console.log('\n🎉 ¡Pago completado exitosamente!');
        clearInterval(monitor);
        process.exit(0);
      }
      
    } catch (error) {
      console.log(`[${new Date().toLocaleTimeString()}] Error consultando estado: ${error.message}`);
    }
  }, interval);
  
  // Manejar cierre
  process.on('SIGINT', () => {
    clearInterval(monitor);
    console.log('\n🛑 Monitoreo detenido');
    process.exit(0);
  });
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'monitor' && args[1]) {
    // Modo monitoreo: node test-flow-payment.js monitor FLOW_ORDER_ID
    monitorPayment(args[1], parseInt(args[2]) || 5000);
  } else {
    // Modo normal: crear orden y mostrar instrucciones
    testFlowPayment().catch(console.error);
  }
}

module.exports = { testFlowPayment, monitorPayment }; 