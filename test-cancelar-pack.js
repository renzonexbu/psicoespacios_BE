const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Token de autenticación (reemplazar con un token válido)
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testCancelarPack() {
  try {
    console.log('🧪 Probando endpoint de cancelar pack...\n');

    // Primero, obtener packs de un usuario para tener un asignacionId válido
    console.log('📋 Obteniendo packs de usuario...');
    const usuarioId = 'usuario-id-aqui'; // Reemplazar con un ID válido
    
    try {
      const packsResponse = await axios.get(`${BASE_URL}/packs/usuario/${usuarioId}`, { headers });
      console.log('✅ Packs obtenidos:', JSON.stringify(packsResponse.data, null, 2));
      
      if (packsResponse.data.packs && packsResponse.data.packs.length > 0) {
        const asignacionId = packsResponse.data.packs[0].asignacionId;
        console.log(`📦 Usando asignación ID: ${asignacionId}`);
        
        // Ahora probar el endpoint de cancelar pack
        console.log('\n🚫 Cancelando pack...');
        const cancelResponse = await axios.put(`${BASE_URL}/packs/cancelar`, {
          asignacionId: asignacionId
        }, { headers });
        
        console.log('✅ Pack cancelado exitosamente:');
        console.log(JSON.stringify(cancelResponse.data, null, 2));
        
        // Verificar que el pack aparece como cancelado
        console.log('\n🔍 Verificando estado del pack...');
        const verifyResponse = await axios.get(`${BASE_URL}/packs/usuario/${usuarioId}`, { headers });
        const packCancelado = verifyResponse.data.packs.find(p => p.asignacionId === asignacionId);
        
        if (packCancelado) {
          console.log(`📊 Estado del pack: ${packCancelado.estado}`);
          console.log(`📅 Fecha de asignación: ${packCancelado.fechaAsignacion}`);
        }
        
      } else {
        console.log('❌ No se encontraron packs para el usuario');
      }
      
    } catch (error) {
      console.log('❌ Error al obtener packs:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
  }
}

async function testCancelarPackConDatosFicticios() {
  try {
    console.log('\n🧪 Probando endpoint con datos ficticios...\n');
    
    const asignacionIdFicticio = '123e4567-e89b-12d3-a456-426614174000';
    
    console.log('🚫 Intentando cancelar pack con ID ficticio...');
    const response = await axios.put(`${BASE_URL}/packs/cancelar`, {
      asignacionId: asignacionIdFicticio
    }, { headers });
    
    console.log('✅ Respuesta:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error esperado (pack no encontrado):', error.response?.data || error.message);
  }
}

async function testValidaciones() {
  try {
    console.log('\n🧪 Probando validaciones...\n');
    
    // Test 1: Sin asignacionId
    console.log('📝 Test 1: Sin asignacionId');
    try {
      await axios.put(`${BASE_URL}/packs/cancelar`, {}, { headers });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }
    
    // Test 2: AsignacionId inválido
    console.log('\n📝 Test 2: AsignacionId inválido');
    try {
      await axios.put(`${BASE_URL}/packs/cancelar`, {
        asignacionId: 'invalid-uuid'
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
  console.log('🚀 Iniciando pruebas del endpoint cancelar pack\n');
  console.log('=' .repeat(50));
  
  await testCancelarPack();
  await testCancelarPackConDatosFicticios();
  await testValidaciones();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Pruebas completadas');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testCancelarPack,
  testCancelarPackConDatosFicticios,
  testValidaciones,
  runAllTests
};
