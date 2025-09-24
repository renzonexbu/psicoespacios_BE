const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3000';
const JWT_TOKEN = 'TU_TOKEN_JWT_AQUI'; // Reemplazar con token válido

async function testDisponibilidad() {
  try {
    console.log('🧪 Probando endpoint de disponibilidad con logging detallado...\n');
    
    // Probar con septiembre donde hay reservas
    const response = await axios.get(
      `${BASE_URL}/api/v1/psicologos/disponibilidad/psicologo?psicologoId=0289e826-187c-48cc-b08f-2104ecfea8ae&fechaInicio=2025-09-01&fechaFin=2025-09-30&modalidad=presencial`,
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Respuesta exitosa:');
    console.log('Status:', response.status);
    
    // Analizar slots específicos que deberían estar ocupados
    const slots = response.data.slots || [];
    
    console.log('\n📊 ANÁLISIS DE SLOTS:');
    console.log(`Total de slots: ${slots.length}`);
    
    // Buscar slots específicos que sabemos que están ocupados
    const slotsOcupados = [
      { fecha: '2025-09-03', horaInicio: '09:00', horaFin: '10:00' },
      { fecha: '2025-09-17', horaInicio: '09:00', horaFin: '10:00' },
      { fecha: '2025-09-24', horaInicio: '09:00', horaFin: '10:00' }
    ];
    
    console.log('\n🔍 VERIFICANDO SLOTS ESPECÍFICOS:');
    slotsOcupados.forEach(slotEsperado => {
      const slotEncontrado = slots.find(s => 
        s.fecha === slotEsperado.fecha && 
        s.horaInicio === slotEsperado.horaInicio && 
        s.horaFin === slotEsperado.horaFin
      );
      
      if (slotEncontrado) {
        console.log(`📅 ${slotEsperado.fecha} ${slotEsperado.horaInicio}-${slotEsperado.horaFin}:`);
        console.log(`   Estado: ${slotEncontrado.disponible ? '✅ DISPONIBLE' : '❌ NO DISPONIBLE'}`);
        console.log(`   Modalidad: ${slotEncontrado.modalidad}`);
        console.log(`   Sede: ${slotEncontrado.sedeId}`);
      } else {
        console.log(`❌ ${slotEsperado.fecha} ${slotEscontrado.horaInicio}-${slotEsperado.horaFin}: NO ENCONTRADO`);
      }
    });
    
    // Mostrar todos los slots para análisis
    console.log('\n📋 TODOS LOS SLOTS:');
    slots.forEach((slot, index) => {
      console.log(`${index + 1}. ${slot.fecha} ${slot.horaInicio}-${slot.horaFin}: ${slot.disponible ? '✅' : '❌'} (${slot.modalidad})`);
    });

  } catch (error) {
    console.error('\n❌ Error en la prueba:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Función para probar fechas específicas
async function testFechaEspecifica(fecha) {
  try {
    console.log(`\n🧪 Probando fecha específica: ${fecha}`);
    
    const response = await axios.get(
      `${BASE_URL}/api/v1/psicologos/disponibilidad/psicologo?psicologoId=0289e826-187c-48cc-b08f-2104ecfea8ae&fechaInicio=${fecha}&fechaFin=${fecha}&modalidad=presencial`,
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const slots = response.data.slots || [];
    console.log(`📅 Fecha ${fecha}: ${slots.length} slots encontrados`);
    
    slots.forEach(slot => {
      console.log(`   ${slot.horaInicio}-${slot.horaFin}: ${slot.disponible ? '✅' : '❌'}`);
    });

  } catch (error) {
    console.error(`❌ Error probando fecha ${fecha}:`, error.message);
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando pruebas de disponibilidad...\n');
  
  // Probar disponibilidad general de septiembre
  await testDisponibilidad();
  
  // Probar fechas específicas donde sabemos que hay reservas
  await testFechaEspecifica('2025-09-03');
  await testFechaEspecifica('2025-09-17');
  await testFechaEspecifica('2025-09-24');
  
  console.log('\n🏁 Pruebas completadas');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testDisponibilidad, testFechaEspecifica };



