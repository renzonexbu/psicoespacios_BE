const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
let psicologoToken = '';

// Función para hacer login como psicólogo
async function loginAsPsicologo() {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'psicologo@psicoespacios.com',
      password: 'psicologo123'
    });
    
    psicologoToken = response.data.access_token;
    console.log('✅ Login como PSICÓLOGO exitoso');
    console.log(`👤 Usuario: ${response.data.user.nombre} ${response.data.user.apellido}`);
    console.log(`🔑 Rol: ${response.data.user.role}`);
    return psicologoToken;
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
    throw error;
  }
}

// Test rápido: Crear nota básica
async function testCrearNota() {
  try {
    console.log('\n📝 Probando crear nota...');
    
    const notaData = {
      pacienteId: '00000000-0000-0000-0000-000000000001', // ID de ejemplo
      contenido: 'Nota de prueba - endpoint funcionando correctamente.',
      titulo: 'Test - Endpoint Funcionando',
      tipo: 'observacion',
      esPrivada: false,
      metadatos: {
        prioridad: 'baja',
        estado: 'completada',
        tags: ['test', 'funcionando']
      }
    };

    console.log('📤 Enviando request...');
    const response = await axios.post(`${BASE_URL}/api/v1/notas`, notaData, {
      headers: { 
        Authorization: `Bearer ${psicologoToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('🎉 ¡ÉXITO! Nota creada correctamente');
    console.log(`📝 ID: ${response.data.id}`);
    console.log(`👤 Paciente: ${response.data.pacienteNombre}`);
    console.log(`🔒 Privada: ${response.data.esPrivada}`);
    console.log(`🏷️ Tipo: ${response.data.tipo}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error creando nota:', error.response?.status || 'Sin respuesta');
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📋 Response:', error.response.data);
    } else {
      console.error('📋 Error:', error.message);
    }
    
    return false;
  }
}

// Función principal
async function runTest() {
  try {
    console.log('🚀 Test rápido del endpoint de notas...\n');
    
    await loginAsPsicologo();
    const success = await testCrearNota();
    
    if (success) {
      console.log('\n🎉 ¡Endpoint funcionando correctamente!');
      console.log('💡 La entidad TypeORM está mapeada correctamente');
    } else {
      console.log('\n⚠️ Endpoint aún tiene problemas');
    }
    
  } catch (error) {
    console.error('❌ Error en el test:', error.message);
  }
}

// Ejecutar test
runTest(); 