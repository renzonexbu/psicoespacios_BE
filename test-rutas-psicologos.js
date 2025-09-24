const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';

// Token de autenticación (reemplazar con un token válido)
const AUTH_TOKEN = 'tu-token-jwt-aqui';

async function testRutasPsicologos() {
  try {
    console.log('🧪 Probando rutas de psicólogos para verificar conflictos...\n');

    // Test 1: Verificar que crear-paciente funciona
    console.log('1️⃣ Probando POST /api/v1/psicologos/crear-paciente:');
    try {
      const response = await axios.post(`${BASE_URL}/api/v1/psicologos/crear-paciente`, {
        nombre: 'Test',
        apellido: 'Usuario',
        rut: '11111111-1',
        email: 'test@ejemplo.com',
        fechaNacimiento: '1990-01-01'
      }, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('   ✅ POST crear-paciente funciona correctamente');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ⚠️  Error de autenticación (esperado sin token válido)');
      } else {
        console.log(`   ❌ Error inesperado: ${error.response?.data?.message || error.message}`);
      }
    }

    // Test 2: Verificar que GET con ID específico funciona
    console.log('\n2️⃣ Probando GET /api/v1/psicologos/:id:');
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/psicologos/123e4567-e89b-12d3-a456-426614174000`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      });
      console.log('   ✅ GET con ID específico funciona correctamente');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ⚠️  Error de autenticación (esperado sin token válido)');
      } else if (error.response?.status === 404) {
        console.log('   ⚠️  Psicólogo no encontrado (esperado con ID de prueba)');
      } else {
        console.log(`   ❌ Error inesperado: ${error.response?.data?.message || error.message}`);
      }
    }

    // Test 3: Verificar que "crear-paciente" NO se interpreta como ID
    console.log('\n3️⃣ Probando GET /api/v1/psicologos/crear-paciente:');
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/psicologos/crear-paciente`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      });
      console.log('   ❌ PROBLEMA: "crear-paciente" se interpretó como ID');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('   ✅ CORRECTO: "crear-paciente" no se interpreta como ID (404 Not Found)');
      } else if (error.response?.status === 401) {
        console.log('   ⚠️  Error de autenticación (esperado sin token válido)');
      } else {
        console.log(`   ❌ Error inesperado: ${error.response?.data?.message || error.message}`);
      }
    }

    // Test 4: Verificar otras rutas específicas
    console.log('\n4️⃣ Probando rutas específicas:');
    
    const rutasEspecificas = [
      'disponibilidad/agenda',
      'disponibilidad/psicologo',
      'box-disponible',
      'public'
    ];

    for (const ruta of rutasEspecificas) {
      try {
        const response = await axios.get(`${BASE_URL}/api/v1/psicologos/${ruta}`);
        console.log(`   ✅ GET /api/v1/psicologos/${ruta} funciona`);
      } catch (error) {
        if (error.response?.status === 400) {
          console.log(`   ⚠️  GET /api/v1/psicologos/${ruta} requiere parámetros (esperado)`);
        } else {
          console.log(`   ❌ Error en ${ruta}: ${error.response?.data?.message || error.message}`);
        }
      }
    }

    console.log('\n📋 Resumen de la prueba:');
    console.log('   - Las rutas específicas (como "crear-paciente") deben funcionar correctamente');
    console.log('   - Las rutas con parámetros dinámicos (:id) deben estar al final');
    console.log('   - No debe haber conflictos entre rutas específicas y dinámicas');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Función para mostrar el orden correcto de las rutas
function mostrarOrdenRutas() {
  console.log('\n📚 Orden correcto de rutas en NestJS:');
  console.log('   1. Rutas específicas (sin parámetros)');
  console.log('   2. Rutas con parámetros específicos (como "box/:id")');
  console.log('   3. Rutas con parámetros dinámicos (como ":id") al final');
  console.log('\n   Ejemplo:');
  console.log('   @Post("crear-paciente")     ← Específica, va primero');
  console.log('   @Get("box/:id")            ← Parámetro específico');
  console.log('   @Get(":id")                ← Parámetro dinámico, va al final');
}

// Ejecutar las pruebas
async function runTests() {
  mostrarOrdenRutas();
  await testRutasPsicologos();
}

runTests();
