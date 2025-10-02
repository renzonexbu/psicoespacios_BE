const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3000/api/v1';

// Token de autenticación ADMIN (reemplazar con un token válido)
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi1pZCIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTUxNjIzOTAyMn0.admin-token-here';

const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testConsolidadoConPagos(psicologoId, mes) {
  try {
    console.log(`🧪 Probando consolidado con información de pagos...\n`);
    console.log(`👤 Psicólogo ID: ${psicologoId}`);
    console.log(`📅 Mes: ${mes}\n`);

    const response = await axios.get(`${BASE_URL}/consolidado/mensual/${psicologoId}`, {
      params: { mes },
      headers
    });
    
    console.log('✅ Consolidado obtenido con información de pagos:');
    console.log('=' .repeat(80));
    
    console.log('👤 INFORMACIÓN DEL USUARIO:');
    console.log(`   Psicólogo: ${response.data.nombrePsicologo}`);
    console.log(`   Email: ${response.data.emailPsicologo}`);
    console.log(`   Mes consultado: ${response.data.mes}`);
    
    console.log('\n📊 RESUMEN GENERAL:');
    console.log(`   Total reservas: ${response.data.totalReservas}`);
    console.log(`   Total monto: $${response.data.totalMonto}`);
    console.log(`   Días con reservas: ${response.data.estadisticas.diasConReservas}`);
    
    console.log('\n💰 RESUMEN DE PACKS:');
    console.log(`   Total packs: ${response.data.resumenPacks.totalPacks}`);
    console.log(`   Monto packs: $${response.data.resumenPacks.totalMontoPacks}`);
    console.log(`   Monto individuales: $${response.data.resumenPacks.totalMontoIndividuales}`);
    
    if (response.data.packsDelMes && response.data.packsDelMes.length > 0) {
      console.log('\n📦 DETALLE DE PACKS CON INFORMACIÓN DE PAGOS:');
      response.data.packsDelMes.forEach((pack, index) => {
        console.log(`   ${index + 1}. ${pack.packNombre}:`);
        console.log(`      Estado asignación: ${pack.estadoAsignacion}`);
        console.log(`      Estado pago: ${pack.estadoPago}`);
        console.log(`      Precio total: $${pack.precioTotal}`);
        console.log(`      Reservas confirmadas: ${pack.reservasConfirmadas}`);
        console.log(`      Reservas canceladas: ${pack.reservasCanceladas}`);
        console.log(`      Box: ${pack.nombreBox}`);
        
        if (pack.detallesAsignacion && pack.detallesAsignacion.horarios.length > 0) {
          console.log(`      Horarios:`);
          pack.detallesAsignacion.horarios.forEach((horario, idx) => {
            const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            console.log(`         ${idx + 1}. ${diasSemana[horario.diaSemana]} ${horario.horaInicio}-${horario.horaFin} (${horario.nombreBox})`);
          });
        }
        
        // 🎯 NUEVA INFORMACIÓN DE PAGO MENSUAL
        if (pack.pagoMensual) {
          console.log(`      💳 INFORMACIÓN DE PAGO MENSUAL:`);
          console.log(`         ID del pago: ${pack.pagoMensual.id}`);
          console.log(`         Mes/Año: ${pack.pagoMensual.mes}/${pack.pagoMensual.año}`);
          console.log(`         Monto total: $${pack.pagoMensual.monto}`);
          console.log(`         Monto pagado: $${pack.pagoMensual.montoPagado}`);
          console.log(`         Monto reembolsado: $${pack.pagoMensual.montoReembolsado}`);
          console.log(`         Estado: ${pack.pagoMensual.estado}`);
          console.log(`         Fecha de pago: ${pack.pagoMensual.fechaPago || 'No pagado'}`);
          console.log(`         Fecha vencimiento: ${pack.pagoMensual.fechaVencimiento}`);
          console.log(`         Observaciones: ${pack.pagoMensual.observaciones || 'Sin observaciones'}`);
          console.log(`         Método de pago: ${pack.pagoMensual.metodoPago || 'No especificado'}`);
          console.log(`         Referencia: ${pack.pagoMensual.referenciaPago || 'No especificada'}`);
          console.log(`         Creado: ${pack.pagoMensual.createdAt}`);
          console.log(`         Actualizado: ${pack.pagoMensual.updatedAt}`);
          
          // Mostrar cómo usar el ID para marcar el pago
          console.log(`      🔧 PARA MARCAR ESTE PAGO COMO PAGADO:`);
          console.log(`         POST /packs/pagos/marcar`);
          console.log(`         Body: { "pagoId": "${pack.pagoMensual.id}", "montoPagado": ${pack.pagoMensual.monto}, ... }`);
        } else {
          console.log(`      💳 INFORMACIÓN DE PAGO MENSUAL:`);
          console.log(`         No hay información de pago mensual disponible`);
          console.log(`         (El pack puede no tener pagos generados para este mes)`);
        }
        
        console.log('');
      });
    }
    
    // Mostrar ejemplo de uso
    console.log('\n🎯 EJEMPLO DE USO DEL ID DE PAGO:');
    console.log('=' .repeat(60));
    
    const packConPago = response.data.packsDelMes.find(p => p.pagoMensual);
    if (packConPago) {
      console.log('📋 Para marcar el pago como pagado, usar:');
      console.log(`   Endpoint: POST /packs/pagos/marcar`);
      console.log(`   Body:`);
      console.log(`   {`);
      console.log(`     "pagoId": "${packConPago.pagoMensual.id}",`);
      console.log(`     "montoPagado": ${packConPago.pagoMensual.monto},`);
      console.log(`     "metodoPago": "Transferencia bancaria",`);
      console.log(`     "referenciaPago": "TRF-2024-001",`);
      console.log(`     "observaciones": "Pago confirmado"`);
      console.log(`   }`);
    } else {
      console.log('ℹ️  No hay packs con información de pago disponible para este mes');
    }

    return response.data;

  } catch (error) {
    console.error('❌ Error al obtener consolidado:', error.response?.data || error.message);
    throw error;
  }
}

async function testMarcarPagoDesdeConsolidado() {
  try {
    console.log('\n🧪 Probando flujo completo: Consolidado → Marcar Pago...\n');

    const psicologoId = '84d0ec87-ed7d-4dc1-af60-21fe288952da';
    const mes = '2024-10';

    // Paso 1: Obtener consolidado
    console.log('📋 Paso 1: Obtener consolidado con información de pagos');
    const consolidado = await testConsolidadoConPagos(psicologoId, mes);
    
    // Paso 2: Buscar un pack con pago pendiente
    const packConPagoPendiente = consolidado.packsDelMes.find(p => 
      p.pagoMensual && p.pagoMensual.estado === 'pendiente_pago'
    );
    
    if (packConPagoPendiente) {
      console.log('\n📋 Paso 2: Marcar pago como pagado usando el ID del consolidado');
      
      const payload = {
        pagoId: packConPagoPendiente.pagoMensual.id,
        montoPagado: packConPagoPendiente.pagoMensual.monto,
        metodoPago: 'Transferencia bancaria',
        referenciaPago: 'TRF-CONSOLIDADO-2024-001',
        observaciones: 'Pago confirmado desde consolidado'
      };
      
      const response = await axios.post(`${BASE_URL}/packs/pagos/marcar`, payload, { headers });
      
      console.log('✅ Pago marcado correctamente:');
      console.log(`   Mensaje: ${response.data.message}`);
      console.log(`   Estado anterior: ${response.data.pago.estado}`);
      console.log(`   Estado nuevo: ${response.data.pago.estado}`);
      console.log(`   Fecha de pago: ${response.data.pago.fechaPago}`);
      
      // Paso 3: Verificar consolidado actualizado
      console.log('\n📋 Paso 3: Verificar consolidado actualizado');
      await testConsolidadoConPagos(psicologoId, mes);
      
    } else {
      console.log('ℹ️  No hay packs con pagos pendientes para este mes');
    }

  } catch (error) {
    console.error('❌ Error en el flujo completo:', error.response?.data || error.message);
  }
}

async function testBeneficiosNuevoEndpoint() {
  try {
    console.log('\n🧪 Analizando beneficios del nuevo endpoint...\n');

    console.log('🎯 BENEFICIOS DEL CONSOLIDADO CON INFORMACIÓN DE PAGOS:');
    console.log('=' .repeat(60));
    
    console.log('✅ VENTAJAS:');
    console.log('   1. Un solo endpoint para obtener toda la información');
    console.log('   2. ID del pago disponible directamente para marcar como pagado');
    console.log('   3. Información completa del estado de pago');
    console.log('   4. Fechas de vencimiento visibles');
    console.log('   5. Referencias de pago anteriores disponibles');
    console.log('   6. Menos llamadas a la API necesarias');
    
    console.log('\n🔄 FLUJO SIMPLIFICADO:');
    console.log('   Antes: Consolidado → Obtener pagos → Marcar pago');
    console.log('   Ahora: Consolidado → Marcar pago (usando ID del consolidado)');
    
    console.log('\n💡 CASOS DE USO:');
    console.log('   - Administrador ve consolidado y marca pagos directamente');
    console.log('   - Frontend muestra información completa en una sola vista');
    console.log('   - Auditoría completa de pagos y reservas');
    console.log('   - Reportes financieros detallados');

  } catch (error) {
    console.error('❌ Error en análisis:', error.message);
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🚀 Iniciando pruebas del consolidado con información de pagos\n');
  console.log('=' .repeat(80));
  
  try {
    const psicologoId = '84d0ec87-ed7d-4dc1-af60-21fe288952da';
    const mes = '2024-10';
    
    // Probar consolidado con información de pagos
    await testConsolidadoConPagos(psicologoId, mes);
    
    // Probar flujo completo
    await testMarcarPagoDesdeConsolidado();
    
    // Analizar beneficios
    await testBeneficiosNuevoEndpoint();
    
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
  testConsolidadoConPagos,
  testMarcarPagoDesdeConsolidado,
  testBeneficiosNuevoEndpoint,
  runAllTests
};
