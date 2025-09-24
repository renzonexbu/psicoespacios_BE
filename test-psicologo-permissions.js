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

// Test 1: Psicólogo puede ver sus propios pacientes
async function testPsicologoCanSeeOwnPacientes() {
  try {
    console.log('\n--- Test 1: PSICÓLOGO puede ver sus propios pacientes ---');
    
    const userId = getUserIdFromToken(psicologoToken);
    if (!userId) {
      console.log('❌ No se pudo obtener el ID del usuario del token');
      return false;
    }
    
    const response = await axios.get(`${BASE_URL}/api/v1/psicologos/${userId}/pacientes`, {
      headers: { Authorization: `Bearer ${psicologoToken}` }
    });
    
    console.log('✅ PSICÓLOGO puede acceder a sus propios pacientes');
    console.log(`📊 Total de pacientes: ${response.data.length}`);
    
    if (response.data.length > 0) {
      console.log('👥 Primer paciente:');
      console.log(`   ID: ${response.data[0].id}`);
      console.log(`   Nombre: ${response.data[0].nombre} ${response.data[0].apellido}`);
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

// Test 4: Psicólogo puede ver su propio perfil
async function testPsicologoCanSeeOwnProfile() {
  try {
    console.log('\n--- Test 4: PSICÓLOGO puede ver su propio perfil ---');
    
    const userId = getUserIdFromToken(psicologoToken);
    if (!userId) {
      console.log('⚠️ No se pudo obtener el ID del usuario del token, saltando test');
      return true;
    }
    
    const response = await axios.get(`${BASE_URL}/api/v1/psicologos/usuario/${userId}`, {
      headers: { Authorization: `Bearer ${psicologoToken}` }
    });
    
    console.log('✅ PSICÓLOGO puede ver su propio perfil');
    console.log(`👤 Perfil: ${response.data.nombre} ${response.data.apellido}`);
    return true;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('❌ PSICÓLOGO NO puede ver su propio perfil (Forbidden)');
    } else if (error.response?.status === 401) {
      console.log('❌ PSICÓLOGO NO puede ver su propio perfil (Unauthorized)');
    } else {
      console.error('❌ Error inesperado:', error.response?.data || error.message);
    }
    return false;
  }
}

// Test 5: Psicólogo NO puede ver perfil de otro psicólogo
async function testPsicologoCannotSeeOtherProfile() {
  try {
    console.log('\n--- Test 5: PSICÓLOGO NO puede ver perfil de otro psicólogo ---');
    
    // Usar un ID diferente al del psicólogo logueado
    const otherUserId = '00000000-0000-0000-0000-000000000000';
    
    await axios.get(`${BASE_URL}/api/v1/psicologos/usuario/${otherUserId}`, {
      headers: { Authorization: `Bearer ${psicologoToken}` }
    });
    
    console.log('❌ ERROR: PSICÓLOGO pudo acceder al perfil de otro (no debería pasar)');
    return false;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ PSICÓLOGO NO puede acceder al perfil de otro (Forbidden)');
      return true;
    } else if (error.response?.status === 401) {
      console.log('✅ PSICÓLOGO NO puede acceder al perfil de otro (Unauthorized)');
      return true;
    } else {
      console.error('❌ Error inesperado:', error.response?.data || error.message);
      return false;
    }
  }
}

// Función principal de test
async function runTests() {
  try {
    console.log('🚀 Iniciando tests de permisos de psicólogo...\n');
    
    // 1. Login como psicólogo
    await loginAsPsicologo();
    
    // 2. Login como admin
    await loginAsAdmin();
    
    // 3. Ejecutar tests
    const results = [];
    
    results.push(await testPsicologoCanSeeOwnPacientes());
    results.push(await testPsicologoCannotSeeOtherPacientes());
    results.push(await testAdminCanSeeAnyPacientes());
    results.push(await testPsicologoCanSeeOwnProfile());
    results.push(await testPsicologoCannotSeeOtherProfile());
    
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