const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testMatchingWithIndifferentModality() {
  try {
    console.log('🧪 Probando matching con modalidad "Indiferente"...\n');

    const formularioData = {
      // Diagnósticos principales
      diagnosticos_principales: ['Ansiedad', 'Depresión'],
      
      // Temas principales
      temas_principales: ['Autoconocimiento', 'Autoestima'],
      
      // Estilo terapéutico preferido
      estilo_terapeutico_preferido: ['Que sea auténtico/a', 'Que hable claro'],
      
      // Enfoque teórico preferido
      enfoque_teorico_preferido: ['Quiero herramientas prácticas'],
      
      // Afinidad personal preferida
      afinidad_personal_preferida: ['Genuino/a', 'Cariñoso/a'],
      
      // Filtros logísticos - MODALIDAD INDIFERENTE
      genero: 'F',
      modalidad_preferida: ['Indiferente'], // ← Esto es lo que estamos probando
      genero_psicologo_preferido: ['Mujer', 'Indiferente']
    };

    console.log('📝 Datos del formulario:');
    console.log(JSON.stringify(formularioData, null, 2));
    console.log('\n');

    const response = await axios.post(`${BASE_URL}/matching/calcular-con-respuestas`, formularioData);
    
    console.log('✅ Matching calculado exitosamente!');
    console.log('📊 Respuesta:', JSON.stringify(response.data, null, 2));
    
    // Verificar que se devolvieron resultados
    const top3Matches = response.data.data.top3Matches;
    
    if (top3Matches.length === 0) {
      console.log('❌ PROBLEMA: No se devolvieron resultados con modalidad "Indiferente"');
      return;
    }
    
    console.log(`\n🎉 ÉXITO: Se devolvieron ${top3Matches.length} resultados con modalidad "Indiferente"`);
    
    console.log('\n🔍 Detalles de los matches:');
    for (let i = 0; i < top3Matches.length; i++) {
      const match = top3Matches[i];
      console.log(`\n${i + 1}. Psicólogo ID: ${match.psicologoId}`);
      console.log(`   Nombre: ${match.nombrePsicologo}`);
      console.log(`   Puntaje: ${match.puntajeTotal}`);
      console.log(`   Porcentaje: ${match.porcentajeCoincidencia}%`);
      
      // Verificar las modalidades del psicólogo
      try {
        const psicologoResponse = await axios.get(`${BASE_URL}/psicologos/${match.psicologoId}`);
        const modalidades = psicologoResponse.data.modalidad_atencion;
        console.log(`   Modalidades: ${modalidades.join(', ')}`);
      } catch (error) {
        console.log(`   ❌ Error al obtener modalidades: ${error.response?.data?.message || error.message}`);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error en el matching:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

async function testMatchingWithSpecificModality() {
  try {
    console.log('\n🧪 Probando matching con modalidad específica "Online"...\n');

    const formularioData = {
      // Diagnósticos principales
      diagnosticos_principales: ['Ansiedad', 'Depresión'],
      
      // Temas principales
      temas_principales: ['Autoconocimiento', 'Autoestima'],
      
      // Estilo terapéutico preferido
      estilo_terapeutico_preferido: ['Que sea auténtico/a', 'Que hable claro'],
      
      // Enfoque teórico preferido
      enfoque_teorico_preferido: ['Quiero herramientas prácticas'],
      
      // Afinidad personal preferida
      afinidad_personal_preferida: ['Genuino/a', 'Cariñoso/a'],
      
      // Filtros logísticos - MODALIDAD ESPECÍFICA
      genero: 'F',
      modalidad_preferida: ['Online'], // ← Modalidad específica
      genero_psicologo_preferido: ['Mujer', 'Indiferente']
    };

    console.log('📝 Datos del formulario:');
    console.log(JSON.stringify(formularioData, null, 2));
    console.log('\n');

    const response = await axios.post(`${BASE_URL}/matching/calcular-con-respuestas`, formularioData);
    
    console.log('✅ Matching calculado exitosamente!');
    console.log('📊 Respuesta:', JSON.stringify(response.data, null, 2));
    
    const top3Matches = response.data.data.top3Matches;
    
    if (top3Matches.length === 0) {
      console.log('❌ PROBLEMA: No se devolvieron resultados con modalidad "Online"');
      return;
    }
    
    console.log(`\n🎉 ÉXITO: Se devolvieron ${top3Matches.length} resultados con modalidad "Online"`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error en el matching:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

async function main() {
  console.log('🚀 Iniciando pruebas de matching con modalidad "Indiferente"...\n');
  
  try {
    // Probar con modalidad "Indiferente"
    await testMatchingWithIndifferentModality();
    
    // Probar con modalidad específica para comparar
    await testMatchingWithSpecificModality();
    
    console.log('\n🎉 Todas las pruebas completadas exitosamente!');
  } catch (error) {
    console.log('\n💥 Algunas pruebas fallaron. Revisa los errores arriba.');
    process.exit(1);
  }
}

// Ejecutar las pruebas
main();
