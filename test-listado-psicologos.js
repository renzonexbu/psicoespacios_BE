const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'tu-jwt-token-aqui'; // Reemplazar con token válido

async function testListadoPsicologos() {
  try {
    console.log('🧪 Probando endpoints de listado de psicólogos...\n');

    // Test 1: Listado público (sin autenticación)
    console.log('1️⃣ Probando GET /api/v1/psicologos/public:');
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/psicologos/public`);
      console.log(`   ✅ Respuesta exitosa: ${response.data.length} psicólogos encontrados`);
      
      if (response.data.length > 0) {
        console.log('   📋 Primer psicólogo:');
        const primerPsicologo = response.data[0];
        console.log(`      ID: ${primerPsicologo.id}`);
        console.log(`      Nombre: ${primerPsicologo.usuario.nombre} ${primerPsicologo.usuario.apellido}`);
        console.log(`      Especialidad: ${primerPsicologo.usuario.especialidad}`);
        console.log(`      Estado: ${primerPsicologo.usuario.estado}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Listado autenticado
    console.log('2️⃣ Probando GET /api/v1/psicologos (autenticado):');
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/psicologos`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      });
      console.log(`   ✅ Respuesta exitosa: ${response.data.length} psicólogos encontrados`);
      
      if (response.data.length > 0) {
        console.log('   📋 Primer psicólogo:');
        const primerPsicologo = response.data[0];
        console.log(`      ID: ${primerPsicologo.id}`);
        console.log(`      Nombre: ${primerPsicologo.usuario.nombre} ${primerPsicologo.usuario.apellido}`);
        console.log(`      Email: ${primerPsicologo.usuario.email}`);
        console.log(`      RUT: ${primerPsicologo.usuario.rut}`);
        console.log(`      Estado: ${primerPsicologo.usuario.estado}`);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ⚠️  Error de autenticación (esperado sin token válido)');
      } else {
        console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Psicólogo específico público
    console.log('3️⃣ Probando GET /api/v1/psicologos/public/:id:');
    try {
      // Usar el ID del primer psicólogo del listado público
      const listadoResponse = await axios.get(`${BASE_URL}/api/v1/psicologos/public`);
      if (listadoResponse.data.length > 0) {
        const psicologoId = listadoResponse.data[0].id;
        const response = await axios.get(`${BASE_URL}/api/v1/psicologos/public/${psicologoId}`);
        console.log(`   ✅ Psicólogo específico encontrado: ${response.data.usuario.nombre} ${response.data.usuario.apellido}`);
      } else {
        console.log('   ⚠️  No hay psicólogos en el listado público para probar');
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Psicólogo específico autenticado
    console.log('4️⃣ Probando GET /api/v1/psicologos/:id (autenticado):');
    try {
      const listadoResponse = await axios.get(`${BASE_URL}/api/v1/psicologos/public`);
      if (listadoResponse.data.length > 0) {
        const psicologoId = listadoResponse.data[0].id;
        const response = await axios.get(`${BASE_URL}/api/v1/psicologos/${psicologoId}`, {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`
          }
        });
        console.log(`   ✅ Psicólogo específico encontrado: ${response.data.usuario.nombre} ${response.data.usuario.apellido}`);
        console.log(`      Email: ${response.data.usuario.email}`);
        console.log(`      RUT: ${response.data.usuario.rut}`);
      } else {
        console.log('   ⚠️  No hay psicólogos en el listado para probar');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ⚠️  Error de autenticación (esperado sin token válido)');
      } else {
        console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n🎉 Pruebas completadas!');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Función para mostrar resumen de endpoints
function mostrarResumenEndpoints() {
  console.log('📚 Resumen de endpoints disponibles:');
  console.log('');
  console.log('   🔐 AUTENTICADOS:');
  console.log('   GET /api/v1/psicologos           - Listado completo (ADMIN, PSICOLOGO)');
  console.log('   GET /api/v1/psicologos/:id       - Psicólogo específico (ADMIN, PSICOLOGO, PACIENTE)');
  console.log('');
  console.log('   🌐 PÚBLICOS:');
  console.log('   GET /api/v1/psicologos/public    - Listado público (sin autenticación)');
  console.log('   GET /api/v1/psicologos/public/:id - Psicólogo específico público');
  console.log('');
  console.log('   📊 DIFERENCIAS:');
  console.log('   - Autenticados: Incluyen datos sensibles (email, RUT, etc.)');
  console.log('   - Públicos: Solo datos públicos (nombre, especialidad, etc.)');
  console.log('   - Públicos: Solo muestran psicólogos activos');
}

// Ejecutar las pruebas
async function runTests() {
  mostrarResumenEndpoints();
  console.log('\n' + '='.repeat(60) + '\n');
  await testListadoPsicologos();
}

runTests();
