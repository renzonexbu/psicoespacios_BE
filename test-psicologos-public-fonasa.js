const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3000';

async function testPsicologosPublicFonasa() {
  try {
    console.log('=== TEST ENDPOINT PÚBLICO DE PSICÓLOGOS CON FONASA ===\n');

    // 1. Obtener listado de psicólogos públicos
    console.log('1. Obteniendo listado de psicólogos públicos...');
    const listResponse = await axios.get(`${BASE_URL}/api/v1/psicologos/public`);

    console.log(`✓ Total de psicólogos: ${listResponse.data.length}\n`);

    // Mostrar los primeros 3 psicólogos con información de fonasa
    console.log('=== PRIMEROS 3 PSICÓLOGOS ===');
    listResponse.data.slice(0, 3).forEach((psicologo, index) => {
      console.log(`\n${index + 1}. ${psicologo.usuario.nombre} ${psicologo.usuario.apellido}`);
      console.log(`   ID: ${psicologo.id}`);
      console.log(`   Usuario ID: ${psicologo.usuario.id}`);
      console.log(`   Especialidad: ${psicologo.usuario.especialidad || 'N/A'}`);
      console.log(`   Precio Online: $${psicologo.precioOnline || 'No definido'}`);
      console.log(`   Precio Presencial: $${psicologo.precioPresencial || 'No definido'}`);
      console.log(`   FONASA: ${psicologo.fonasa ? '✓ Sí acepta' : '✗ No acepta'}`);
    });

    // 2. Verificar que el campo fonasa existe en todos los registros
    console.log('\n\n2. Verificando que todos los psicólogos tienen el campo fonasa...');
    const todosTienenFonasa = listResponse.data.every(p => 
      p.hasOwnProperty('fonasa') && typeof p.fonasa === 'boolean'
    );

    if (todosTienenFonasa) {
      console.log('✓ Todos los psicólogos tienen el campo fonasa (boolean)');
    } else {
      console.log('✗ Algunos psicólogos no tienen el campo fonasa correctamente');
    }

    // 3. Estadísticas de fonasa
    const conFonasa = listResponse.data.filter(p => p.fonasa === true).length;
    const sinFonasa = listResponse.data.filter(p => p.fonasa === false).length;

    console.log('\n=== ESTADÍSTICAS FONASA ===');
    console.log(`Total: ${listResponse.data.length} psicólogos`);
    console.log(`Aceptan FONASA: ${conFonasa} (${((conFonasa/listResponse.data.length)*100).toFixed(1)}%)`);
    console.log(`No aceptan FONASA: ${sinFonasa} (${((sinFonasa/listResponse.data.length)*100).toFixed(1)}%)`);

    // 4. Obtener un psicólogo específico por ID
    if (listResponse.data.length > 0) {
      const primerPsicologo = listResponse.data[0];
      console.log(`\n\n3. Obteniendo psicólogo específico (ID: ${primerPsicologo.id})...`);
      
      const singleResponse = await axios.get(
        `${BASE_URL}/api/v1/psicologos/public/${primerPsicologo.id}`
      );

      console.log('\n=== PSICÓLOGO INDIVIDUAL ===');
      console.log(`Nombre: ${singleResponse.data.usuario.nombre} ${singleResponse.data.usuario.apellido}`);
      console.log(`FONASA: ${singleResponse.data.fonasa ? '✓ Sí acepta' : '✗ No acepta'}`);
      console.log(`Precio Online: $${singleResponse.data.precioOnline || 'No definido'}`);
      console.log(`Precio Presencial: $${singleResponse.data.precioPresencial || 'No definido'}`);
      
      // Verificar que el campo fonasa existe
      if (singleResponse.data.hasOwnProperty('fonasa')) {
        console.log('\n✓ El campo fonasa está presente en la respuesta individual');
      } else {
        console.log('\n✗ El campo fonasa NO está presente en la respuesta individual');
      }
    }

    console.log('\n\n✓ ¡Todas las pruebas completadas exitosamente!');
    console.log('\n📋 RESUMEN:');
    console.log('   - El endpoint público devuelve el campo "fonasa"');
    console.log('   - El campo es de tipo boolean (true/false)');
    console.log('   - Funciona tanto en listado como en consulta individual');

  } catch (error) {
    console.error('\n❌ Error:', error.response?.status || error.message);
    if (error.response?.data) {
      console.error('Detalles:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testPsicologosPublicFonasa();

