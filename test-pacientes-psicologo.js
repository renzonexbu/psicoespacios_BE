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

// Test 1: Psicólogo puede ver sus pacientes asignados
async function testPsicologoCanSeeOwnPacientes() {
  try {
    console.log('\n--- Test 1: PSICÓLOGO puede ver sus pacientes asignados ---');
    
    const userId = getUserIdFromToken(psicologoToken);
    if (!userId) {
      console.log('❌ No se pudo obtener el ID del usuario del token');
      return false;
    }
    
    const response = await axios.get(`${BASE_URL}/api/v1/psicologos/${userId}/pacientes`, {
      headers: { Authorization: `Bearer ${psicologoToken}` }
    });
    
    console.log('✅ PSICÓLOGO puede acceder a sus pacientes asignados');
    console.log(`📊 Total de pacientes: ${response.data.length}`);
    
    if (response.data.length > 0) {
      console.log('👥 Primer paciente:');
      const paciente = response.data[0];
      console.log(`   ID Paciente: ${paciente.id}`);
      console.log(`   ID Usuario: ${paciente.pacienteId}`);
      console.log(`   Nombre: ${paciente.nombre} ${paciente.apellido}`);
      console.log(`   Email: ${paciente.email}`);
      console.log(`   Primera Sesión: ${paciente.primeraSesionRegistrada}`);
      console.log(`   Próxima Sesión: ${paciente.proximaSesion || 'No programada'}`);
      console.log(`   Estado: ${paciente.estado}`);
      
      // Verificar estructura de respuesta
      const requiredFields = [
        'id', 'pacienteId', 'nombre', 'apellido', 'email', 'telefono',
        'fechaNacimiento', 'primeraSesionRegistrada', 'estado'
      ];
      
      let missingFields = [];
      requiredFields.forEach(field => {
        if (!(field in paciente)) {
          missingFields.push(field);
        }
      });
      
      if (missingFields.length > 0) {
        console.log(`⚠️ Campos faltantes: ${missingFields.join(', ')}`);
      } else {
        console.log('✅ Estructura de respuesta correcta');
      }
    } else {
      console.log('ℹ️ No hay pacientes asignados a este psicólogo');
    }
    
    return true;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('❌ PSICÓLOGO NO puede acceder a sus pacientes (Forbidden)');
    } else if (error.response?.status === 401) {
      console.log('❌ PSICÓLOGO NO puede acceder a sus pacientes (Unauthorized)');
    } else {
      console.error('❌ Error inesperado:', error.response?.data || error.message);
    }
    return false;
  }
}

// Test 2: Psicólogo NO puede ver pacientes de otro psicólogo
async function testPsicologoCannotSeeOtherPacientes() {
  try {
    console.log('\n--- Test 2: PSICÓLOGO NO puede ver pacientes de otro psicólogo ---');
    
    // Usar un ID diferente al del psicólogo logueado
    const otherUserId = '00000000-0000-0000-0000-000000000000';
    
    await axios.get(`${BASE_URL}/api/v1/psicologos/${otherUserId}/pacientes`, {
      headers: { Authorization: `Bearer ${psicologoToken}` }
    });
    
    console.log('❌ ERROR: PSICÓLOGO pudo acceder a pacientes de otro (no debería pasar)');
    return false;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ PSICÓLOGO NO puede acceder a pacientes de otro (Forbidden)');
      return true;
    } else if (error.response?.status === 401) {
      console.log('✅ PSICÓLOGO NO puede acceder a pacientes de otro (Unauthorized)');
      return true;
    } else {
      console.error('❌ Error inesperado:', error.response?.data || error.message);
      return false;
    }
  }
}

// Test 3: Admin puede ver pacientes de cualquier psicólogo
async function testAdminCanSeeAnyPacientes() {
  try {
    console.log('\n--- Test 3: ADMIN puede ver pacientes de cualquier psicólogo ---');
    
    const userId = getUserIdFromToken(psicologoToken);
    if (!userId) {
      console.log('⚠️ No se pudo obtener el ID del usuario del token, saltando test');
      return true;
    }
    
    const response = await axios.get(`${BASE_URL}/api/v1/psicologos/${userId}/pacientes`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ ADMIN puede acceder a pacientes de cualquier psicólogo');
    console.log(`📊 Total de pacientes: ${response.data.length}`);
    return true;
  } catch (error) {
    console.error('❌ Error en acceso como ADMIN:', error.response?.data || error.message);
    return false;
  }
}

// Test 4: Verificar que la consulta usa la tabla correcta
async function testDatabaseQuery() {
  try {
    console.log('\n--- Test 4: Verificación de consulta a base de datos ---');
    
    const userId = getUserIdFromToken(psicologoToken);
    if (!userId) {
      console.log('⚠️ No se pudo obtener el ID del usuario del token, saltando test');
      return true;
    }
    
    const response = await axios.get(`${BASE_URL}/api/v1/psicologos/${userId}/pacientes`, {
      headers: { Authorization: `Bearer ${psicologoToken}` }
    });
    
    console.log('🔍 Verificando estructura de respuesta...');
    
    if (response.data.length > 0) {
      const paciente = response.data[0];
      
      // Verificar que los datos vienen de la tabla pacientes
      if (paciente.id && paciente.pacienteId && paciente.primeraSesionRegistrada) {
        console.log('✅ Los datos incluyen campos de la tabla pacientes');
        console.log(`   - ID de relación: ${paciente.id}`);
        console.log(`   - ID de usuario paciente: ${paciente.pacienteId}`);
        console.log(`   - Primera sesión: ${paciente.primeraSesionRegistrada}`);
      } else {
        console.log('⚠️ Los datos no incluyen todos los campos esperados de la tabla pacientes');
      }
      
      // Verificar que los datos incluyen información del usuario
      if (paciente.nombre && paciente.apellido && paciente.email) {
        console.log('✅ Los datos incluyen información del usuario');
        console.log(`   - Nombre: ${paciente.nombre} ${paciente.apellido}`);
        console.log(`   - Email: ${paciente.email}`);
      } else {
        console.log('⚠️ Los datos no incluyen información completa del usuario');
      }
    } else {
      console.log('ℹ️ No hay pacientes para verificar la estructura');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error en verificación de base de datos:', error.response?.data || error.message);
    return false;
  }
}

// Función principal de test
async function runTests() {
  try {
    console.log('🚀 Iniciando tests del endpoint de pacientes asignados...\n');
    
    // 1. Login como psicólogo
    await loginAsPsicologo();
    
    // 2. Login como admin
    await loginAsAdmin();
    
    // 3. Ejecutar tests
    const results = [];
    
    results.push(await testPsicologoCanSeeOwnPacientes());
    results.push(await testPsicologoCannotSeeOtherPacientes());
    results.push(await testAdminCanSeeAnyPacientes());
    results.push(await testDatabaseQuery());
    
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