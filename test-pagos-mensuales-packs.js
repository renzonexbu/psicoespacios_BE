const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Token de autenticación (reemplazar con un token válido)
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testAsignarPackConPagosMensuales() {
  try {
    console.log('🧪 Probando asignación de pack con pagos mensuales...\n');

    const packId = 'pack-id-aqui';
    const usuarioId = 'usuario-id-aqui';
    const boxId = 'box-id-aqui';

    // Calcular fecha límite: 2 meses desde hoy
    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaLimite.getMonth() + 2);
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];

    const asignarPackData = {
      packId: packId,
      usuarioId: usuarioId,
      recurrente: true,
      fechaLimite: fechaLimiteStr,
      horarios: [
        {
          diaSemana: 1, // Lunes
          horaInicio: '09:00',
          horaFin: '10:00',
          boxId: boxId
        }
      ]
    };

    console.log('📋 Asignando pack con pagos mensuales:');
    console.log(JSON.stringify(asignarPackData, null, 2));

    const response = await axios.post(`${BASE_URL}/packs/asignar`, asignarPackData, { headers });
    
    console.log('\n✅ Pack asignado exitosamente:');
    console.log(JSON.stringify(response.data, null, 2));

    return response.data.asignacionId;

  } catch (error) {
    console.error('❌ Error al asignar pack:', error.response?.data || error.message);
    throw error;
  }
}

async function testObtenerPagosPorAsignacion(asignacionId) {
  try {
    console.log('\n🧪 Probando obtener pagos por asignación...\n');

    const response = await axios.get(`${BASE_URL}/packs/pagos/asignacion/${asignacionId}`, { headers });
    
    console.log('✅ Pagos obtenidos:');
    console.log('=' .repeat(60));
    
    response.data.forEach((pago, index) => {
      console.log(`📅 Pago ${index + 1}:`);
      console.log(`   ID: ${pago.id}`);
      console.log(`   Mes/Año: ${pago.mes}/${pago.año}`);
      console.log(`   Monto: $${pago.monto}`);
      console.log(`   Estado: ${pago.estado}`);
      console.log(`   Monto pagado: $${pago.montoPagado}`);
      console.log(`   Monto reembolsado: $${pago.montoReembolsado}`);
      console.log(`   Fecha vencimiento: ${pago.fechaVencimiento}`);
      console.log(`   Fecha pago: ${pago.fechaPago || 'No pagado'}`);
      console.log('');
    });

    return response.data;

  } catch (error) {
    console.error('❌ Error al obtener pagos:', error.response?.data || error.message);
    throw error;
  }
}

async function testMarcarPagoMensual(pagos) {
  try {
    console.log('\n🧪 Probando marcar pago mensual...\n');

    if (pagos.length === 0) {
      console.log('❌ No hay pagos para marcar');
      return;
    }

    const primerPago = pagos[0];
    const montoPagado = primerPago.monto; // Pagar el monto completo

    const marcarPagoData = {
      pagoId: primerPago.id,
      montoPagado: montoPagado,
      metodoPago: 'Transferencia bancaria',
      referenciaPago: 'TXN-123456789',
      observaciones: 'Pago realizado por transferencia'
    };

    console.log('📋 Marcando pago:');
    console.log(JSON.stringify(marcarPagoData, null, 2));

    const response = await axios.post(`${BASE_URL}/packs/pagos/marcar`, marcarPagoData, { headers });
    
    console.log('\n✅ Pago marcado exitosamente:');
    console.log(JSON.stringify(response.data, null, 2));

    return response.data;

  } catch (error) {
    console.error('❌ Error al marcar pago:', error.response?.data || error.message);
    throw error;
  }
}

async function testReembolsarPagoMensual(pagoPagado) {
  try {
    console.log('\n🧪 Probando reembolsar pago mensual...\n');

    if (!pagoPagado) {
      console.log('❌ No hay pago pagado para reembolsar');
      return;
    }

    const montoReembolsado = pagoPagado.montoPagado * 0.5; // Reembolsar 50%

    const reembolsarData = {
      pagoId: pagoPagado.id,
      montoReembolsado: montoReembolsado,
      observaciones: 'Reembolso parcial por cancelación de reservas'
    };

    console.log('📋 Reembolsando pago:');
    console.log(JSON.stringify(reembolsarData, null, 2));

    const response = await axios.post(`${BASE_URL}/packs/pagos/reembolsar`, reembolsarData, { headers });
    
    console.log('\n✅ Pago reembolsado exitosamente:');
    console.log(JSON.stringify(response.data, null, 2));

    return response.data;

  } catch (error) {
    console.error('❌ Error al reembolsar pago:', error.response?.data || error.message);
    throw error;
  }
}

async function testObtenerPagosPorUsuario() {
  try {
    console.log('\n🧪 Probando obtener pagos por usuario...\n');

    const usuarioId = 'usuario-id-aqui';
    const mes = '2024-01';

    const response = await axios.get(`${BASE_URL}/packs/pagos/usuario/${usuarioId}`, {
      params: { mes },
      headers
    });
    
    console.log(`✅ Pagos del usuario ${usuarioId} para ${mes}:`);
    console.log('=' .repeat(60));
    
    response.data.forEach((pago, index) => {
      console.log(`📅 Pago ${index + 1}:`);
      console.log(`   Pack: ${pago.asignacion?.pack?.nombre || 'N/A'}`);
      console.log(`   Mes/Año: ${pago.mes}/${pago.año}`);
      console.log(`   Monto: $${pago.monto}`);
      console.log(`   Estado: ${pago.estado}`);
      console.log(`   Monto pagado: $${pago.montoPagado}`);
      console.log('');
    });

    return response.data;

  } catch (error) {
    console.error('❌ Error al obtener pagos por usuario:', error.response?.data || error.message);
    throw error;
  }
}

async function testObtenerPagosPendientes() {
  try {
    console.log('\n🧪 Probando obtener pagos pendientes...\n');

    const response = await axios.get(`${BASE_URL}/packs/pagos/pendientes`, { headers });
    
    console.log('✅ Pagos pendientes obtenidos:');
    console.log('=' .repeat(60));
    
    response.data.forEach((pago, index) => {
      console.log(`📅 Pago pendiente ${index + 1}:`);
      console.log(`   Usuario: ${pago.usuario?.nombre || 'N/A'}`);
      console.log(`   Pack: ${pago.asignacion?.pack?.nombre || 'N/A'}`);
      console.log(`   Mes/Año: ${pago.mes}/${pago.año}`);
      console.log(`   Monto: $${pago.monto}`);
      console.log(`   Fecha vencimiento: ${pago.fechaVencimiento}`);
      console.log(`   Días vencido: ${Math.ceil((new Date() - new Date(pago.fechaVencimiento)) / (1000 * 60 * 60 * 24))}`);
      console.log('');
    });

    return response.data;

  } catch (error) {
    console.error('❌ Error al obtener pagos pendientes:', error.response?.data || error.message);
    throw error;
  }
}

async function testConsolidadoConPagosMensuales() {
  try {
    console.log('\n🧪 Probando consolidado con pagos mensuales...\n');

    const psicologoId = 'psicologo-id-aqui';
    const mes = '2024-01';

    const response = await axios.get(`${BASE_URL}/consolidado/mensual`, {
      params: { psicologoId, mes },
      headers
    });

    console.log('✅ Consolidado con pagos mensuales obtenido:');
    console.log('=' .repeat(60));
    
    console.log('📊 RESUMEN DE PACKS:');
    console.log(`   Total packs: ${response.data.resumenPacks.totalPacks}`);
    console.log(`   Monto packs: $${response.data.resumenPacks.totalMontoPacks}`);
    console.log(`   Monto individuales: $${response.data.resumenPacks.totalMontoIndividuales}`);

    if (response.data.packsDelMes && response.data.packsDelMes.length > 0) {
      console.log('\n📋 DETALLE DE PACKS:');
      response.data.packsDelMes.forEach((pack, index) => {
        console.log(`   ${index + 1}. ${pack.packNombre}:`);
        console.log(`      Estado asignación: ${pack.estadoAsignacion}`);
        console.log(`      Estado pago: ${pack.estadoPago}`);
        console.log(`      Monto pagado: $${pack.montoPagado}`);
        console.log(`      Monto reembolsado: $${pack.montoReembolsado}`);
        console.log(`      Precio proporcional: $${pack.precioProporcional}`);
        console.log(`      Reservas completadas: ${pack.reservasCompletadas}/${pack.totalReservas}`);
        
        // Mostrar estado de asignación
        if (pack.estadoAsignacion === 'ACTIVA') {
          console.log(`      ✅ ASIGNACIÓN ACTIVA`);
        } else if (pack.estadoAsignacion === 'CANCELADA') {
          console.log(`      ❌ ASIGNACIÓN CANCELADA`);
        }
        
        // Mostrar si es pack pendiente de pago
        if (pack.estadoPago === 'pendiente_pago') {
          console.log(`      ⚠️  PACK PENDIENTE DE PAGO`);
        } else if (pack.estadoPago === 'pagado') {
          console.log(`      ✅ PACK PAGADO`);
        } else if (pack.estadoPago === 'reembolsado') {
          console.log(`      💰 PACK CON REEMBOLSO`);
        }
        console.log('');
      });
      
      // Contar packs por estado de pago
      const packsPagados = response.data.packsDelMes.filter(p => p.estadoPago === 'pagado').length;
      const packsPendientes = response.data.packsDelMes.filter(p => p.estadoPago === 'pendiente_pago').length;
      const packsReembolsados = response.data.packsDelMes.filter(p => p.estadoPago === 'reembolsado').length;
      
      console.log('📈 RESUMEN POR ESTADO DE PAGO:');
      console.log(`   Packs pagados: ${packsPagados}`);
      console.log(`   Packs pendientes: ${packsPendientes}`);
      console.log(`   Packs con reembolso: ${packsReembolsados}`);
      
      // Nota sobre packs cancelados
      console.log('\nℹ️  NOTA: El consolidado ahora incluye packs cancelados si tuvieron reservas en el mes consultado');
    } else {
      console.log('ℹ️  No hay packs para este mes');
    }

    return response.data;

  } catch (error) {
    console.error('❌ Error al obtener consolidado:', error.response?.data || error.message);
    throw error;
  }
}

async function testConsolidadoConReservasCanceladas() {
  try {
    console.log('\n🧪 Probando consolidado con reservas canceladas...\n');

    const psicologoId = 'psicologo-id-aqui';
    const mes = '2024-10';

    const response = await axios.get(`${BASE_URL}/consolidado/mensual`, {
      params: { psicologoId, mes },
      headers
    });

    console.log('✅ Consolidado obtenido (verificando cálculo con reservas canceladas):');
    console.log('=' .repeat(60));
    
    if (response.data.packsDelMes && response.data.packsDelMes.length > 0) {
      console.log('📋 VERIFICACIÓN DE CÁLCULO PROPORCIONAL:');
      
      response.data.packsDelMes.forEach((pack, index) => {
        console.log(`\n   ${index + 1}. ${pack.packNombre}:`);
        console.log(`      Precio total del pack: $${pack.precioTotal} (después de cancelaciones)`);
        console.log(`      Total reservas en el mes: ${pack.totalReservas}`);
        console.log(`      Reservas confirmadas: ${pack.reservasConfirmadas}`);
        console.log(`      Reservas canceladas: ${pack.reservasCanceladas}`);
        console.log(`      Precio por reserva: $${pack.precioPorReserva}`);
        console.log(`      Precio proporcional: $${pack.precioProporcional}`);
        console.log(`      Box asignado: ${pack.nombreBox}`);
        console.log(`      Estado asignación: ${pack.estadoAsignacion}`);
        
        // Mostrar detalles de la asignación
        if (pack.detallesAsignacion) {
          console.log(`      Días asignados: ${pack.detallesAsignacion.dias.join(', ')}`);
          console.log(`      Horarios:`);
          pack.detallesAsignacion.horarios.forEach((horario, idx) => {
            const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            console.log(`         ${idx + 1}. ${diasSemana[horario.diaSemana]} ${horario.horaInicio}-${horario.horaFin} (${horario.nombreBox})`);
          });
        }
        
        // Verificar que precioTotal = precioProporcional
        console.log(`      ✅ Precio total = Precio proporcional: ${Math.abs(pack.precioTotal - pack.precioProporcional) < 0.01 ? 'SÍ' : 'NO'}`);
        
        // Calcular precio original del pack
        const precioOriginalPack = pack.totalReservas > 0 
          ? pack.precioPorReserva * pack.totalReservas 
          : pack.precioTotal;
        
        console.log(`      Precio original del pack: $${precioOriginalPack}`);
        
        // Mostrar descuento por cancelaciones
        if (pack.reservasCanceladas > 0) {
          const descuentoCancelaciones = precioOriginalPack - pack.precioTotal;
          console.log(`      💰 Descuento por cancelaciones: $${descuentoCancelaciones}`);
          console.log(`      📉 Porcentaje descontado: ${((descuentoCancelaciones / precioOriginalPack) * 100).toFixed(1)}%`);
        } else {
          console.log(`      ✅ Sin cancelaciones - Precio completo`);
        }
      });
      
      console.log('\n💰 RESUMEN:');
      console.log('   - El precioTotal ahora refleja el precio real después de cancelaciones');
      console.log('   - precioTotal = precioProporcional (ambos consideran cancelaciones)');
      console.log('   - El precio original se puede calcular: precioPorReserva × totalReservas');
      console.log('   - Las reservas canceladas reducen automáticamente el cobro');
      
    } else {
      console.log('ℹ️  No hay packs para este mes');
    }

    return response.data;

  } catch (error) {
    console.error('❌ Error al obtener consolidado:', error.response?.data || error.message);
    throw error;
  }
}

async function testConsolidadoConPacksCancelados() {
  try {
    console.log('\n🧪 Probando consolidado con packs cancelados...\n');

    const psicologoId = 'psicologo-id-aqui';
    const mes = '2024-01';

    const response = await axios.get(`${BASE_URL}/consolidado/mensual`, {
      params: { psicologoId, mes },
      headers
    });

    console.log('✅ Consolidado obtenido (debe incluir packs cancelados):');
    console.log('=' .repeat(60));
    
    if (response.data.packsDelMes && response.data.packsDelMes.length > 0) {
      console.log('📋 VERIFICACIÓN DE PACKS CANCELADOS:');
      
      // Nota: Los packs cancelados aparecerán si tuvieron reservas en el mes consultado
      // aunque la asignación esté cancelada
      console.log(`   Total packs encontrados: ${response.data.packsDelMes.length}`);
      console.log('   ℹ️  Los packs cancelados aparecen si tuvieron reservas en el mes');
      
      // Mostrar información de todos los packs
      response.data.packsDelMes.forEach((pack, index) => {
        console.log(`\n   ${index + 1}. ${pack.packNombre}:`);
        console.log(`      Estado asignación: ${pack.estadoAsignacion}`);
        console.log(`      Estado pago: ${pack.estadoPago}`);
        console.log(`      Monto: $${pack.precioTotal}`);
        console.log(`      Monto pagado: $${pack.montoPagado}`);
        console.log(`      Reservas: ${pack.reservasCompletadas}/${pack.totalReservas}`);
        console.log(`      Precio proporcional: $${pack.precioProporcional}`);
        
        // Indicadores visuales
        if (pack.estadoAsignacion === 'ACTIVA') {
          console.log(`      ✅ ASIGNACIÓN ACTIVA`);
        } else if (pack.estadoAsignacion === 'CANCELADA') {
          console.log(`      ❌ ASIGNACIÓN CANCELADA`);
        }
      });
      
      console.log('\n💰 IMPORTANTE:');
      console.log('   - Los packs cancelados se incluyen si tuvieron reservas en el mes');
      console.log('   - Esto permite ver el historial completo de ingresos');
      console.log('   - El precio proporcional se calcula según reservas completadas');
      
    } else {
      console.log('ℹ️  No hay packs para este mes');
    }

    return response.data;

  } catch (error) {
    console.error('❌ Error al obtener consolidado:', error.response?.data || error.message);
    throw error;
  }
}

async function testConsolidadoConPacksPendientes() {
  try {
    console.log('\n🧪 Probando consolidado con packs pendientes de pago...\n');

    const psicologoId = 'psicologo-id-aqui';
    const mes = '2024-01';

    const response = await axios.get(`${BASE_URL}/consolidado/mensual`, {
      params: { psicologoId, mes },
      headers
    });

    console.log('✅ Consolidado obtenido (debe incluir packs pendientes):');
    console.log('=' .repeat(60));
    
    if (response.data.packsDelMes && response.data.packsDelMes.length > 0) {
      console.log('📋 VERIFICACIÓN DE PACKS:');
      
      const packsPendientes = response.data.packsDelMes.filter(p => p.estadoPago === 'pendiente_pago');
      const packsPagados = response.data.packsDelMes.filter(p => p.estadoPago === 'pagado');
      
      console.log(`   Total packs encontrados: ${response.data.packsDelMes.length}`);
      console.log(`   Packs pendientes de pago: ${packsPendientes.length}`);
      console.log(`   Packs pagados: ${packsPagados.length}`);
      
      if (packsPendientes.length > 0) {
        console.log('\n⚠️  PACKS PENDIENTES DE PAGO:');
        packsPendientes.forEach((pack, index) => {
          console.log(`   ${index + 1}. ${pack.packNombre}:`);
          console.log(`      Monto: $${pack.precioTotal}`);
          console.log(`      Monto pagado: $${pack.montoPagado}`);
          console.log(`      Reservas: ${pack.reservasCompletadas}/${pack.totalReservas}`);
        });
      }
      
      if (packsPagados.length > 0) {
        console.log('\n✅ PACKS PAGADOS:');
        packsPagados.forEach((pack, index) => {
          console.log(`   ${index + 1}. ${pack.packNombre}:`);
          console.log(`      Monto: $${pack.precioTotal}`);
          console.log(`      Monto pagado: $${pack.montoPagado}`);
          console.log(`      Reservas: ${pack.reservasCompletadas}/${pack.totalReservas}`);
        });
      }
      
      // Verificar que el total incluye ambos tipos
      const totalMontoCalculado = response.data.packsDelMes.reduce((sum, pack) => {
        return sum + pack.precioProporcional;
      }, 0);
      
      console.log('\n💰 VERIFICACIÓN DE TOTALES:');
      console.log(`   Total monto packs (calculado): $${totalMontoCalculado}`);
      console.log(`   Total monto packs (reporte): $${response.data.resumenPacks.totalMontoPacks}`);
      console.log(`   Coinciden: ${Math.abs(totalMontoCalculado - response.data.resumenPacks.totalMontoPacks) < 0.01 ? '✅ SÍ' : '❌ NO'}`);
      
    } else {
      console.log('ℹ️  No hay packs para este mes');
    }

    return response.data;

  } catch (error) {
    console.error('❌ Error al obtener consolidado:', error.response?.data || error.message);
    throw error;
  }
}

async function testValidacionesPagosMensuales() {
  try {
    console.log('\n🧪 Probando validaciones de pagos mensuales...\n');

    // Test 1: Marcar pago con monto inválido
    console.log('📝 Test 1: Marcar pago con monto inválido');
    try {
      await axios.post(`${BASE_URL}/packs/pagos/marcar`, {
        pagoId: 'pago-id-invalido',
        montoPagado: -100
      }, { headers });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

    // Test 2: Reembolsar más del monto pagado
    console.log('\n📝 Test 2: Reembolsar más del monto pagado');
    try {
      await axios.post(`${BASE_URL}/packs/pagos/reembolsar`, {
        pagoId: 'pago-id-invalido',
        montoReembolsado: 10000
      }, { headers });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

    // Test 3: Obtener pagos de asignación inexistente
    console.log('\n📝 Test 3: Obtener pagos de asignación inexistente');
    try {
      await axios.get(`${BASE_URL}/packs/pagos/asignacion/asignacion-inexistente`, { headers });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🚀 Iniciando pruebas del sistema de pagos mensuales de packs\n');
  console.log('=' .repeat(80));
  
  try {
    // Asignar pack y obtener pagos
    const asignacionId = await testAsignarPackConPagosMensuales();
    const pagos = await testObtenerPagosPorAsignacion(asignacionId);
    
    // Probar marcado de pago
    const pagoPagado = await testMarcarPagoMensual(pagos);
    
    // Probar reembolso
    await testReembolsarPagoMensual(pagoPagado);
    
    // Probar otros endpoints
    await testObtenerPagosPorUsuario();
    await testObtenerPagosPendientes();
    await testConsolidadoConPagosMensuales();
    await testConsolidadoConPacksPendientes();
    await testConsolidadoConPacksCancelados();
    await testConsolidadoConReservasCanceladas();
    await testValidacionesPagosMensuales();
    
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
  testAsignarPackConPagosMensuales,
  testObtenerPagosPorAsignacion,
  testMarcarPagoMensual,
  testReembolsarPagoMensual,
  testObtenerPagosPorUsuario,
  testObtenerPagosPendientes,
  testConsolidadoConPagosMensuales,
  testConsolidadoConPacksPendientes,
  testConsolidadoConPacksCancelados,
  testConsolidadoConReservasCanceladas,
  testValidacionesPagosMensuales,
  runAllTests
};
