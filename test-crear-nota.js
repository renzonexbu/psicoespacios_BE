const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
let psicologoToken = '';
let adminToken = '';

// Función para hacer login como psicólogo
async function loginAsPsicologo() {
  try {
    // Ajusta estas credenciales según un usuario psicólogo existente
    const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'psicologo@psicoespacios.com', // Ajusta según tu email de psicólogo
      password: 'psicologo123' // Ajusta según tu contraseña
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
      password: 'admin123' // Ajusta según tu contraseña
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

// Test 1: Crear nota básica
async function testCrearNotaBasica() {
  try {
    console.log('\n--- Test 1: Crear nota básica ---');
    
    const pacienteId = await getPacienteExistente(psicologoToken);
    if (!pacienteId) {
      console.log('❌ No se pudo obtener un paciente para la prueba');
      return false;
    }

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

    const response = await axios.post(`${BASE_URL}/api/v1/notas`, notaData, {
      headers: { Authorization: `Bearer ${psicologoToken}` }
    });

    console.log('✅ Nota creada exitosamente');
    console.log(`📝 ID de la nota: ${response.data.id}`);
    console.log(`👤 Paciente: ${response.data.pacienteNombre}`);
    console.log(`📅 Creada: ${response.data.createdAt}`);
    console.log(`🔒 Privada: ${response.data.esPrivada}`);
    console.log(`🏷️ Tipo: ${response.data.tipo}`);

    // Verificar estructura de respuesta
    const requiredFields = [
      'id', 'pacienteId', 'pacienteNombre', 'contenido', 'titulo', 
      'tipo', 'esPrivada', 'createdAt', 'updatedAt'
    ];

    let missingFields = [];
    requiredFields.forEach(field => {
      if (!(field in response.data)) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      console.log(`⚠️ Campos faltantes: ${missingFields.join(', ')}`);
    } else {
      console.log('✅ Estructura de respuesta correcta');
    }

    return response.data.id; // Retornar ID para usar en otros tests
  } catch (error) {
    console.error('❌ Error creando nota básica:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Crear nota con datos mínimos
async function testCrearNotaMinima() {
  try {
    console.log('\n--- Test 2: Crear nota con datos mínimos ---');
    
    const pacienteId = await getPacienteExistente(psicologoToken);
    if (!pacienteId) {
      console.log('❌ No se pudo obtener un paciente para la prueba');
      return false;
    }

    const notaData = {
      pacienteId: pacienteId,
      contenido: 'Nota simple sin título ni metadatos.'
    };

    const response = await axios.post(`${BASE_URL}/api/v1/notas`, notaData, {
      headers: { Authorization: `Bearer ${psicologoToken}` }
    });

    console.log('✅ Nota mínima creada exitosamente');
    console.log(`📝 ID: ${response.data.id}`);
    console.log(`📝 Contenido: ${response.data.contenido}`);
    console.log(`🏷️ Tipo por defecto: ${response.data.tipo}`);
    console.log(`🔒 Privada por defecto: ${response.data.esPrivada}`);

    return true;
  } catch (error) {
    console.error('❌ Error creando nota mínima:', error.response?.data || error.message);
    return false;
  }
}

// Test 3: Crear nota privada
async function testCrearNotaPrivada() {
  try {
    console.log('\n--- Test 3: Crear nota privada ---');
    
    const pacienteId = await getPacienteExistente(psicologoToken);
    if (!pacienteId) {
      console.log('❌ No se pudo obtener un paciente para la prueba');
      return false;
    }

    const notaData = {
      pacienteId: pacienteId,
      contenido: 'Esta es una nota privada que solo puede ver el psicólogo.',
      titulo: 'Nota Privada - Observaciones Personales',
      tipo: 'observacion',
      esPrivada: true,
      metadatos: {
        prioridad: 'alta',
        estado: 'borrador',
        tags: ['privada', 'personal']
      }
    };

    const response = await axios.post(`${BASE_URL}/api/v1/notas`, notaData, {
      headers: { Authorization: `Bearer ${psicologoToken}` }
    });

    console.log('✅ Nota privada creada exitosamente');
    console.log(`📝 ID: ${response.data.id}`);
    console.log(`🔒 Privada: ${response.data.esPrivada}`);
    console.log(`🏷️ Tipo: ${response.data.tipo}`);

    return true;
  } catch (error) {
    console.error('❌ Error creando nota privada:', error.response?.data || error.message);
    return false;
  }
}

// Test 4: Crear nota con diferentes tipos
async function testCrearNotaDiferentesTipos() {
  try {
    console.log('\n--- Test 4: Crear notas con diferentes tipos ---');
    
    const pacienteId = await getPacienteExistente(psicologoToken);
    if (!pacienteId) {
      console.log('❌ No se pudo obtener un paciente para la prueba');
      return false;
    }

    const tiposNota = [
      { tipo: 'sesion', contenido: 'Nota de sesión terapéutica.' },
      { tipo: 'evaluacion', contenido: 'Evaluación del estado actual del paciente.' },
      { tipo: 'plan_tratamiento', contenido: 'Plan de tratamiento propuesto.' },
      { tipo: 'progreso', contenido: 'Nota de progreso del paciente.' },
      { tipo: 'otro', contenido: 'Nota de tipo otro.' }
    ];

    let notasCreadas = 0;
    for (const tipoNota of tiposNota) {
      try {
        const notaData = {
          pacienteId: pacienteId,
          contenido: tipoNota.contenido,
          titulo: `Nota de ${tipoNota.tipo}`,
          tipo: tipoNota.tipo
        };

        const response = await axios.post(`${BASE_URL}/api/v1/notas`, notaData, {
          headers: { Authorization: `Bearer ${psicologoToken}` }
        });

        console.log(`✅ Nota tipo '${tipoNota.tipo}' creada: ${response.data.id}`);
        notasCreadas++;
      } catch (error) {
        console.log(`⚠️ Error creando nota tipo '${tipoNota.tipo}': ${error.response?.data?.message || error.message}`);
      }
    }

    console.log(`📊 Total de notas creadas: ${notasCreadas}/${tiposNota.length}`);
    return notasCreadas === tiposNota.length;
  } catch (error) {
    console.error('❌ Error en test de diferentes tipos:', error.message);
    return false;
  }
}

// Test 5: Validar campos requeridos
async function testValidacionCamposRequeridos() {
  try {
    console.log('\n--- Test 5: Validar campos requeridos ---');
    
    // Test sin pacienteId
    try {
      await axios.post(`${BASE_URL}/api/v1/notas`, {
        contenido: 'Nota sin paciente'
      }, {
        headers: { Authorization: `Bearer ${psicologoToken}` }
      });
      console.log('❌ ERROR: Se pudo crear nota sin pacienteId (no debería pasar)');
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validación: No se puede crear nota sin pacienteId');
      } else {
        console.log(`⚠️ Error inesperado en validación: ${error.response?.status}`);
      }
    }

    // Test sin contenido
    try {
      const pacienteId = await getPacienteExistente(psicologoToken);
      await axios.post(`${BASE_URL}/api/v1/notas`, {
        pacienteId: pacienteId
      }, {
        headers: { Authorization: `Bearer ${psicologoToken}` }
      });
      console.log('❌ ERROR: Se pudo crear nota sin contenido (no debería pasar)');
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validación: No se puede crear nota sin contenido');
      } else {
        console.log(`⚠️ Error inesperado en validación: ${error.response?.status}`);
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Error en test de validación:', error.message);
    return false;
  }
}

// Test 6: Admin puede crear notas
async function testAdminPuedeCrearNotas() {
  try {
    console.log('\n--- Test 6: Admin puede crear notas ---');
    
    const pacienteId = await getPacienteExistente(adminToken);
    if (!pacienteId) {
      console.log('⚠️ No se pudo obtener un paciente para la prueba, saltando test');
      return true;
    }

    const notaData = {
      pacienteId: pacienteId,
      contenido: 'Nota creada por administrador.',
      titulo: 'Nota de Admin',
      tipo: 'observacion'
    };

    const response = await axios.post(`${BASE_URL}/api/v1/notas`, notaData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ Admin puede crear notas exitosamente');
    console.log(`📝 ID: ${response.data.id}`);
    console.log(`👤 Paciente: ${response.data.pacienteNombre}`);

    return true;
  } catch (error) {
    console.error('❌ Error en test de admin:', error.response?.data || error.message);
    return false;
  }
}

// Función principal de test
async function runTests() {
  try {
    console.log('🚀 Iniciando tests del endpoint de crear notas...\n');
    
    // 1. Login como psicólogo
    await loginAsPsicologo();
    
    // 2. Login como admin
    await loginAsAdmin();
    
    // 3. Ejecutar tests
    const results = [];
    
    results.push(await testCrearNotaBasica());
    results.push(await testCrearNotaMinima());
    results.push(await testCrearNotaPrivada());
    results.push(await testCrearNotaDiferentesTipos());
    results.push(await testValidacionCamposRequeridos());
    results.push(await testAdminPuedeCrearNotas());
    
    // Resumen
    console.log('\n--- Resumen de Tests ---');
    const passedTests = results.filter(r => r === true).length;
    const totalTests = results.length;
    
    console.log(`✅ Tests pasados: ${passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      console.log('🎉 Todos los tests pasaron exitosamente');
    } else {
      console.log('⚠️ Algunos tests fallaron');
    }
    
  } catch (error) {
    console.error('❌ Error en los tests:', error.message);
  }
}

// Ejecutar tests
runTests(); 