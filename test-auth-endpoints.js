// Script de prueba para los endpoints de autenticación mejorados
// Ejecutar con: node test-auth-endpoints.js

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAuthEndpoints() {
  log('🧪 Iniciando pruebas de endpoints de autenticación...', 'blue');
  
  let accessToken = null;
  let refreshToken = null;
  let user = null;

  try {
    // 1. Test Register
    log('\n📝 1. Probando registro...', 'yellow');
    const registerData = {
      email: `test-${Date.now()}@example.com`,
      password: 'test123456',
      nombre: 'Usuario',
      apellido: 'Test',
      rut: '12345678-9',
      telefono: '+56912345678',
      fechaNacimiento: '1990-01-01',
      role: 'PSICOLOGO'
    };

    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, registerData);
    log('✅ Registro exitoso', 'green');
    log(`   Access Token: ${registerResponse.data.access_token.substring(0, 50)}...`, 'green');
    log(`   Refresh Token: ${registerResponse.data.refresh_token.substring(0, 50)}...`, 'green');
    
    accessToken = registerResponse.data.access_token;
    refreshToken = registerResponse.data.refresh_token;
    user = registerResponse.data.user;

    // 2. Test Login
    log('\n🔐 2. Probando login...', 'yellow');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: registerData.email,
      password: registerData.password
    });
    log('✅ Login exitoso', 'green');
    
    // Actualizar tokens del login
    accessToken = loginResponse.data.access_token;
    refreshToken = loginResponse.data.refresh_token;

    // 3. Test Profile (con access token)
    log('\n👤 3. Probando obtener perfil...', 'yellow');
    const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    log('✅ Perfil obtenido exitosamente', 'green');
    log(`   Usuario: ${profileResponse.data.user.nombre} ${profileResponse.data.user.apellido}`, 'green');

    // 4. Test Refresh Token
    log('\n🔄 4. Probando refresh token...', 'yellow');
    const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
      refresh_token: refreshToken
    });
    log('✅ Refresh token exitoso', 'green');
    log(`   Nuevo Access Token: ${refreshResponse.data.access_token.substring(0, 50)}...`, 'green');
    log(`   Nuevo Refresh Token: ${refreshResponse.data.refresh_token.substring(0, 50)}...`, 'green');
    
    // Actualizar tokens
    accessToken = refreshResponse.data.access_token;
    refreshToken = refreshResponse.data.refresh_token;

    // 5. Test Profile con nuevo token
    log('\n👤 5. Probando perfil con nuevo token...', 'yellow');
    const newProfileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    log('✅ Perfil obtenido con nuevo token', 'green');

    // 6. Test Logout
    log('\n🚪 6. Probando logout...', 'yellow');
    const logoutResponse = await axios.post(`${API_BASE_URL}/auth/logout`, {
      refresh_token: refreshToken
    });
    log('✅ Logout exitoso', 'green');

    // 7. Test Refresh Token después del logout (debe fallar)
    log('\n❌ 7. Probando refresh token después del logout...', 'yellow');
    try {
      await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
        refresh_token: refreshToken
      });
      log('❌ ERROR: El refresh token debería haber sido revocado', 'red');
    } catch (error) {
      if (error.response?.status === 401) {
        log('✅ Refresh token correctamente revocado', 'green');
      } else {
        log(`❌ Error inesperado: ${error.message}`, 'red');
      }
    }

    // 8. Test Profile sin token (debe fallar)
    log('\n❌ 8. Probando perfil sin token...', 'yellow');
    try {
      await axios.get(`${API_BASE_URL}/auth/profile`);
      log('❌ ERROR: Debería requerir autenticación', 'red');
    } catch (error) {
      if (error.response?.status === 401) {
        log('✅ Correctamente requiere autenticación', 'green');
      } else {
        log(`❌ Error inesperado: ${error.message}`, 'red');
      }
    }

    log('\n🎉 ¡Todas las pruebas completadas exitosamente!', 'green');
    log('✅ Sistema de autenticación funcionando correctamente', 'green');

  } catch (error) {
    log('\n❌ Error en las pruebas:', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Message: ${error.response.data?.message || error.message}`, 'red');
    } else {
      log(`   Error: ${error.message}`, 'red');
    }
    
    // Verificar si el servidor está corriendo
    if (error.code === 'ECONNREFUSED') {
      log('\n💡 Asegúrate de que el servidor esté corriendo en http://localhost:3000', 'yellow');
    }
  }
}

// Ejecutar las pruebas
testAuthEndpoints(); 