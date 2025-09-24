const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'tu-jwt-token-aqui'; // Reemplazar con token válido

async function debugProximaSesion() {
  try {
    console.log('🔍 DEBUG: Verificando cálculo de próxima sesión...\n');

    // Datos de la imagen
    const pacienteId = '02af7aa5-6067-427a-84bc-4d879aeb6524';
    const psicologoId = '0289e826-187c-48cc-b08f-2104ecfea8ae'; // Del psicólogo en la imagen

    console.log('📋 Datos de la imagen:');
    console.log(`   Paciente ID: ${pacienteId}`);
    console.log(`   Psicólogo ID: ${psicologoId}`);
    console.log('   Sesiones en la imagen:');
    console.log('     - 2025-09-03 08:00-09:00');
    console.log('     - 2025-09-08 08:00-09:00');
    console.log('     - 2025-09-08 09:00-10:00');
    console.log('     - 2025-09-08 10:00-11:00');
    console.log('     - 2025-09-10 09:30-10:30');
    console.log('');

    // Test 1: Llamar al endpoint
    console.log('1️⃣ Llamando al endpoint GET /api/v1/psicologos/{psicologoId}/pacientes:');
    
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/psicologos/${psicologoId}/pacientes`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   ✅ Respuesta exitosa: ${response.data.length} pacientes encontrados`);
      
      // Buscar el paciente específico
      const paciente = response.data.find(p => p.pacienteId === pacienteId);
      if (paciente) {
        console.log('\n   📋 Paciente encontrado:');
        console.log(`      Nombre: ${paciente.nombre} ${paciente.apellido}`);
        console.log(`      ID: ${paciente.pacienteId}`);
        console.log(`      Próxima sesión: ${paciente.proximaSesion ? new Date(paciente.proximaSesion).toLocaleString() : 'NULL'}`);
        
        if (paciente.proximaSesion) {
          console.log('   ✅ Próxima sesión calculada correctamente');
        } else {
          console.log('   ❌ Próxima sesión es NULL (problema)');
        }
      } else {
        console.log('   ❌ Paciente no encontrado en la respuesta');
      }

    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ⚠️  Error de autenticación (esperado sin token válido)');
      } else if (error.response?.status === 403) {
        console.log('   ⚠️  Error de permisos');
      } else if (error.response?.status === 404) {
        console.log('   ⚠️  Psicólogo no encontrado');
      } else {
        console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 2: Verificar posibles problemas
    console.log('2️⃣ Posibles problemas a verificar:');
    console.log('');
    console.log('   🔍 1. Verificar que el psicologoId en la URL sea el ID del psicólogo:');
    console.log(`      - URL actual: /api/v1/psicologos/${psicologoId}/pacientes`);
    console.log(`      - Debe ser el ID de la tabla psicologos, no el ID del usuario`);
    console.log('');
    console.log('   🔍 2. Verificar estados de las reservas:');
    console.log('      - Las reservas deben tener estado PENDIENTE o CONFIRMADA');
    console.log('      - Verificar en la base de datos:');
    console.log(`        SELECT estado FROM reservas_sesiones WHERE paciente_id = '${pacienteId}';`);
    console.log('');
    console.log('   🔍 3. Verificar fechas:');
    console.log('      - Las reservas deben ser futuras (fecha >= hoy)');
    console.log('      - Verificar en la base de datos:');
    console.log(`        SELECT fecha FROM reservas_sesiones WHERE paciente_id = '${pacienteId}' ORDER BY fecha;`);
    console.log('');
    console.log('   🔍 4. Verificar relaciones:');
    console.log('      - Verificar que el psicologoId sea correcto:');
    console.log(`        SELECT id FROM psicologos WHERE id = '${psicologoId}';`);
    console.log('      - Verificar que el pacienteId sea correcto:');
    console.log(`        SELECT id FROM users WHERE id = '${pacienteId}';`);

    console.log('\n🎯 SOLUCIÓN SUGERIDA:');
    console.log('');
    console.log('   Si el problema persiste, verificar:');
    console.log('   1. Que el endpoint esté usando el ID correcto del psicólogo');
    console.log('   2. Que las reservas tengan el estado correcto');
    console.log('   3. Que las fechas sean futuras');
    console.log('   4. Revisar los logs del servidor para ver los mensajes [DEBUG]');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar el debug
debugProximaSesion();
