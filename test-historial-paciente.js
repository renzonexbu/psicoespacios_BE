const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
let adminToken = '';

// Función para hacer login como admin
async function loginAsAdmin() {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'admin@psicoespacios.com',
      password: 'admin123'
    });
    
    adminToken = response.data.access_token;
    console.log('✅ Login como ADMIN exitoso');
    console.log(`👤 Usuario: ${response.data.user.nombre} ${response.data.user.apellido}`);
    console.log(`🔑 Rol: ${response.data.user.role}`);
    return adminToken;
  } catch (error) {
    console.error('❌ Error en login como ADMIN:', error.response?.data || error.message);
    throw error;
  }
}

// Test 1: Crear nuevo registro en historial
async function testCrearHistorial() {
  try {
    console.log('\n--- Test 1: Crear nuevo registro en historial ---');
    
    const historialData = {
      tipo: 'evaluacion_inicial',
      idUsuarioPaciente: '8038e306-f933-472f-a0ce-c69023cb87b2',
      descripcion: 'Evaluación inicial completada. Diagnóstico: Trastorno de Ansiedad Generalizada. Puntuación en escala de ansiedad: 28/40 (moderada).',
      url: 'https://psicoespacios.com/evaluaciones/eval-inicial-123'
    };

    console.log('📝 Enviando datos:', JSON.stringify(historialData, null, 2));

    const response = await axios.post(`${BASE_URL}/api/v1/gestion/historial-paciente`, historialData, {
      headers: { 
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Registro creado exitosamente!');
    console.log(`🆔 ID del registro: ${response.data.id}`);
    console.log(`📋 Tipo: ${response.data.tipo}`);
    console.log(`👤 Paciente: ${response.data.idUsuarioPaciente}`);
    console.log(`📝 Descripción: ${response.data.descripcion.substring(0, 100)}...`);
    
    return response.data.id;
  } catch (error) {
    console.error('❌ Error creando registro:', error.response?.data || error.message);
    return null;
  }
}

// Test 2: Crear registro sin URL (campo opcional)
async function testCrearHistorialSinUrl() {
  try {
    console.log('\n--- Test 2: Crear registro sin URL (campo opcional) ---');
    
    const historialData = {
      tipo: 'observacion_clinica',
      idUsuarioPaciente: '8038e306-f933-472f-a0ce-c69023cb87b2',
      descripcion: 'Paciente presenta mejoría en síntomas de ansiedad. Se redujo la frecuencia de ataques de pánico de 3 por semana a 1 por semana.'
    };

    console.log('📝 Enviando datos sin URL:', JSON.stringify(historialData, null, 2));

    const response = await axios.post(`${BASE_URL}/api/v1/gestion/historial-paciente`, historialData, {
      headers: { 
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Registro sin URL creado exitosamente!');
    console.log(`🆔 ID: ${response.data.id}`);
    console.log(`🔗 URL: ${response.data.url || 'null (opcional)'}`);
    
    return response.data.id;
  } catch (error) {
    console.error('❌ Error creando registro sin URL:', error.response?.data || error.message);
    return null;
  }
}

// Test 3: Crear registro de cambio de estado
async function testCrearCambioEstado() {
  try {
    console.log('\n--- Test 3: Crear registro de cambio de estado ---');
    
    const historialData = {
      tipo: 'cambio_estado',
      idUsuarioPaciente: '8038e306-f933-472f-a0ce-c69023cb87b2',
      descripcion: 'Paciente cambió de estado "EVALUACION" a "EN_TRATAMIENTO". Se aprobó plan de terapia de 12 sesiones.',
      url: null
    };

    console.log('📝 Enviando datos de cambio de estado:', JSON.stringify(historialData, null, 2));

    const response = await axios.post(`${BASE_URL}/api/v1/gestion/historial-paciente`, historialData, {
      headers: { 
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Registro de cambio de estado creado!');
    console.log(`🆔 ID: ${response.data.id}`);
    console.log(`🔄 Tipo: ${response.data.tipo}`);
    
    return response.data.id;
  } catch (error) {
    console.error('❌ Error creando registro de cambio de estado:', error.response?.data || error.message);
    return null;
  }
}

// Test 4: Obtener historial del paciente
async function testObtenerHistorialPaciente() {
  try {
    console.log('\n--- Test 4: Obtener historial del paciente ---');
    
    const pacienteId = '8038e306-f933-472f-a0ce-c69023cb87b2';
    console.log(`🔍 Obteniendo historial del paciente: ${pacienteId}`);

    const response = await axios.get(`${BASE_URL}/api/v1/gestion/historial-paciente/paciente/${pacienteId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ Historial obtenido exitosamente!');
    console.log(`📊 Total de registros: ${response.data.length}`);
    
    if (response.data.length > 0) {
      console.log('📋 Registros encontrados:');
      response.data.forEach((registro, index) => {
        console.log(`  ${index + 1}. [${registro.tipo}] ${registro.descripcion.substring(0, 80)}...`);
      });
    } else {
      console.log('ℹ️ No hay registros para este paciente');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error obteniendo historial:', error.response?.data || error.message);
    return false;
  }
}

// Test 5: Obtener registro específico por ID
async function testObtenerRegistroPorId(registroId) {
  try {
    console.log('\n--- Test 5: Obtener registro específico por ID ---');
    
    if (!registroId) {
      console.log('⚠️ No hay ID de registro para probar, saltando test');
      return true;
    }

    console.log(`🔍 Obteniendo registro con ID: ${registroId}`);

    const response = await axios.get(`${BASE_URL}/api/v1/gestion/historial-paciente/${registroId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ Registro obtenido exitosamente!');
    console.log(`📋 Detalles del registro:`);
    console.log(`   ID: ${response.data.id}`);
    console.log(`   Tipo: ${response.data.tipo}`);
    console.log(`   Paciente: ${response.data.idUsuarioPaciente}`);
    console.log(`   Descripción: ${response.data.descripcion}`);
    console.log(`   URL: ${response.data.url || 'null'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error obteniendo registro por ID:', error.response?.data || error.message);
    return false;
  }
}

// Test 6: Actualizar registro existente
async function testActualizarRegistro(registroId) {
  try {
    console.log('\n--- Test 6: Actualizar registro existente ---');
    
    if (!registroId) {
      console.log('⚠️ No hay ID de registro para probar, saltando test');
      return true;
    }

    const updateData = {
      descripcion: 'Descripción actualizada: Evaluación inicial completada con diagnóstico confirmado de Trastorno de Ansiedad Generalizada. Puntuación en escala de ansiedad: 28/40 (moderada). Se requiere tratamiento inmediato.',
      url: 'https://psicoespacios.com/evaluaciones/eval-inicial-123-actualizada'
    };

    console.log('📝 Actualizando registro con datos:', JSON.stringify(updateData, null, 2));

    const response = await axios.put(`${BASE_URL}/api/v1/gestion/historial-paciente/${registroId}`, updateData, {
      headers: { 
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Registro actualizado exitosamente!');
    console.log(`📝 Nueva descripción: ${response.data.descripcion.substring(0, 100)}...`);
    console.log(`🔗 Nueva URL: ${response.data.url}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error actualizando registro:', error.response?.data || error.message);
    return false;
  }
}

// Test 7: Obtener todos los registros
async function testObtenerTodosRegistros() {
  try {
    console.log('\n--- Test 7: Obtener todos los registros ---');

    const response = await axios.get(`${BASE_URL}/api/v1/gestion/historial-paciente`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ Todos los registros obtenidos exitosamente!');
    console.log(`📊 Total de registros en el sistema: ${response.data.length}`);
    
    if (response.data.length > 0) {
      console.log('📋 Últimos 3 registros:');
      response.data.slice(-3).forEach((registro, index) => {
        console.log(`  ${response.data.length - 2 + index}. [${registro.tipo}] ${registro.descripcion.substring(0, 60)}...`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error obteniendo todos los registros:', error.response?.data || error.message);
    return false;
  }
}

// Función principal de test
async function runTests() {
  try {
    console.log('🚀 Iniciando tests del endpoint de historial de paciente...\n');
    
    // 1. Login como admin
    await loginAsAdmin();
    
    // 2. Ejecutar tests
    const results = [];
    let registroId = null;
    
    // Test de creación
    registroId = await testCrearHistorial();
    results.push(registroId ? true : false);
    
    results.push(await testCrearHistorialSinUrl());
    results.push(await testCrearCambioEstado());
    
    // Test de consulta
    results.push(await testObtenerHistorialPaciente());
    results.push(await testObtenerRegistroPorId(registroId));
    
    // Test de actualización
    results.push(await testActualizarRegistro(registroId));
    
    // Test de consulta general
    results.push(await testObtenerTodosRegistros());
    
    // Resumen
    console.log('\n--- Resumen de Tests ---');
    const passedTests = results.filter(r => r === true).length;
    const totalTests = results.length;
    
    console.log(`✅ Tests pasados: ${passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      console.log('🎉 Todos los tests pasaron exitosamente');
      console.log('💡 El endpoint de historial de paciente funciona correctamente');
    } else {
      console.log('⚠️ Algunos tests fallaron');
    }
    
    // Mostrar endpoints disponibles
    console.log('\n📚 Endpoints Disponibles:');
    console.log('  POST   /api/v1/gestion/historial-paciente');
    console.log('  GET    /api/v1/gestion/historial-paciente');
    console.log('  GET    /api/v1/gestion/historial-paciente/:id');
    console.log('  PUT    /api/v1/gestion/historial-paciente/:id');
    console.log('  DELETE /api/v1/gestion/historial-paciente/:id');
    console.log('  GET    /api/v1/gestion/historial-paciente/paciente/:idUsuarioPaciente');
    
  } catch (error) {
    console.error('❌ Error en los tests:', error.message);
  }
}

// Ejecutar tests
runTests(); 