const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3000';

// Token de autenticación ADMIN (reemplazar con un token válido)
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi1pZCIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTUxNjIzOTAyMn0.admin-token-here';

const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testUpdateEstadoPago(reservaId, estadoPago, observaciones = null, metodoPago = null, referenciaPago = null) {
  try {
    console.log(`🧪 Probando actualización de estado de pago...\n`);
    console.log(`📋 Reserva ID: ${reservaId}`);
    console.log(`💳 Nuevo estado: ${estadoPago}\n`);

    const payload = {
      estadoPago: estadoPago,
      observaciones: observaciones,
      metodoPago: metodoPago,
      referenciaPago: referenciaPago
    };

    const response = await axios.put(`${BASE_URL}/reservas/${reservaId}/estado-pago`, payload, { headers });
    
    console.log('✅ Estado de pago actualizado correctamente:');
    console.log('=' .repeat(80));
    
    console.log('📝 MENSAJE:');
    console.log(`   ${response.data.message}`);
    
    console.log('\n📊 INFORMACIÓN DE LA RESERVA:');
    console.log(`   ID: ${response.data.reserva.id}`);
    console.log(`   Fecha: ${response.data.reserva.fecha}`);
    console.log(`   Horario: ${response.data.reserva.horaInicio} - ${response.data.reserva.horaFin}`);
    console.log(`   Box: ${response.data.reserva.box?.numero} (${response.data.reserva.box?.sede?.nombre})`);
    console.log(`   Psicólogo: ${response.data.reserva.psicologo?.nombre} ${response.data.reserva.psicologo?.apellido}`);
    console.log(`   Precio: $${response.data.reserva.precio}`);
    console.log(`   Estado: ${response.data.reserva.estado}`);
    console.log(`   Estado pago: ${response.data.reserva.estadoPago}`);
    
    if (response.data.reserva.pack) {
      console.log('\n📦 INFORMACIÓN DEL PACK:');
      console.log(`   Pack: ${response.data.reserva.pack.packNombre}`);
      console.log(`   Descripción: ${response.data.reserva.pack.packDescripcion || 'Sin descripción'}`);
      console.log(`   Precio pack: $${response.data.reserva.pack.packPrecio}`);
      console.log(`   Estado asignación: ${response.data.reserva.pack.estadoAsignacion}`);
    } else {
      console.log('\n📅 RESERVA INDIVIDUAL:');
      console.log('   No pertenece a ningún pack');
    }
    
    console.log('\n🔄 DETALLES DE LA ACTUALIZACIÓN:');
    console.log(`   Estado anterior: ${response.data.actualizacion.estadoPagoAnterior}`);
    console.log(`   Estado nuevo: ${response.data.actualizacion.estadoPagoNuevo}`);
    console.log(`   Observaciones: ${response.data.actualizacion.observaciones || 'Sin observaciones'}`);
    console.log(`   Método de pago: ${response.data.actualizacion.metodoPago || 'No especificado'}`);
    console.log(`   Referencia: ${response.data.actualizacion.referenciaPago || 'No especificada'}`);
    console.log(`   Fecha actualización: ${response.data.actualizacion.fechaActualizacion}`);

    return response.data;

  } catch (error) {
    console.error('❌ Error al actualizar estado de pago:', error.response?.data || error.message);
    throw error;
  }
}

async function testGetHistorialPago(reservaId) {
  try {
    console.log(`\n🧪 Probando obtención de historial de pago...\n`);
    console.log(`📋 Reserva ID: ${reservaId}\n`);

    const response = await axios.get(`${BASE_URL}/reservas/${reservaId}/historial-pago`, { headers });
    
    console.log('✅ Historial de pago obtenido:');
    console.log('=' .repeat(80));
    
    console.log('📋 INFORMACIÓN DE LA RESERVA:');
    console.log(`   ID: ${response.data.reservaId}`);
    console.log(`   Fecha: ${response.data.fecha}`);
    console.log(`   Horario: ${response.data.horaInicio} - ${response.data.horaFin}`);
    console.log(`   Precio: $${response.data.precio}`);
    
    console.log('\n👤 PSICÓLOGO:');
    console.log(`   Nombre: ${response.data.psicologo.nombre} ${response.data.psicologo.apellido}`);
    
    console.log('\n📦 BOX:');
    console.log(`   Número: ${response.data.box.numero}`);
    console.log(`   Sede: ${response.data.box.sede}`);
    
    console.log('\n📊 ESTADOS ACTUALES:');
    console.log(`   Estado reserva: ${response.data.estadoActual}`);
    console.log(`   Estado pago: ${response.data.estadoPagoActual}`);
    
    console.log('\n📅 FECHAS:');
    console.log(`   Fecha creación: ${response.data.fechaCreacion}`);
    console.log(`   Última actualización: ${response.data.ultimaActualizacion}`);
    
    console.log('\n💡 NOTA:');
    console.log(`   ${response.data.mensaje}`);

    return response.data;

  } catch (error) {
    console.error('❌ Error al obtener historial:', error.response?.data || error.message);
    throw error;
  }
}

async function testValidacionesEstadoPago() {
  try {
    console.log('\n🧪 Probando validaciones del endpoint de estado de pago...\n');

    const reservaId = 'reserva-id-valido';

    // Test 1: Estado de pago inválido
    console.log('📝 Test 1: Estado de pago inválido');
    try {
      await axios.put(`${BASE_URL}/reservas/${reservaId}/estado-pago`, {
        estadoPago: 'estado_invalido'
      }, { headers });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

    // Test 2: Reserva inexistente
    console.log('\n📝 Test 2: Reserva inexistente');
    try {
      await axios.put(`${BASE_URL}/reservas/00000000-0000-0000-0000-000000000000/estado-pago`, {
        estadoPago: 'pagado'
      }, { headers });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

    // Test 3: Sin token de admin
    console.log('\n📝 Test 3: Sin token de admin');
    try {
      await axios.put(`${BASE_URL}/reservas/${reservaId}/estado-pago`, {
        estadoPago: 'pagado'
      });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

    // Test 4: UUID inválido
    console.log('\n📝 Test 4: UUID inválido');
    try {
      await axios.put(`${BASE_URL}/reservas/uuid-invalido/estado-pago`, {
        estadoPago: 'pagado'
      }, { headers });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

async function testCasosDeUsoComunes() {
  try {
    console.log('\n🧪 Probando casos de uso comunes...\n');

    const reservaId = 'reserva-id-valido';

    // Caso 1: Marcar como pagado con transferencia
    console.log('💳 Caso 1: Marcar como pagado con transferencia');
    await testUpdateEstadoPago(
      reservaId,
      'pagado',
      'Pago recibido por transferencia bancaria',
      'Transferencia bancaria',
      'TRF-2024-001'
    );

    // Caso 2: Revertir a pendiente
    console.log('\n💳 Caso 2: Revertir a pendiente');
    await testUpdateEstadoPago(
      reservaId,
      'pendiente_pago',
      'Pago no confirmado, pendiente verificación'
    );

    // Caso 3: Marcar como pagado con efectivo
    console.log('\n💳 Caso 3: Marcar como pagado con efectivo');
    await testUpdateEstadoPago(
      reservaId,
      'pagado',
      'Pago recibido en efectivo',
      'Efectivo',
      'EF-2024-001'
    );

    // Obtener historial después de los cambios
    console.log('\n📋 Obteniendo historial después de los cambios:');
    await testGetHistorialPago(reservaId);

  } catch (error) {
    console.error('❌ Error en casos de uso:', error.response?.data || error.message);
  }
}

async function testReservasConPack() {
  try {
    console.log('\n🧪 Probando actualización de estado de pago en reservas de pack...\n');

    // Simular una reserva de pack
    const reservaPackId = 'reserva-pack-id';

    console.log('📦 Actualizando estado de pago de reserva de pack:');
    await testUpdateEstadoPago(
      reservaPackId,
      'pagado',
      'Pago del pack mensual confirmado',
      'Transferencia bancaria',
      'PACK-TRF-2024-001'
    );

    console.log('\n📋 Obteniendo historial de reserva de pack:');
    await testGetHistorialPago(reservaPackId);

  } catch (error) {
    console.error('❌ Error en reservas de pack:', error.response?.data || error.message);
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🚀 Iniciando pruebas de actualización de estado de pago\n');
  console.log('=' .repeat(80));
  
  try {
    const reservaId = 'reserva-id-valido';
    
    // Probar actualización básica
    await testUpdateEstadoPago(reservaId, 'pagado', 'Pago confirmado');
    
    // Probar historial
    await testGetHistorialPago(reservaId);
    
    // Probar validaciones
    await testValidacionesEstadoPago();
    
    // Probar casos de uso comunes
    await testCasosDeUsoComunes();
    
    // Probar reservas de pack
    await testReservasConPack();
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('✅ Pruebas completadas');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testUpdateEstadoPago,
  testGetHistorialPago,
  testValidacionesEstadoPago,
  testCasosDeUsoComunes,
  testReservasConPack,
  runAllTests
};
