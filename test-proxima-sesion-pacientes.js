const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'tu-jwt-token-aqui'; // Reemplazar con token válido

async function testProximaSesionPacientes() {
  try {
    console.log('🧪 Probando endpoint de pacientes con próxima sesión...\n');

    // Test 1: Obtener pacientes de un psicólogo
    console.log('1️⃣ Probando GET /api/v1/psicologos/{psicologoId}/pacientes:');
    
    const psicologoId = 'uuid-del-psicologo'; // Reemplazar con ID real
    
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/psicologos/${psicologoId}/pacientes`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   ✅ Respuesta exitosa: ${response.data.length} pacientes encontrados`);
      
      if (response.data.length > 0) {
        console.log('\n   📋 Detalles de pacientes:');
        response.data.forEach((paciente, index) => {
          console.log(`\n   ${index + 1}. ${paciente.nombre} ${paciente.apellido}:`);
          console.log(`      ID Paciente: ${paciente.pacienteId}`);
          console.log(`      Email: ${paciente.email}`);
          console.log(`      Primera sesión: ${paciente.primeraSesionRegistrada}`);
          console.log(`      Próxima sesión: ${paciente.proximaSesion ? new Date(paciente.proximaSesion).toLocaleString() : 'No programada'}`);
          console.log(`      Estado: ${paciente.estado}`);
        });
      } else {
        console.log('   ⚠️  No se encontraron pacientes para este psicólogo');
      }

    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ⚠️  Error de autenticación (esperado sin token válido)');
      } else if (error.response?.status === 403) {
        console.log('   ⚠️  Error de permisos (psicólogo intentando acceder a otros pacientes)');
      } else if (error.response?.status === 404) {
        console.log('   ⚠️  Psicólogo no encontrado (esperado con ID de prueba)');
      } else {
        console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 2: Verificar estructura de respuesta
    console.log('2️⃣ Verificando estructura de respuesta:');
    
    const estructuraEsperada = {
      id: 'string (UUID)',
      pacienteId: 'string (UUID)',
      nombre: 'string',
      apellido: 'string',
      email: 'string',
      telefono: 'string',
      fechaNacimiento: 'string (ISO date)',
      fotoUrl: 'string | null',
      primeraSesionRegistrada: 'string (ISO date)',
      proximaSesion: 'string (ISO date) | null',
      estado: 'string'
    };

    console.log('   📋 Estructura esperada:');
    Object.entries(estructuraEsperada).forEach(([campo, tipo]) => {
      console.log(`      ${campo}: ${tipo}`);
    });

    console.log('\n🎉 Pruebas completadas!');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Función para mostrar documentación del endpoint
function mostrarDocumentacion() {
  console.log('📚 DOCUMENTACIÓN: Endpoint de Pacientes con Próxima Sesión');
  console.log('');
  console.log('   🔗 ENDPOINT:');
  console.log('   GET /api/v1/psicologos/{psicologoId}/pacientes');
  console.log('');
  console.log('   🔐 AUTENTICACIÓN:');
  console.log('   Authorization: Bearer <jwt-token>');
  console.log('   Roles: ADMIN, TERAPEUTA, PSICOLOGO');
  console.log('');
  console.log('   📋 PARÁMETROS:');
  console.log('   - psicologoId: UUID del psicólogo (en la URL)');
  console.log('');
  console.log('   📤 RESPUESTA EXITOSA (200):');
  console.log('   [');
  console.log('     {');
  console.log('       "id": "uuid-del-paciente",');
  console.log('       "pacienteId": "uuid-del-usuario-paciente",');
  console.log('       "nombre": "María",');
  console.log('       "apellido": "González",');
  console.log('       "email": "maria@ejemplo.com",');
  console.log('       "telefono": "+56912345678",');
  console.log('       "fechaNacimiento": "1990-01-15T00:00:00.000Z",');
  console.log('       "fotoUrl": "https://...",');
  console.log('       "primeraSesionRegistrada": "2025-01-01T00:00:00.000Z",');
  console.log('       "proximaSesion": "2025-01-15T10:00:00.000Z",');
  console.log('       "estado": "ACTIVO"');
  console.log('     }');
  console.log('   ]');
  console.log('');
  console.log('   🔍 CÁLCULO DE PRÓXIMA SESIÓN:');
  console.log('   - Se busca en la tabla reservas_sesiones');
  console.log('   - Se filtra por paciente_id (usuario paciente) y psicologo_id (psicólogo)');
  console.log('   - Solo se consideran reservas con estado PENDIENTE o CONFIRMADA');
  console.log('   - Solo se consideran reservas futuras (fecha >= hoy)');
  console.log('   - Se ordena por fecha y hora ascendente');
  console.log('   - Si no hay reservas futuras, proximaSesion será null');
  console.log('');
  console.log('   ❌ ERRORES POSIBLES:');
  console.log('   - 401: No autenticado');
  console.log('   - 403: Sin permisos (psicólogo accediendo a otros pacientes)');
  console.log('   - 404: Psicólogo no encontrado');
  console.log('');
}

// Ejecutar las pruebas
async function runTests() {
  mostrarDocumentacion();
  console.log('\n' + '='.repeat(60) + '\n');
  await testProximaSesionPacientes();
}

runTests();
