const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3000';

// Token de autenticación ADMIN (reemplazar con un token válido)
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi1pZCIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTUxNjIzOTAyMn0.admin-token-here';

const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testReservasPorSedeConPack(sedeId) {
  try {
    console.log(`🧪 Probando endpoint de reservas por sede con información de pack...\n`);
    console.log(`📍 Sede ID: ${sedeId}\n`);

    const response = await axios.get(`${BASE_URL}/reservas/admin/sede/${sedeId}`, { headers });
    
    console.log('✅ Reservas por sede obtenidas:');
    console.log('=' .repeat(80));
    
    if (response.data && response.data.length > 0) {
      console.log(`📊 Total reservas encontradas: ${response.data.length}\n`);
      
      // Separar reservas con pack y sin pack
      const reservasConPack = response.data.filter(r => r.pack !== null);
      const reservasSinPack = response.data.filter(r => r.pack === null);
      
      console.log(`📦 Reservas con pack: ${reservasConPack.length}`);
      console.log(`📅 Reservas individuales: ${reservasSinPack.length}\n`);
      
      // Mostrar reservas con pack
      if (reservasConPack.length > 0) {
        console.log('📦 RESERVAS CON PACK:');
        console.log('=' .repeat(60));
        
        reservasConPack.forEach((reserva, index) => {
          console.log(`${index + 1}. Reserva ID: ${reserva.id}`);
          console.log(`   📅 Fecha: ${reserva.fecha}`);
          console.log(`   ⏰ Horario: ${reserva.horaInicio} - ${reserva.horaFin}`);
          console.log(`   📦 Box: ${reserva.box?.numero} (${reserva.box?.sede?.nombre})`);
          console.log(`   👤 Psicólogo: ${reserva.psicologo?.nombre} ${reserva.psicologo?.apellido}`);
          console.log(`   💰 Precio: $${reserva.precio}`);
          console.log(`   📊 Estado: ${reserva.estado}`);
          console.log(`   💳 Estado pago: ${reserva.estadoPago}`);
          
          console.log(`   📦 INFORMACIÓN DEL PACK:`);
          console.log(`      Pack ID: ${reserva.pack.packId}`);
          console.log(`      Nombre: ${reserva.pack.packNombre}`);
          console.log(`      Descripción: ${reserva.pack.packDescripcion || 'Sin descripción'}`);
          console.log(`      Precio pack: $${reserva.pack.packPrecio}`);
          console.log(`      Estado asignación: ${reserva.pack.estadoAsignacion}`);
          console.log(`      Recurrente: ${reserva.pack.recurrente ? 'Sí' : 'No'}`);
          console.log(`      Fecha asignación: ${reserva.pack.fechaAsignacion}`);
          console.log('');
        });
      }
      
      // Mostrar reservas sin pack
      if (reservasSinPack.length > 0) {
        console.log('📅 RESERVAS INDIVIDUALES:');
        console.log('=' .repeat(60));
        
        reservasSinPack.forEach((reserva, index) => {
          console.log(`${index + 1}. Reserva ID: ${reserva.id}`);
          console.log(`   📅 Fecha: ${reserva.fecha}`);
          console.log(`   ⏰ Horario: ${reserva.horaInicio} - ${reserva.horaFin}`);
          console.log(`   📦 Box: ${reserva.box?.numero} (${reserva.box?.sede?.nombre})`);
          console.log(`   👤 Psicólogo: ${reserva.psicologo?.nombre} ${reserva.psicologo?.apellido}`);
          console.log(`   💰 Precio: $${reserva.precio}`);
          console.log(`   📊 Estado: ${reserva.estado}`);
          console.log(`   💳 Estado pago: ${reserva.estadoPago}`);
          console.log(`   📦 Pack: No pertenece a ningún pack`);
          console.log('');
        });
      }
      
      // Estadísticas
      console.log('📊 ESTADÍSTICAS:');
      console.log('=' .repeat(60));
      
      const estados = {};
      const estadosPago = {};
      const packs = {};
      
      response.data.forEach(reserva => {
        estados[reserva.estado] = (estados[reserva.estado] || 0) + 1;
        estadosPago[reserva.estadoPago] = (estadosPago[reserva.estadoPago] || 0) + 1;
        
        if (reserva.pack) {
          const packNombre = reserva.pack.packNombre;
          packs[packNombre] = (packs[packNombre] || 0) + 1;
        }
      });
      
      console.log('📊 Por estado:');
      Object.entries(estados).forEach(([estado, count]) => {
        console.log(`   ${estado}: ${count}`);
      });
      
      console.log('\n💳 Por estado de pago:');
      Object.entries(estadosPago).forEach(([estado, count]) => {
        console.log(`   ${estado}: ${count}`);
      });
      
      if (Object.keys(packs).length > 0) {
        console.log('\n📦 Por pack:');
        Object.entries(packs).forEach(([packNombre, count]) => {
          console.log(`   ${packNombre}: ${count} reservas`);
        });
      }
      
    } else {
      console.log('ℹ️  No hay reservas para esta sede');
    }

    return response.data;

  } catch (error) {
    console.error('❌ Error al obtener reservas:', error.response?.data || error.message);
    throw error;
  }
}

async function testValidacionesReservasSede() {
  try {
    console.log('\n🧪 Probando validaciones del endpoint de reservas por sede...\n');

    // Test 1: Sede inexistente
    console.log('📝 Test 1: Sede inexistente');
    try {
      await axios.get(`${BASE_URL}/reservas/admin/sede/00000000-0000-0000-0000-000000000000`, { headers });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

    // Test 2: UUID inválido
    console.log('\n📝 Test 2: UUID inválido');
    try {
      await axios.get(`${BASE_URL}/reservas/admin/sede/uuid-invalido`, { headers });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

    // Test 3: Sin token de admin
    console.log('\n📝 Test 3: Sin token de admin');
    try {
      await axios.get(`${BASE_URL}/reservas/admin/sede/7af6778a-d8e9-42db-973e-b4fb8379eed1`);
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

async function testCompararConYSinPack() {
  try {
    console.log('\n🧪 Probando comparación de reservas con y sin pack...\n');

    const sedeId = '7af6778a-d8e9-42db-973e-b4fb8379eed1';
    const response = await axios.get(`${BASE_URL}/reservas/admin/sede/${sedeId}`, { headers });
    
    if (response.data && response.data.length > 0) {
      const reservasConPack = response.data.filter(r => r.pack !== null);
      const reservasSinPack = response.data.filter(r => r.pack === null);
      
      console.log('📊 COMPARACIÓN DE RESERVAS:');
      console.log('=' .repeat(60));
      
      console.log(`📦 Reservas con pack: ${reservasConPack.length}`);
      console.log(`📅 Reservas individuales: ${reservasSinPack.length}`);
      
      if (reservasConPack.length > 0) {
        console.log('\n📦 CARACTERÍSTICAS DE RESERVAS CON PACK:');
        console.log(`   - Precio: Generalmente $0 (incluido en pack)`);
        console.log(`   - Estado: Mayormente ${reservasConPack[0].estado}`);
        console.log(`   - Pack asignación ID: ${reservasConPack[0].packAsignacionId}`);
        console.log(`   - Información completa del pack disponible`);
      }
      
      if (reservasSinPack.length > 0) {
        console.log('\n📅 CARACTERÍSTICAS DE RESERVAS INDIVIDUALES:');
        console.log(`   - Precio: Variable según box`);
        console.log(`   - Estado: ${reservasSinPack[0].estado}`);
        console.log(`   - Pack asignación ID: ${reservasSinPack[0].packAsignacionId || 'null'}`);
        console.log(`   - Pack: null`);
      }
      
      console.log('\n🎯 BENEFICIOS DE LA INFORMACIÓN DE PACK:');
      console.log('   - Identificación clara de reservas de pack vs individuales');
      console.log('   - Información completa del pack asignado');
      console.log('   - Estado de la asignación del pack');
      console.log('   - Precio del pack para cálculos administrativos');
      console.log('   - Fecha de asignación para auditorías');
    }

  } catch (error) {
    console.error('❌ Error en comparación:', error.response?.data || error.message);
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🚀 Iniciando pruebas de reservas por sede con información de pack\n');
  console.log('=' .repeat(80));
  
  try {
    const sedeId = '7af6778a-d8e9-42db-973e-b4fb8379eed1';
    
    // Probar endpoint principal
    await testReservasPorSedeConPack(sedeId);
    
    // Probar validaciones
    await testValidacionesReservasSede();
    
    // Probar comparación
    await testCompararConYSinPack();
    
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
  testReservasPorSedeConPack,
  testValidacionesReservasSede,
  testCompararConYSinPack,
  runAllTests
};
