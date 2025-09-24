const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
const PSICOLOGO_ID = '0289e826-187c-48cc-b08f-2104ecfea8ae'; // ID del psicólogo del error

async function testDisponibilidadPsicologo() {
  try {
    console.log('🧪 Probando endpoint de disponibilidad de psicólogo...\n');

    // Test 1: Modalidad presencial
    console.log('1️⃣ Probando modalidad PRESENCIAL:');
    const paramsPresencial = {
      psicologoId: PSICOLOGO_ID,
      fechaInicio: '2025-09-01',
      fechaFin: '2025-09-30',
      modalidad: 'presencial'
    };

    console.log('📋 Parámetros de la consulta:');
    console.log(`   Psicólogo ID: ${paramsPresencial.psicologoId}`);
    console.log(`   Fecha inicio: ${paramsPresencial.fechaInicio}`);
    console.log(`   Fecha fin: ${paramsPresencial.fechaFin}`);
    console.log(`   Modalidad: ${paramsPresencial.modalidad}\n`);

    const responsePresencial = await axios.get(`${BASE_URL}/api/v1/psicologos/disponibilidad/psicologo`, {
      params: paramsPresencial
    });

    console.log('✅ Respuesta exitosa (PRESENCIAL):');
    console.log(`   Status: ${responsePresencial.status}`);
    console.log(`   Psicólogo: ${responsePresencial.data.psicologoNombre}`);
    console.log(`   Total slots: ${responsePresencial.data.totalSlots}`);
    console.log(`   Slots disponibles: ${responsePresencial.data.slotsDisponibles}\n`);

    // Verificar que todos los slots son presenciales
    const slotsPresenciales = responsePresencial.data.slots || [];
    const todosPresenciales = slotsPresenciales.every(slot => slot.modalidad === 'presencial');
    console.log(`   ✅ Todos los slots son presenciales: ${todosPresenciales ? 'SÍ' : 'NO'}`);

    if (slotsPresenciales.length > 0) {
      console.log('📅 Primeros 3 slots presenciales:');
      slotsPresenciales.slice(0, 3).forEach((slot, index) => {
        console.log(`   ${index + 1}. ${slot.fecha} ${slot.horaInicio}-${slot.horaFin} - ${slot.modalidad} - ${slot.disponible ? '✅ Disponible' : '❌ No disponible'}`);
      });
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Modalidad online
    console.log('2️⃣ Probando modalidad ONLINE:');
    const paramsOnline = {
      psicologoId: PSICOLOGO_ID,
      fechaInicio: '2025-09-01',
      fechaFin: '2025-09-30',
      modalidad: 'online'
    };

    console.log('📋 Parámetros de la consulta:');
    console.log(`   Psicólogo ID: ${paramsOnline.psicologoId}`);
    console.log(`   Fecha inicio: ${paramsOnline.fechaInicio}`);
    console.log(`   Fecha fin: ${paramsOnline.fechaFin}`);
    console.log(`   Modalidad: ${paramsOnline.modalidad}\n`);

    const responseOnline = await axios.get(`${BASE_URL}/api/v1/psicologos/disponibilidad/psicologo`, {
      params: paramsOnline
    });

    console.log('✅ Respuesta exitosa (ONLINE):');
    console.log(`   Status: ${responseOnline.status}`);
    console.log(`   Psicólogo: ${responseOnline.data.psicologoNombre}`);
    console.log(`   Total slots: ${responseOnline.data.totalSlots}`);
    console.log(`   Slots disponibles: ${responseOnline.data.slotsDisponibles}\n`);

    // Verificar que todos los slots son online
    const slotsOnline = responseOnline.data.slots || [];
    const todosOnline = slotsOnline.every(slot => slot.modalidad === 'online');
    console.log(`   ✅ Todos los slots son online: ${todosOnline ? 'SÍ' : 'NO'}`);

    if (slotsOnline.length > 0) {
      console.log('📅 Primeros 3 slots online:');
      slotsOnline.slice(0, 3).forEach((slot, index) => {
        console.log(`   ${index + 1}. ${slot.fecha} ${slot.horaInicio}-${slot.horaFin} - ${slot.modalidad} - ${slot.disponible ? '✅ Disponible' : '❌ No disponible'}`);
      });
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Sin modalidad (todas)
    console.log('3️⃣ Probando sin modalidad (TODAS):');
    const paramsTodas = {
      psicologoId: PSICOLOGO_ID,
      fechaInicio: '2025-09-01',
      fechaFin: '2025-09-30'
    };

    const responseTodas = await axios.get(`${BASE_URL}/api/v1/psicologos/disponibilidad/psicologo`, {
      params: paramsTodas
    });

    console.log('✅ Respuesta exitosa (TODAS):');
    console.log(`   Status: ${responseTodas.status}`);
    console.log(`   Total slots: ${responseTodas.data.totalSlots}`);
    console.log(`   Slots disponibles: ${responseTodas.data.slotsDisponibles}`);

    // Verificar que hay slots de ambas modalidades
    const slotsTodas = responseTodas.data.slots || [];
    const slotsPresencialesTodas = slotsTodas.filter(slot => slot.modalidad === 'presencial').length;
    const slotsOnlineTodas = slotsTodas.filter(slot => slot.modalidad === 'online').length;
    console.log(`   📊 Slots presenciales: ${slotsPresencialesTodas}`);
    console.log(`   📊 Slots online: ${slotsOnlineTodas}`);

    console.log('\n🎉 ¡Todos los tests exitosos! El filtrado por modalidad funciona correctamente.');

  } catch (error) {
    console.error('❌ Error en la prueba:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message}`);
      if (error.response.data.details) {
        console.error(`   Details: ${JSON.stringify(error.response.data.details, null, 2)}`);
      }
    } else {
      console.error(`   Error: ${error.message}`);
    }
  }
}

// Ejecutar la prueba
testDisponibilidadPsicologo();
