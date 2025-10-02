const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3000/api/v1';

// Token de autenticación (cualquier usuario autenticado puede usar este endpoint)
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwiaWF0IjoxNTE2MjM5MDIyfQ.user-token-here';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function testGetBoxesBySede(sedeId) {
  try {
    console.log(`🧪 Probando endpoint para obtener boxes por sede...\n`);
    console.log(`🏢 Sede ID: ${sedeId}\n`);

    const response = await axios.get(`${BASE_URL}/boxes/sede/${sedeId}`, { headers });
    
    console.log('✅ Boxes obtenidos por sede:');
    console.log('=' .repeat(80));
    
    if (response.data && response.data.length > 0) {
      console.log(`📦 Total boxes encontrados: ${response.data.length}\n`);
      
      response.data.forEach((box, index) => {
        console.log(`${index + 1}. Box ID: ${box.id}`);
        console.log(`   📦 Número: ${box.numero}`);
        console.log(`   📊 Estado: ${box.estado}`);
        console.log(`   🏢 Sede: ${box.sede?.nombre || 'Sin sede'}`);
        console.log(`   📍 Dirección: ${box.sede?.direccion || 'Sin dirección'}`);
        console.log(`   📞 Teléfono: ${box.sede?.telefono || 'Sin teléfono'}`);
        console.log(`   📧 Email: ${box.sede?.email || 'Sin email'}`);
        console.log(`   📅 Creado: ${box.createdAt}`);
        console.log(`   🔄 Actualizado: ${box.updatedAt}`);
        console.log('');
      });
      
      // Estadísticas
      console.log('📊 ESTADÍSTICAS:');
      console.log('=' .repeat(60));
      
      const estados = {};
      response.data.forEach(box => {
        estados[box.estado] = (estados[box.estado] || 0) + 1;
      });
      
      console.log('📊 Por estado:');
      Object.entries(estados).forEach(([estado, count]) => {
        console.log(`   ${estado}: ${count} boxes`);
      });
      
      // Información de la sede
      if (response.data[0]?.sede) {
        console.log('\n🏢 INFORMACIÓN DE LA SEDE:');
        console.log(`   Nombre: ${response.data[0].sede.nombre}`);
        console.log(`   Dirección: ${response.data[0].sede.direccion}`);
        console.log(`   Teléfono: ${response.data[0].sede.telefono}`);
        console.log(`   Email: ${response.data[0].sede.email}`);
        console.log(`   Total boxes: ${response.data.length}`);
      }
      
    } else {
      console.log('ℹ️  No hay boxes para esta sede');
    }

    return response.data;

  } catch (error) {
    console.error('❌ Error al obtener boxes:', error.response?.data || error.message);
    throw error;
  }
}

async function testValidacionesBoxesSede() {
  try {
    console.log('\n🧪 Probando validaciones del endpoint de boxes por sede...\n');

    // Test 1: Sede inexistente
    console.log('📝 Test 1: Sede inexistente');
    try {
      await axios.get(`${BASE_URL}/boxes/sede/00000000-0000-0000-0000-000000000000`, { headers });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

    // Test 2: UUID inválido
    console.log('\n📝 Test 2: UUID inválido');
    try {
      await axios.get(`${BASE_URL}/boxes/sede/uuid-invalido`, { headers });
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

    // Test 3: Sin token de autenticación
    console.log('\n📝 Test 3: Sin token de autenticación');
    try {
      await axios.get(`${BASE_URL}/boxes/sede/7af6778a-d8e9-42db-973e-b4fb8379eed1`);
    } catch (error) {
      console.log('✅ Error esperado:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

async function testCompararConTodosLosBoxes() {
  try {
    console.log('\n🧪 Comparando con endpoint de todos los boxes...\n');

    const sedeId = '7af6778a-d8e9-42db-973e-b4fb8379eed1';

    // Obtener boxes de la sede específica
    console.log('📋 Obteniendo boxes de la sede específica...');
    const boxesSede = await axios.get(`${BASE_URL}/boxes/sede/${sedeId}`, { headers });

    // Obtener todos los boxes
    console.log('📋 Obteniendo todos los boxes...');
    const todosLosBoxes = await axios.get(`${BASE_URL}/boxes`, { headers });

    // Filtrar boxes de la sede específica de todos los boxes
    const boxesSedeDeTodos = todosLosBoxes.data.filter(box => box.sede?.id === sedeId);

    console.log('✅ Comparación de resultados:');
    console.log('=' .repeat(60));
    console.log(`📦 Boxes por sede específica: ${boxesSede.data.length}`);
    console.log(`📦 Boxes de la sede en todos los boxes: ${boxesSedeDeTodos.length}`);
    console.log(`✅ Coinciden: ${boxesSede.data.length === boxesSedeDeTodos.length ? 'SÍ' : 'NO'}`);

    if (boxesSede.data.length > 0 && boxesSedeDeTodos.length > 0) {
      console.log('\n📋 DETALLE DE LA COMPARACIÓN:');
      console.log(`   Sede consultada: ${boxesSede.data[0].sede?.nombre}`);
      console.log(`   Boxes encontrados: ${boxesSede.data.length}`);
      
      // Verificar que los IDs coinciden
      const idsSedeEspecifica = boxesSede.data.map(b => b.id).sort();
      const idsDeTodos = boxesSedeDeTodos.map(b => b.id).sort();
      const idsCoinciden = JSON.stringify(idsSedeEspecifica) === JSON.stringify(idsDeTodos);
      
      console.log(`   IDs coinciden: ${idsCoinciden ? 'SÍ' : 'NO'}`);
    }

  } catch (error) {
    console.error('❌ Error en comparación:', error.response?.data || error.message);
  }
}

async function testCasosDeUsoComunes() {
  try {
    console.log('\n🧪 Probando casos de uso comunes...\n');

    // Caso 1: Obtener boxes para mostrar en formulario de reserva
    console.log('📋 Caso 1: Obtener boxes para formulario de reserva');
    const sedeId = '7af6778a-d8e9-42db-973e-b4fb8379eed1';
    const boxes = await testGetBoxesBySede(sedeId);
    
    if (boxes && boxes.length > 0) {
      console.log('\n🎯 FORMATO PARA FORMULARIO DE RESERVA:');
      console.log('=' .repeat(60));
      
      const boxesDisponibles = boxes.filter(box => box.estado === 'disponible');
      console.log(`📦 Boxes disponibles: ${boxesDisponibles.length}`);
      
      boxesDisponibles.forEach((box, index) => {
        console.log(`   ${index + 1}. Box ${box.numero} - ${box.sede?.nombre}`);
      });
      
      console.log('\n💡 USO EN FRONTEND:');
      console.log('   - Cargar boxes al seleccionar sede');
      console.log('   - Filtrar solo boxes disponibles');
      console.log('   - Mostrar número y ubicación');
      console.log('   - Validar disponibilidad en tiempo real');
    }

    // Caso 2: Obtener boxes para administración
    console.log('\n📋 Caso 2: Obtener boxes para administración');
    console.log('🎯 FORMATO PARA ADMINISTRACIÓN:');
    console.log('=' .repeat(60));
    
    if (boxes && boxes.length > 0) {
      console.log(`📊 Total boxes: ${boxes.length}`);
      
      const estados = {};
      boxes.forEach(box => {
        estados[box.estado] = (estados[box.estado] || 0) + 1;
      });
      
      Object.entries(estados).forEach(([estado, count]) => {
        console.log(`   ${estado}: ${count}`);
      });
      
      console.log('\n💡 USO EN ADMINISTRACIÓN:');
      console.log('   - Vista completa de boxes por sede');
      console.log('   - Gestión de estados');
      console.log('   - Estadísticas de uso');
      console.log('   - Mantenimiento programado');
    }

  } catch (error) {
    console.error('❌ Error en casos de uso:', error.response?.data || error.message);
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🚀 Iniciando pruebas del endpoint de boxes por sede\n');
  console.log('=' .repeat(80));
  
  try {
    const sedeId = '7af6778a-d8e9-42db-973e-b4fb8379eed1';
    
    // Probar endpoint principal
    await testGetBoxesBySede(sedeId);
    
    // Probar validaciones
    await testValidacionesBoxesSede();
    
    // Probar comparación
    await testCompararConTodosLosBoxes();
    
    // Probar casos de uso
    await testCasosDeUsoComunes();
    
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
  testGetBoxesBySede,
  testValidacionesBoxesSede,
  testCompararConTodosLosBoxes,
  testCasosDeUsoComunes,
  runAllTests
};
