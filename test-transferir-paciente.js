const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'tu-jwt-token-aqui'; // Reemplazar con token válido

async function testTransferirPaciente() {
  try {
    console.log('🧪 Probando endpoint de transferencia de paciente...\n');

    // Test 1: Transferir paciente
    console.log('1️⃣ Probando POST /api/v1/psicologos/transferir-paciente:');
    
    const transferirData = {
      pacienteId: 'uuid-del-paciente', // Reemplazar con ID real
      nuevoPsicologoId: 'uuid-del-psicologo-destino', // Reemplazar con ID real
      motivoTransferencia: 'Cambio de especialidad requerida',
      notasAdicionales: 'El paciente requiere terapia especializada en ansiedad'
    };

    try {
      const response = await axios.post(`${BASE_URL}/api/v1/psicologos/transferir-paciente`, transferirData, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('   ✅ Transferencia exitosa:');
      console.log(`      Paciente: ${response.data.paciente.id}`);
      console.log(`      Psicólogo anterior: ${response.data.psicologoAnterior.nombre} ${response.data.psicologoAnterior.apellido}`);
      console.log(`      Psicólogo nuevo: ${response.data.psicologoNuevo.nombre} ${response.data.psicologoNuevo.apellido}`);
      console.log(`      Fecha transferencia: ${response.data.fechaTransferencia}`);
      console.log(`      Motivo: ${response.data.motivoTransferencia}`);

    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ⚠️  Error de autenticación (esperado sin token válido)');
      } else if (error.response?.status === 404) {
        console.log('   ⚠️  Paciente o psicólogo no encontrado (esperado con IDs de prueba)');
      } else {
        console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 2: Validaciones
    console.log('2️⃣ Probando validaciones:');
    
    // Test 2.1: Datos faltantes
    console.log('   📋 Test 2.1 - Datos faltantes:');
    try {
      await axios.post(`${BASE_URL}/api/v1/psicologos/transferir-paciente`, {}, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
      });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('   ✅ Validación correcta: Datos faltantes rechazados');
      } else {
        console.log(`   ❌ Error inesperado: ${error.response?.data?.message}`);
      }
    }

    // Test 2.2: Mismo psicólogo
    console.log('   📋 Test 2.2 - Mismo psicólogo:');
    const mismoPsicologoData = {
      pacienteId: 'uuid-del-paciente',
      nuevoPsicologoId: 'mismo-uuid-del-psicologo', // Mismo ID
      motivoTransferencia: 'Test mismo psicólogo'
    };

    try {
      await axios.post(`${BASE_URL}/api/v1/psicologos/transferir-paciente`, mismoPsicologoData, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
      });
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('mismo psicólogo')) {
        console.log('   ✅ Validación correcta: Mismo psicólogo rechazado');
      } else {
        console.log(`   ❌ Error inesperado: ${error.response?.data?.message}`);
      }
    }

    console.log('\n🎉 Pruebas completadas!');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Función para mostrar documentación del endpoint
function mostrarDocumentacion() {
  console.log('📚 DOCUMENTACIÓN: Endpoint de Transferencia de Paciente');
  console.log('');
  console.log('   🔗 ENDPOINT:');
  console.log('   POST /api/v1/psicologos/transferir-paciente');
  console.log('');
  console.log('   🔐 AUTENTICACIÓN:');
  console.log('   Authorization: Bearer <jwt-token>');
  console.log('   Roles: PSICOLOGO, ADMIN');
  console.log('');
  console.log('   📋 BODY (JSON):');
  console.log('   {');
  console.log('     "pacienteId": "uuid-del-paciente",');
  console.log('     "nuevoPsicologoId": "uuid-del-psicologo-destino",');
  console.log('     "motivoTransferencia": "Motivo de la transferencia (opcional)",');
  console.log('     "notasAdicionales": "Notas adicionales (opcional)"');
  console.log('   }');
  console.log('');
  console.log('   ✅ VALIDACIONES:');
  console.log('   - El psicólogo debe ser el propietario actual del paciente');
  console.log('   - El nuevo psicólogo debe existir');
  console.log('   - No se puede transferir al mismo psicólogo');
  console.log('   - El paciente debe existir');
  console.log('');
  console.log('   📤 RESPUESTA EXITOSA (200):');
  console.log('   {');
  console.log('     "success": true,');
  console.log('     "message": "Paciente transferido exitosamente",');
  console.log('     "paciente": {');
  console.log('       "id": "uuid-del-paciente",');
  console.log('       "idUsuarioPaciente": "uuid-del-usuario-paciente",');
  console.log('       "idUsuarioPsicologoAnterior": "uuid-psicologo-anterior",');
  console.log('       "idUsuarioPsicologoNuevo": "uuid-psicologo-nuevo",');
  console.log('       "estado": "ACTIVO"');
  console.log('     },');
  console.log('     "psicologoAnterior": { ... },');
  console.log('     "psicologoNuevo": { ... },');
  console.log('     "fechaTransferencia": "2025-01-XX...",');
  console.log('     "motivoTransferencia": "Motivo de la transferencia"');
  console.log('   }');
  console.log('');
  console.log('   ❌ ERRORES POSIBLES:');
  console.log('   - 401: No autenticado');
  console.log('   - 403: Sin permisos');
  console.log('   - 404: Paciente o psicólogo no encontrado');
  console.log('   - 400: Datos inválidos o mismo psicólogo');
  console.log('');
}

// Ejecutar las pruebas
async function runTests() {
  mostrarDocumentacion();
  console.log('\n' + '='.repeat(60) + '\n');
  await testTransferirPaciente();
}

runTests();
