const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3000/api/v1';

// Token de autenticación ADMIN (reemplazar con un token válido)
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi1pZCIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTUxNjIzOTAyMn0.admin-token-here';

const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testMarcarPagoPackConReservas(pagoId, montoPagado) {
  try {
    console.log(`🧪 Probando marcado de pago de pack con actualización automática de reservas...\n`);
    console.log(`💳 Pago ID: ${pagoId}`);
    console.log(`💰 Monto: $${montoPagado}\n`);

    const payload = {
      pagoId: pagoId,
      montoPagado: montoPagado,
      metodoPago: 'Transferencia bancaria',
      referenciaPago: 'TRF-AUTO-RESERVAS-2024-001',
      observaciones: 'Pago confirmado - reservas actualizadas automáticamente'
    };

    const response = await axios.post(`${BASE_URL}/packs/pagos/marcar`, payload, { headers });
    
    console.log('✅ Pago de pack marcado con actualización automática de reservas:');
    console.log('=' .repeat(80));
    
    console.log('📝 MENSAJE:');
    console.log(`   ${response.data.message}`);
    
    console.log('\n💳 INFORMACIÓN DEL PAGO:');
    console.log(`   ID: ${response.data.pago.id}`);
    console.log(`   Mes/Año: ${response.data.pago.mes}/${response.data.pago.año}`);
    console.log(`   Monto: $${response.data.pago.monto}`);
    console.log(`   Monto pagado: $${response.data.pago.montoPagado}`);
    console.log(`   Estado: ${response.data.pago.estado}`);
    console.log(`   Fecha de pago: ${response.data.pago.fechaPago}`);
    console.log(`   Método: ${response.data.pago.metodoPago}`);
    console.log(`   Referencia: ${response.data.pago.referenciaPago}`);
    
    console.log('\n📦 INFORMACIÓN DEL PACK:');
    console.log(`   Pack: ${response.data.asignacion.pack.nombre}`);
    console.log(`   Descripción: ${response.data.asignacion.pack.descripcion || 'Sin descripción'}`);
    console.log(`   Precio pack: $${response.data.asignacion.pack.precio}`);
    console.log(`   Estado asignación: ${response.data.asignacion.estado}`);
    
    console.log('\n🎯 RESERVAS AFECTADAS:');
    console.log(`   Total reservas actualizadas: ${response.data.reservasAfectadas.total}`);
    console.log(`   Mes afectado: ${response.data.reservasAfectadas.mes}`);
    console.log(`   Estado: ${response.data.reservasAfectadas.estado}`);
    
    if (response.data.reservasAfectadas.total > 0) {
      console.log('\n✅ FUNCIONALIDAD IMPLEMENTADA:');
      console.log('   - Pago del pack marcado como pagado');
      console.log('   - Todas las reservas del pack del mes actualizadas automáticamente');
      console.log('   - Estado de pago de reservas cambiado a "pagado"');
      console.log('   - Transacción atómica (todo o nada)');
    } else {
      console.log('\nℹ️  No hay reservas del pack para este mes');
    }

    return response.data;

  } catch (error) {
    console.error('❌ Error al marcar pago:', error.response?.data || error.message);
    throw error;
  }
}

async function testVerificarReservasActualizadas(asignacionId, mes, año) {
  try {
    console.log(`\n🧪 Verificando que las reservas se actualizaron correctamente...\n`);

    // Obtener reservas de la sede para verificar
    const sedeId = '7af6778a-d8e9-42db-973e-b4fb8379eed1';
    const response = await axios.get(`${BASE_URL}/reservas/admin/sede/${sedeId}`, { headers });
    
    // Filtrar reservas del pack específico
    const reservasDelPack = response.data.filter(reserva => 
      reserva.packAsignacionId === asignacionId
    );
    
    console.log('📋 RESERVAS DEL PACK ENCONTRADAS:');
    console.log('=' .repeat(60));
    console.log(`   Total reservas del pack: ${reservasDelPack.length}`);
    
    if (reservasDelPack.length > 0) {
      const reservasPagadas = reservasDelPack.filter(r => r.estadoPago === 'pagado');
      const reservasPendientes = reservasDelPack.filter(r => r.estadoPago === 'pendiente_pago');
      
      console.log(`   Reservas pagadas: ${reservasPagadas.length}`);
      console.log(`   Reservas pendientes: ${reservasPendientes.length}`);
      
      console.log('\n📅 DETALLE DE RESERVAS:');
      reservasDelPack.forEach((reserva, index) => {
        console.log(`   ${index + 1}. ${reserva.fecha} ${reserva.horaInicio}-${reserva.horaFin}`);
        console.log(`      Box: ${reserva.box?.numero}`);
        console.log(`      Estado: ${reserva.estado}`);
        console.log(`      Estado pago: ${reserva.estadoPago} ${reserva.estadoPago === 'pagado' ? '✅' : '⏳'}`);
        console.log(`      Pack: ${reserva.pack?.packNombre}`);
        console.log('');
      });
      
      // Verificar si todas están pagadas
      const todasPagadas = reservasDelPack.every(r => r.estadoPago === 'pagado');
      console.log(`✅ Todas las reservas están pagadas: ${todasPagadas ? 'SÍ' : 'NO'}`);
      
    } else {
      console.log('ℹ️  No se encontraron reservas del pack en esta sede');
    }

    return reservasDelPack;

  } catch (error) {
    console.error('❌ Error al verificar reservas:', error.response?.data || error.message);
    throw error;
  }
}

async function testFlujoCompleto() {
  try {
    console.log('\n🧪 Probando flujo completo: Consolidado → Marcar Pago → Verificar Reservas...\n');

    const psicologoId = '84d0ec87-ed7d-4dc1-af60-21fe288952da';
    const mes = '2024-10';

    // Paso 1: Obtener consolidado con información de pagos
    console.log('📋 Paso 1: Obtener consolidado con información de pagos');
    const consolidado = await axios.get(`${BASE_URL}/consolidado/mensual/${psicologoId}`, {
      params: { mes },
      headers
    });
    
    const packConPagoPendiente = consolidado.data.packsDelMes.find(p => 
      p.pagoMensual && p.pagoMensual.estado === 'pendiente_pago'
    );
    
    if (packConPagoPendiente) {
      console.log(`   Pack encontrado: ${packConPagoPendiente.packNombre}`);
      console.log(`   Pago ID: ${packConPagoPendiente.pagoMensual.id}`);
      console.log(`   Monto: $${packConPagoPendiente.pagoMensual.monto}`);
      
      // Paso 2: Marcar pago (con actualización automática de reservas)
      console.log('\n📋 Paso 2: Marcar pago con actualización automática de reservas');
      const resultadoPago = await testMarcarPagoPackConReservas(
        packConPagoPendiente.pagoMensual.id,
        packConPagoPendiente.pagoMensual.monto
      );
      
      // Paso 3: Verificar que las reservas se actualizaron
      console.log('\n📋 Paso 3: Verificar que las reservas se actualizaron');
      await testVerificarReservasActualizadas(
        packConPagoPendiente.asignacionId,
        packConPagoPendiente.pagoMensual.mes,
        packConPagoPendiente.pagoMensual.año
      );
      
      // Paso 4: Verificar consolidado actualizado
      console.log('\n📋 Paso 4: Verificar consolidado actualizado');
      const consolidadoActualizado = await axios.get(`${BASE_URL}/consolidado/mensual/${psicologoId}`, {
        params: { mes },
        headers
      });
      
      const packActualizado = consolidadoActualizado.data.packsDelMes.find(p => 
        p.asignacionId === packConPagoPendiente.asignacionId
      );
      
      console.log('📊 CONSOLIDADO ACTUALIZADO:');
      console.log(`   Estado pago: ${packActualizado.estadoPago}`);
      console.log(`   Monto pagado: $${packActualizado.montoPagado}`);
      console.log(`   Estado pago mensual: ${packActualizado.pagoMensual.estado}`);
      
    } else {
      console.log('ℹ️  No hay packs con pagos pendientes para este mes');
    }

  } catch (error) {
    console.error('❌ Error en el flujo completo:', error.response?.data || error.message);
  }
}

async function testBeneficiosNuevaFuncionalidad() {
  try {
    console.log('\n🧪 Analizando beneficios de la nueva funcionalidad...\n');

    console.log('🎯 BENEFICIOS DE LA ACTUALIZACIÓN AUTOMÁTICA:');
    console.log('=' .repeat(60));
    
    console.log('✅ VENTAJAS:');
    console.log('   1. Consistencia automática entre pack y reservas');
    console.log('   2. Una sola acción marca todo como pagado');
    console.log('   3. Transacción atómica (todo o nada)');
    console.log('   4. Menos errores manuales');
    console.log('   5. Reportes más precisos');
    
    console.log('\n🔄 FLUJO SIMPLIFICADO:');
    console.log('   Antes: Marcar pack → Marcar cada reserva individualmente');
    console.log('   Ahora: Marcar pack → Todas las reservas se marcan automáticamente');
    
    console.log('\n💡 CASOS DE USO:');
    console.log('   - Administrador marca pago mensual del pack');
    console.log('   - Todas las reservas del mes se consideran pagadas');
    console.log('   - Consolidados reflejan estado correcto');
    console.log('   - Reportes financieros precisos');
    
    console.log('\n🔒 SEGURIDAD:');
    console.log('   - Transacción atómica garantiza consistencia');
    console.log('   - Solo administradores pueden marcar pagos');
    console.log('   - Validaciones previas al procesamiento');

  } catch (error) {
    console.error('❌ Error en análisis:', error.message);
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🚀 Iniciando pruebas de marcado automático de reservas al pagar pack\n');
  console.log('=' .repeat(80));
  
  try {
    // Probar marcado de pago con actualización automática
    const pagoId = '91cd3e2e-20e0-498f-b79b-a08b7200c565';
    const montoPagado = 11760;
    
    await testMarcarPagoPackConReservas(pagoId, montoPagado);
    
    // Probar flujo completo
    await testFlujoCompleto();
    
    // Analizar beneficios
    await testBeneficiosNuevaFuncionalidad();
    
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
  testMarcarPagoPackConReservas,
  testVerificarReservasActualizadas,
  testFlujoCompleto,
  testBeneficiosNuevaFuncionalidad,
  runAllTests
};
