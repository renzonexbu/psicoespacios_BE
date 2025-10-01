const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Token de autenticación (reemplazar con un token válido)
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testConsolidadoConPacks() {
  try {
    console.log('🧪 Probando consolidado mensual con packs...\n');

    const psicologoId = 'psicologo-id-aqui'; // Reemplazar con un ID válido
    const mes = '2024-01'; // Enero 2024

    console.log(`📅 Consultando consolidado para psicólogo ${psicologoId} en ${mes}`);

    const response = await axios.get(`${BASE_URL}/consolidado/mensual`, {
      params: { psicologoId, mes },
      headers
    });

    console.log('\n✅ Consolidado obtenido exitosamente:');
    console.log('=' .repeat(80));
    
    // Información básica
    console.log('📊 INFORMACIÓN BÁSICA:');
    console.log(`   Psicólogo: ${response.data.nombrePsicologo}`);
    console.log(`   Email: ${response.data.emailPsicologo}`);
    console.log(`   Mes: ${response.data.mes} (${response.data.mesNumero}/${response.data.año})`);
    console.log(`   Total reservas: ${response.data.totalReservas}`);
    console.log(`   Total monto: $${response.data.totalMonto}`);

    // Resumen de packs
    console.log('\n📦 RESUMEN DE PACKS:');
    console.log(`   Total packs: ${response.data.resumenPacks.totalPacks}`);
    console.log(`   Monto packs: $${response.data.resumenPacks.totalMontoPacks}`);
    console.log(`   Monto individuales: $${response.data.resumenPacks.totalMontoIndividuales}`);

    // Detalle de packs
    if (response.data.packsDelMes && response.data.packsDelMes.length > 0) {
      console.log('\n📋 DETALLE DE PACKS:');
      response.data.packsDelMes.forEach((pack, index) => {
        console.log(`   ${index + 1}. ${pack.packNombre}:`);
        console.log(`      Pack ID: ${pack.packId}`);
        console.log(`      Asignación ID: ${pack.asignacionId}`);
        console.log(`      Precio total: $${pack.precioTotal}`);
        console.log(`      Precio proporcional: $${pack.precioProporcional}`);
        console.log(`      Precio por reserva: $${pack.precioPorReserva}`);
        console.log(`      Total reservas: ${pack.totalReservas}`);
        console.log(`      Completadas: ${pack.reservasCompletadas}`);
        console.log(`      Canceladas: ${pack.reservasCanceladas}`);
        console.log(`      Pendientes: ${pack.reservasPendientes}`);
        console.log('');
      });
    } else {
      console.log('\n📋 No hay packs en este mes');
    }

    // Resumen por estado
    console.log('📊 RESUMEN POR ESTADO:');
    console.log(`   Completadas: ${response.data.resumen.reservasCompletadas} ($${response.data.resumen.montoCompletadas})`);
    console.log(`   Canceladas: ${response.data.resumen.reservasCanceladas} ($${response.data.resumen.montoCanceladas})`);
    console.log(`   Pendientes: ${response.data.resumen.reservasPendientes} ($${response.data.resumen.montoPendientes})`);

    // Resumen de pago
    console.log('\n💰 RESUMEN DE PAGO:');
    console.log(`   Pagadas: ${response.data.resumenPago.reservasPagadas} ($${response.data.resumenPago.montoPagadas})`);
    console.log(`   Pendientes: ${response.data.resumenPago.reservasPendientesPago} ($${response.data.resumenPago.montoPendientesPago})`);

    // Estadísticas
    console.log('\n📈 ESTADÍSTICAS:');
    console.log(`   Promedio por reserva: $${response.data.estadisticas.promedioPorReserva}`);
    console.log(`   Días con reservas: ${response.data.estadisticas.diasConReservas}`);
    console.log(`   Reservas por semana: [${response.data.estadisticas.reservasPorSemana.join(', ')}]`);

    // Verificar lógica de packs
    console.log('\n🔍 VERIFICACIÓN DE LÓGICA:');
    const totalCalculado = response.data.resumenPacks.totalMontoPacks + response.data.resumenPacks.totalMontoIndividuales;
    console.log(`   Total calculado: $${totalCalculado}`);
    console.log(`   Total reportado: $${response.data.totalMonto}`);
    console.log(`   Coincide: ${Math.abs(totalCalculado - response.data.totalMonto) < 0.01 ? '✅ Sí' : '❌ No'}`);

    return response.data;

  } catch (error) {
    console.error('❌ Error al obtener consolidado:', error.response?.data || error.message);
    throw error;
  }
}

async function testConsolidadoSinPacks() {
  try {
    console.log('\n🧪 Probando consolidado mensual SIN packs...\n');

    const psicologoId = 'psicologo-sin-packs'; // Reemplazar con un ID válido
    const mes = '2024-01';

    const response = await axios.get(`${BASE_URL}/consolidado/mensual`, {
      params: { psicologoId, mes },
      headers
    });

    console.log('✅ Consolidado sin packs obtenido:');
    console.log(`   Total packs: ${response.data.resumenPacks.totalPacks}`);
    console.log(`   Monto packs: $${response.data.resumenPacks.totalMontoPacks}`);
    console.log(`   Monto individuales: $${response.data.resumenPacks.totalMontoIndividuales}`);
    console.log(`   Total monto: $${response.data.totalMonto}`);

    // Verificar que solo hay reservas individuales
    const soloIndividuales = response.data.resumenPacks.totalMontoPacks === 0;
    console.log(`   Solo reservas individuales: ${soloIndividuales ? '✅ Sí' : '❌ No'}`);

  } catch (error) {
    console.error('❌ Error al obtener consolidado sin packs:', error.response?.data || error.message);
  }
}

async function testConsolidadoConCancelaciones() {
  try {
    console.log('\n🧪 Probando consolidado con cancelaciones de packs...\n');

    const psicologoId = 'psicologo-con-cancelaciones'; // Reemplazar con un ID válido
    const mes = '2024-01';

    const response = await axios.get(`${BASE_URL}/consolidado/mensual`, {
      params: { psicologoId, mes },
      headers
    });

    console.log('✅ Consolidado con cancelaciones obtenido:');
    
    if (response.data.packsDelMes && response.data.packsDelMes.length > 0) {
      response.data.packsDelMes.forEach((pack, index) => {
        if (pack.reservasCanceladas > 0) {
          console.log(`\n📦 Pack ${index + 1}: ${pack.packNombre}`);
          console.log(`   Precio total: $${pack.precioTotal}`);
          console.log(`   Precio proporcional: $${pack.precioProporcional}`);
          console.log(`   Total reservas: ${pack.totalReservas}`);
          console.log(`   Canceladas: ${pack.reservasCanceladas}`);
          console.log(`   Precio por reserva: $${pack.precioPorReserva}`);
          
          // Verificar cálculo proporcional
          const precioEsperado = pack.precioPorReserva * pack.reservasCompletadas;
          const diferencia = Math.abs(pack.precioProporcional - precioEsperado);
          console.log(`   Precio esperado: $${precioEsperado}`);
          console.log(`   Diferencia: $${diferencia}`);
          console.log(`   Cálculo correcto: ${diferencia < 0.01 ? '✅ Sí' : '❌ No'}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error al obtener consolidado con cancelaciones:', error.response?.data || error.message);
  }
}

async function testValidacionesConsolidado() {
  try {
    console.log('\n🧪 Probando validaciones del consolidado...\n');

    // Test 1: Mes inválido
    console.log('📝 Test 1: Mes inválido');
    try {
      await axios.get(`${BASE_URL}/consolidado/mensual`, {
        params: { psicologoId: 'test', mes: '2024-13' },
        headers
      });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

    // Test 2: Formato de mes inválido
    console.log('\n📝 Test 2: Formato de mes inválido');
    try {
      await axios.get(`${BASE_URL}/consolidado/mensual`, {
        params: { psicologoId: 'test', mes: 'enero-2024' },
        headers
      });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

    // Test 3: Psicólogo inexistente
    console.log('\n📝 Test 3: Psicólogo inexistente');
    try {
      await axios.get(`${BASE_URL}/consolidado/mensual`, {
        params: { psicologoId: 'psicologo-inexistente', mes: '2024-01' },
        headers
      });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

async function simularCalculoProporcional() {
  try {
    console.log('\n🧪 Simulando cálculo proporcional de packs...\n');

    // Simular pack con 10 reservas, precio $1000
    const packSimulado = {
      precioTotal: 1000,
      totalReservas: 10,
      reservasCompletadas: 8,
      reservasCanceladas: 2,
      reservasPendientes: 0
    };

    console.log('📦 Pack simulado:');
    console.log(`   Precio total: $${packSimulado.precioTotal}`);
    console.log(`   Total reservas: ${packSimulado.totalReservas}`);
    console.log(`   Completadas: ${packSimulado.reservasCompletadas}`);
    console.log(`   Canceladas: ${packSimulado.reservasCanceladas}`);

    // Calcular precio por reserva
    const precioPorReserva = packSimulado.precioTotal / packSimulado.totalReservas;
    console.log(`   Precio por reserva: $${precioPorReserva}`);

    // Calcular precio proporcional
    const precioProporcional = precioPorReserva * packSimulado.reservasCompletadas;
    console.log(`   Precio proporcional: $${precioProporcional}`);

    // Calcular monto cancelado
    const montoCancelado = precioPorReserva * packSimulado.reservasCanceladas;
    console.log(`   Monto cancelado: $${montoCancelado}`);

    // Verificar que suma correctamente
    const sumaTotal = precioProporcional + montoCancelado;
    console.log(`   Suma total: $${sumaTotal}`);
    console.log(`   Coincide con precio total: ${Math.abs(sumaTotal - packSimulado.precioTotal) < 0.01 ? '✅ Sí' : '❌ No'}`);

    // Ejemplo con diferentes escenarios
    const escenarios = [
      { completadas: 10, canceladas: 0, pendientes: 0 },
      { completadas: 5, canceladas: 5, pendientes: 0 },
      { completadas: 3, canceladas: 2, pendientes: 5 },
      { completadas: 0, canceladas: 10, pendientes: 0 }
    ];

    console.log('\n📊 Diferentes escenarios:');
    escenarios.forEach((escenario, index) => {
      const precioEscenario = precioPorReserva * escenario.completadas;
      console.log(`   ${index + 1}. ${escenario.completadas} completadas, ${escenario.canceladas} canceladas: $${precioEscenario}`);
    });

  } catch (error) {
    console.error('❌ Error en la simulación:', error.message);
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🚀 Iniciando pruebas de consolidado con packs\n');
  console.log('=' .repeat(80));
  
  try {
    await testConsolidadoConPacks();
    await testConsolidadoSinPacks();
    await testConsolidadoConCancelaciones();
    await testValidacionesConsolidado();
    await simularCalculoProporcional();
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
  testConsolidadoConPacks,
  testConsolidadoSinPacks,
  testConsolidadoConCancelaciones,
  testValidacionesConsolidado,
  simularCalculoProporcional,
  runAllTests
};
