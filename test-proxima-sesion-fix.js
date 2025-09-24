const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'tu-jwt-token-aqui'; // Reemplazar con token válido

async function testProximaSesionFix() {
  try {
    console.log('🧪 Probando corrección de próxima sesión...\n');

    // Datos de la imagen de la base de datos
    const psicologoId = '0289e826-187c-48cc-b08f-2104ecfea8ae'; // ID del psicólogo de la imagen
    const pacienteIdEsperado = '02af7aa5-6067-427a-84bc-4d879aeb6524'; // ID del paciente de la imagen

    console.log('📋 Datos de prueba (de la imagen):');
    console.log(`   Psicólogo ID: ${psicologoId}`);
    console.log(`   Paciente ID esperado: ${pacienteIdEsperado}`);
    console.log('   Sesiones esperadas en la BD:');
    console.log('     - 2025-09-03 08:00-09:00');
    console.log('     - 2025-09-08 08:00-09:00');
    console.log('     - 2025-09-08 09:00-10:00');
    console.log('     - 2025-09-08 10:00-11:00');
    console.log('     - 2025-09-10 09:30-10:30');
    console.log('');

    // Test: Llamar al endpoint
    console.log('1️⃣ Llamando al endpoint:');
    console.log(`   GET /api/v1/psicologos/${psicologoId}/pacientes`);
    
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/psicologos/${psicologoId}/pacientes`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   ✅ Respuesta exitosa: ${response.data.length} pacientes encontrados`);
      
      // Buscar el paciente específico
      const paciente = response.data.find(p => p.pacienteId === pacienteIdEsperado);
      if (paciente) {
        console.log('\n   📋 Paciente encontrado:');
        console.log(`      Nombre: ${paciente.nombre} ${paciente.apellido}`);
        console.log(`      ID: ${paciente.pacienteId}`);
        console.log(`      Próxima sesión: ${paciente.proximaSesion ? new Date(paciente.proximaSesion).toLocaleString() : 'NULL'}`);
        
        if (paciente.proximaSesion) {
          const fechaProxima = new Date(paciente.proximaSesion);
          console.log(`      Fecha ISO: ${fechaProxima.toISOString()}`);
          console.log('   ✅ ¡CORRECTO! Próxima sesión calculada');
          
          // Verificar que sea la más próxima
          const fechaEsperada = new Date('2025-09-03T08:00:00.000Z'); // Primera sesión de la imagen
          if (fechaProxima.getTime() === fechaEsperada.getTime()) {
            console.log('   ✅ ¡PERFECTO! Es la sesión más próxima (2025-09-03 08:00)');
          } else {
            console.log(`   ⚠️  Fecha diferente a la esperada. Esperada: 2025-09-03 08:00, Obtenida: ${fechaProxima.toLocaleString()}`);
          }
        } else {
          console.log('   ❌ PROBLEMA: Próxima sesión es NULL');
          console.log('   🔍 Verificar:');
          console.log('      - Que el psicologoId sea correcto');
          console.log('      - Que las reservas tengan estado PENDIENTE o CONFIRMADA');
          console.log('      - Que las fechas sean futuras');
          console.log('      - Revisar logs del servidor para mensajes [DEBUG]');
        }
      } else {
        console.log('   ❌ Paciente no encontrado en la respuesta');
        console.log('   🔍 Verificar que el psicologoId sea correcto');
      }

    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ⚠️  Error de autenticación (esperado sin token válido)');
        console.log('   💡 Para probar, necesitas un token JWT válido');
      } else if (error.response?.status === 403) {
        console.log('   ⚠️  Error de permisos');
        console.log('   💡 Verificar que el token tenga permisos de PSICOLOGO o ADMIN');
      } else if (error.response?.status === 404) {
        console.log('   ⚠️  Psicólogo no encontrado');
        console.log('   💡 Verificar que el psicologoId sea correcto');
      } else {
        console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Información adicional
    console.log('📚 INFORMACIÓN ADICIONAL:');
    console.log('');
    console.log('   🔧 Cambios realizados:');
    console.log('   1. Corregido el método calcularProximaSesion para usar el ID correcto del psicólogo');
    console.log('   2. Agregados logs de debug para facilitar el troubleshooting');
    console.log('   3. Simplificada la consulta para usar directamente el psicologoId del parámetro');
    console.log('');
    console.log('   🗄️  Estructura de la consulta:');
    console.log('   - Tabla: reservas_sesiones');
    console.log('   - Filtros: paciente_id = pacienteId, psicologo_id = psicologoId');
    console.log('   - Estados: PENDIENTE, CONFIRMADA');
    console.log('   - Fecha: >= hoy');
    console.log('   - Orden: fecha ASC, hora_inicio ASC');
    console.log('');
    console.log('   🧪 Para verificar manualmente en la BD:');
    console.log(`   SELECT * FROM reservas_sesiones WHERE paciente_id = '${pacienteIdEsperado}' AND psicologo_id = '${psicologoId}' AND fecha >= CURRENT_DATE ORDER BY fecha, hora_inicio;`);

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar la prueba
testProximaSesionFix();
