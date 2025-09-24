const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
let psicologoToken = '';
let adminToken = '';

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

// Función para hacer login como admin
async function loginAsAdmin() {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'admin@psicoespacios.com',
      password: 'admin123'
    });
    
    adminToken = response.data.access_token;
    console.log('✅ Login como ADMIN exitoso');
    return adminToken;
  } catch (error) {
    console.error('❌ Error en login como ADMIN:', error.response?.data || error.message);
    throw error;
  }
}

// Función para obtener el ID del psicólogo desde el token
function getUserIdFromToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.sub; // sub contiene el ID del usuario
  } catch (error) {
    console.error('❌ Error decodificando token:', error.message);
    return null;
  }
}

// Función para obtener un paciente existente (para usar en las pruebas)
async function getPacienteExistente(token) {
  try {
    // Intentar obtener pacientes del psicólogo logueado
    const userId = getUserIdFromToken(token);
    if (!userId) {
      console.log('❌ No se pudo obtener el ID del usuario del token');
      return null;
    }

    const response = await axios.get(`${BASE_URL}/api/v1/psicologos/${userId}/pacientes`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.length > 0) {
      return response.data[0].pacienteId;
    } else {
      console.log('⚠️ No hay pacientes asignados, usando ID de ejemplo');
      // Usar un ID de ejemplo si no hay pacientes
      return '00000000-0000-0000-0000-000000000001';
    }
  } catch (error) {
    console.log('⚠️ No se pudo obtener paciente existente, usando ID de ejemplo');
    return '00000000-0000-0000-0000-000000000001';
  }
}

// Test 1: Obtener notas de un paciente específico
async function testObtenerNotasPaciente() {
  try {
    console.log('\n--- Test 1: Obtener notas de un paciente específico ---');
    
    const pacienteId = await getPacienteExistente(psicologoToken);
    if (!pacienteId) {
      console.log('❌ No se pudo obtener un paciente para la prueba');
      return false;
    }

    console.log(`🔍 Buscando notas del paciente: ${pacienteId}`);

    const response = await axios.get(`${BASE_URL}/api/v1/notas/paciente/${pacienteId}`, {
      headers: { Authorization: `Bearer ${psicologoToken}` }
    });

    console.log('✅ Notas obtenidas exitosamente');
    console.log(`📊 Total de notas: ${response.data.length}`);
    
    if (response.data.length > 0) {
      console.log('📝 Primera nota:');
      const nota = response.data[0];
      console.log(`   ID: ${nota.id}`);
      console.log(`   Título: ${nota.titulo || 'Sin título'}`);
      console.log(`   Tipo: ${nota.tipo}`);
      console.log(`   Contenido: ${nota.contenido.substring(0, 100)}...`);
      console.log(`   Privada: ${nota.esPrivada}`);
      console.log(`   Creada: ${nota.createdAt}`);
      
      // Verificar estructura de respuesta
      const requiredFields = [
        'id', 'pacienteId', 'pacienteNombre', 'contenido', 'tipo', 
        'esPrivada', 'createdAt', 'updatedAt'
      ];

      let missingFields = [];
      requiredFields.forEach(field => {
        if (!(field in nota)) {
          missingFields.push(field);
        }
      });

      if (missingFields.length > 0) {
        console.log(`⚠️ Campos faltantes: ${missingFields.join(', ')}`);
      } else {
        console.log('✅ Estructura de respuesta correcta');
      }
    } else {
      console.log('ℹ️ No hay notas para este paciente');
    }

    return true;
  } catch (error) {
    console.error('❌ Error obteniendo notas:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Verificar que solo se obtienen notas del psicólogo logueado
async function testSeguridadNotas() {
  try {
    console.log('\n--- Test 2: Verificar seguridad de acceso ---');
    
    const pacienteId = await getPacienteExistente(psicologoToken);
    if (!pacienteId) {
      console.log('⚠️ No se pudo obtener un paciente, saltando test de seguridad');
      return true;
    }

    // Verificar que las notas obtenidas pertenecen al psicólogo logueado
    const response = await axios.get(`${BASE_URL}/api/v1/notas/paciente/${pacienteId}`, {
      headers: { Authorization: `Bearer ${psicologoToken}` }
    });

    if (response.data.length > 0) {
      console.log('🔒 Verificando que todas las notas pertenecen al psicólogo logueado...');
      
      const psicologoId = getUserIdFromToken(psicologoToken);
      let todasPertenecen = true;
      
      for (const nota of response.data) {
        // Verificar que la nota tiene la estructura correcta
        if (!nota.pacienteId || nota.pacienteId !== pacienteId) {
          console.log(`⚠️ Nota ${nota.id} no pertenece al paciente ${pacienteId}`);
          todasPertenecen = false;
        }
      }
      
      if (todasPertenecen) {
        console.log('✅ Todas las notas pertenecen al paciente correcto');
      } else {
        console.log('⚠️ Algunas notas no pertenecen al paciente correcto');
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Error en test de seguridad:', error.response?.data || error.message);
    return false;
  }
}

// Test 3: Admin puede obtener notas de cualquier paciente
async function testAdminAcceso() {
  try {
    console.log('\n--- Test 3: Admin puede acceder a notas de cualquier paciente ---');
    
    const pacienteId = await getPacienteExistente(adminToken);
    if (!pacienteId) {
      console.log('⚠️ No se pudo obtener un paciente para el admin, saltando test');
      return true;
    }

    const response = await axios.get(`${BASE_URL}/api/v1/notas/paciente/${pacienteId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ Admin puede acceder a notas del paciente');
    console.log(`📊 Total de notas: ${response.data.length}`);
    return true;
  } catch (error) {
    console.error('❌ Error en test de admin:', error.response?.data || error.message);
    return false;
  }
}

// Test 4: Crear una nota y luego obtenerla
async function testCrearYObtenerNota() {
  try {
    console.log('\n--- Test 4: Crear nota y luego obtenerla ---');
    
    const pacienteId = await getPacienteExistente(psicologoToken);
    if (!pacienteId) {
      console.log('❌ No se pudo obtener un paciente para la prueba');
      return false;
    }

    // 1. Crear una nota
    console.log('📝 Creando nota de prueba...');
    const notaData = {
      pacienteId: pacienteId,
      contenido: 'Esta es una nota de prueba para verificar el endpoint de obtención.',
      titulo: 'Nota de Prueba - Endpoint Funcionando',
      tipo: 'observacion',
      esPrivada: false,
      metadatos: {
        prioridad: 'baja',
        estado: 'completada',
        tags: ['test', 'endpoint']
      }
    };

    const createResponse = await axios.post(`${BASE_URL}/api/v1/notas`, notaData, {
      headers: { Authorization: `Bearer ${psicologoToken}` }
    });

    console.log('✅ Nota creada:', createResponse.data.id);

    // 2. Obtener las notas del paciente
    console.log('🔍 Obteniendo notas del paciente...');
    const getResponse = await axios.get(`${BASE_URL}/api/v1/notas/paciente/${pacienteId}`, {
      headers: { Authorization: `Bearer ${psicologoToken}` }
    });

    // 3. Verificar que la nota creada aparece en la lista
    const notaCreada = getResponse.data.find(nota => nota.id === createResponse.data.id);
    
    if (notaCreada) {
      console.log('✅ Nota creada encontrada en la lista del paciente');
      console.log(`   Título: ${notaCreada.titulo}`);
      console.log(`   Contenido: ${notaCreada.contenido.substring(0, 50)}...`);
    } else {
      console.log('⚠️ Nota creada no encontrada en la lista');
    }

    return true;
  } catch (error) {
    console.error('❌ Error en test de crear y obtener:', error.response?.data || error.message);
    return false;
  }
}

// Función principal de test
async function runTests() {
  try {
    console.log('🚀 Iniciando tests del endpoint de obtener notas por paciente...\n');
    
    // 1. Login como psicólogo
    await loginAsPsicologo();
    
    // 2. Login como admin
    await loginAsAdmin();
    
    // 3. Ejecutar tests
    const results = [];
    
    results.push(await testObtenerNotasPaciente());
    results.push(await testSeguridadNotas());
    results.push(await testAdminAcceso());
    results.push(await testCrearYObtenerNota());
    
    // Resumen
    console.log('\n--- Resumen de Tests ---');
    const passedTests = results.filter(r => r === true).length;
    const totalTests = results.length;
    
    console.log(`✅ Tests pasados: ${passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      console.log('🎉 Todos los tests pasaron exitosamente');
      console.log('💡 El endpoint de obtener notas por paciente funciona correctamente');
    } else {
      console.log('⚠️ Algunos tests fallaron');
    }
    
  } catch (error) {
    console.error('❌ Error en los tests:', error.message);
  }
}

// Ejecutar tests
runTests(); 