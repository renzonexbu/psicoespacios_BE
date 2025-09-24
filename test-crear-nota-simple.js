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
    console.log(`🆔 ID: ${response.data.user.id}`);
    return psicologoToken;
  } catch (error) {
    console.error('❌ Error en login como PSICÓLOGO:', error.response?.data || error.message);
    throw error;
  }
}

// Test: Crear nota básica
async function testCrearNotaBasica() {
  try {
    console.log('\n--- Test: Crear nota básica ---');
    
    // Usar un ID de paciente de ejemplo (deberías reemplazarlo con un ID real)
    const pacienteId = '00000000-0000-0000-0000-000000000001';
    
    const notaData = {
      pacienteId: pacienteId,
      contenido: 'Esta es una nota de prueba para evaluar el progreso del paciente.',
      titulo: 'Nota de Evaluación Inicial',
      tipo: 'evaluacion',
      esPrivada: false,
      metadatos: {
        prioridad: 'media',
        estado: 'completada',
        tags: ['evaluacion', 'inicial']
      }
    };

    console.log('📝 Enviando request con datos:', JSON.stringify(notaData, null, 2));

    const response = await axios.post(`${BASE_URL}/api/v1/notas`, notaData, {
      headers: { 
        Authorization: `Bearer ${psicologoToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Nota creada exitosamente!');
    console.log(`📝 ID de la nota: ${response.data.id}`);
    console.log(`👤 Paciente: ${response.data.pacienteNombre}`);
    console.log(`📅 Creada: ${response.data.createdAt}`);
    console.log(`🔒 Privada: ${response.data.esPrivada}`);
    console.log(`🏷️ Tipo: ${response.data.tipo}`);
    
    console.log('\n📋 Respuesta completa:');
    console.log(JSON.stringify(response.data, null, 2));

    return true;
  } catch (error) {
    console.error('❌ Error creando nota:', error.response?.status || 'Sin respuesta');
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📋 Response:', error.response.data);
      
      if (error.response.status === 500) {
        console.log('\n💡 Error 500 - Probablemente problema en la base de datos');
        console.log('🔧 Ejecuta: node scripts/fix-notas-table.js');
      }
    } else {
      console.error('📋 Error:', error.message);
    }
    
    return false;
  }
}

// Función principal
async function runTest() {
  try {
    console.log('🚀 Iniciando test del endpoint de crear notas...\n');
    
    // 1. Login como psicólogo
    await loginAsPsicologo();
    
    // 2. Ejecutar test
    const success = await testCrearNotaBasica();
    
    if (success) {
      console.log('\n🎉 Test completado exitosamente!');
    } else {
      console.log('\n⚠️ Test falló');
    }
    
  } catch (error) {
    console.error('❌ Error en el test:', error.message);
  }
}

// Ejecutar test
runTest(); 