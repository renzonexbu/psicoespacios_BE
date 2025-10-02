const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Token de autenticación ADMIN (reemplazar con un token válido)
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi1pZCIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTUxNjIzOTAyMn0.admin-token-here';

const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testGetUsuariosParaConsolidado() {
  try {
    console.log('🧪 Probando endpoint para obtener usuarios con actividad...\n');

    const response = await axios.get(`${BASE_URL}/consolidado/admin/usuarios`, { headers });
    
    console.log('✅ Usuarios con actividad obtenidos:');
    console.log('=' .repeat(60));
    
    if (response.data && response.data.length > 0) {
      console.log(`📊 Total usuarios con actividad: ${response.data.length}\n`);
      
      response.data.forEach((usuario, index) => {
        console.log(`${index + 1}. ${usuario.nombre}:`);
        console.log(`   ID: ${usuario.id}`);
        console.log(`   Email: ${usuario.email}`);
        console.log(`   Tiene reservas: ${usuario.tieneReservas ? '✅ Sí' : '❌ No'}`);
        console.log(`   Tiene packs: ${usuario.tienePacks ? '✅ Sí' : '❌ No'}`);
        console.log('');
      });
    } else {
      console.log('ℹ️  No hay usuarios con actividad registrada');
    }

    return response.data;

  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error.response?.data || error.message);
    throw error;
  }
}

async function testGetConsolidadoAdmin(psicologoId, mes) {
  try {
    console.log(`\n🧪 Probando consolidado administrativo para usuario ${psicologoId} en ${mes}...\n`);

    const response = await axios.get(`${BASE_URL}/consolidado/mensual/${psicologoId}`, {
      params: { mes },
      headers
    });
    
    console.log('✅ Consolidado administrativo obtenido:');
    console.log('=' .repeat(60));
    
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
      console.log('\n📋 DETALLE DE PACKS:');
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
        console.log('');
      });
    }
    
    if (response.data.detalleReservas && response.data.detalleReservas.length > 0) {
      console.log('\n📅 DETALLE DE RESERVAS INDIVIDUALES:');
      response.data.detalleReservas.forEach((reserva, index) => {
        console.log(`   ${index + 1}. ${reserva.fecha} ${reserva.horaInicio}-${reserva.horaFin}`);
        console.log(`      Box: ${reserva.nombreBox}`);
        console.log(`      Precio: $${reserva.precio}`);
        console.log(`      Estado: ${reserva.estado}`);
        console.log(`      Estado pago: ${reserva.estadoPago}`);
        console.log('');
      });
    }

    return response.data;

  } catch (error) {
    console.error('❌ Error al obtener consolidado:', error.response?.data || error.message);
    throw error;
  }
}

async function testValidacionesAdmin() {
  try {
    console.log('\n🧪 Probando validaciones del endpoint administrativo...\n');

    // Test 1: Mes inválido
    console.log('📝 Test 1: Mes inválido');
    try {
      await axios.get(`${BASE_URL}/consolidado/mensual/usuario-id-valido`, {
        params: { mes: '2024-13' }, // Mes inválido
        headers
      });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

    // Test 2: UUID inválido
    console.log('\n📝 Test 2: UUID inválido');
    try {
      await axios.get(`${BASE_URL}/consolidado/mensual/uuid-invalido`, {
        params: { mes: '2024-01' },
        headers
      });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

    // Test 3: Mes faltante
    console.log('\n📝 Test 3: Mes faltante');
    try {
      await axios.get(`${BASE_URL}/consolidado/mensual/usuario-id-valido`, {
        headers
      });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

    // Test 4: Usuario inexistente
    console.log('\n📝 Test 4: Usuario inexistente');
    try {
      await axios.get(`${BASE_URL}/consolidado/mensual/00000000-0000-0000-0000-000000000000`, {
        params: { mes: '2024-01' },
        headers
      });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

async function testCompararConsolidados() {
  try {
    console.log('\n🧪 Probando comparación entre consolidado normal y administrativo...\n');

    const psicologoId = 'psicologo-id-aqui';
    const mes = '2024-01';

    // Obtener consolidado como psicólogo (simulado)
    console.log('📊 Obteniendo consolidado como psicólogo...');
    const consolidadoPsicologo = await axios.get(`${BASE_URL}/consolidado/mensual`, {
      params: { psicologoId, mes },
      headers: { ...headers, 'Authorization': `Bearer PSICOLOGO_TOKEN` } // Token de psicólogo
    }).catch(() => null);

    // Obtener consolidado como admin
    console.log('📊 Obteniendo consolidado como admin...');
    const consolidadoAdmin = await axios.get(`${BASE_URL}/consolidado/mensual/${psicologoId}`, {
      params: { mes },
      headers
    });

    console.log('✅ Comparación de consolidados:');
    console.log('=' .repeat(60));
    
    if (consolidadoPsicologo) {
      console.log('📋 DATOS COINCIDENTES:');
      console.log(`   Total reservas: ${consolidadoPsicologo.data.totalReservas} vs ${consolidadoAdmin.data.totalReservas}`);
      console.log(`   Total monto: $${consolidadoPsicologo.data.totalMonto} vs $${consolidadoAdmin.data.totalMonto}`);
      console.log(`   Total packs: ${consolidadoPsicologo.data.resumenPacks.totalPacks} vs ${consolidadoAdmin.data.resumenPacks.totalPacks}`);
      
      const coinciden = 
        consolidadoPsicologo.data.totalReservas === consolidadoAdmin.data.totalReservas &&
        consolidadoPsicologo.data.totalMonto === consolidadoAdmin.data.totalMonto &&
        consolidadoPsicologo.data.resumenPacks.totalPacks === consolidadoAdmin.data.resumenPacks.totalPacks;
      
      console.log(`   ✅ Datos coinciden: ${coinciden ? 'SÍ' : 'NO'}`);
    } else {
      console.log('ℹ️  No se pudo obtener consolidado como psicólogo (token inválido)');
    }

    console.log('\n🎯 VENTAJAS DEL ENDPOINT ADMINISTRATIVO:');
    console.log('   - Acceso a cualquier usuario sin restricciones');
    console.log('   - Validaciones robustas de entrada');
    console.log('   - Información completa para control administrativo');
    console.log('   - Útil para auditorías y reportes gerenciales');

  } catch (error) {
    console.error('❌ Error en comparación:', error.response?.data || error.message);
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🚀 Iniciando pruebas de endpoints administrativos de consolidado\n');
  console.log('=' .repeat(80));
  
  try {
    // Obtener lista de usuarios
    const usuarios = await testGetUsuariosParaConsolidado();
    
    if (usuarios && usuarios.length > 0) {
      // Probar consolidado con el primer usuario
      const primerUsuario = usuarios[0];
      await testGetConsolidadoAdmin(primerUsuario.id, '2024-01');
    }
    
    // Probar validaciones
    await testValidacionesAdmin();
    
    // Probar comparación
    await testCompararConsolidados();
    
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
  testGetUsuariosParaConsolidado,
  testGetConsolidadoAdmin,
  testValidacionesAdmin,
  testCompararConsolidados,
  runAllTests
};
