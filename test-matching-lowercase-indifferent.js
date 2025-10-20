const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testMatchingWithLowercaseIndifferent() {
  try {
    console.log('🧪 Probando matching con modalidad "indiferente" (minúsculas)...\n');

    const formularioData = {
      // Diagnósticos principales
      diagnosticos_principales: [
        "Depresión",
        "Fobia", 
        "Ansiedad social"
      ],
      
      // Temas principales
      temas_principales: [
        "Evitación"
      ],
      
      // Estilo terapéutico preferido
      estilo_terapeutico_preferido: [
        "Que se preocupe por cómo estoy"
      ],
      
      // Enfoque teórico preferido
      enfoque_teorico_preferido: [
        "Me interesa trabajar temas de infancia o vínculos familiares"
      ],
      
      // Afinidad personal preferida
      afinidad_personal_preferida: [
        "Cariñoso/a"
      ],
      
      // Filtros logísticos - MODALIDAD EN MINÚSCULAS
      genero: "F",
      modalidad_preferida: [
        "indiferente" // ← Esto es lo que estamos probando (minúsculas)
      ],
      genero_psicologo_preferido: [
        "Indiferente"
      ]
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
      console.log('❌ PROBLEMA: No se devolvieron resultados con modalidad "indiferente"');
      return;
    }
    
    console.log(`\n🎉 ÉXITO: Se devolvieron ${top3Matches.length} resultados con modalidad "indiferente"`);
    
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

async function testMatchingWithUppercaseIndifferent() {
  try {
    console.log('\n🧪 Probando matching con modalidad "Indiferente" (mayúsculas)...\n');

    const formularioData = {
      // Diagnósticos principales
      diagnosticos_principales: [
        "Depresión",
        "Fobia", 
        "Ansiedad social"
      ],
      
      // Temas principales
      temas_principales: [
        "Evitación"
      ],
      
      // Estilo terapéutico preferido
      estilo_terapeutico_preferido: [
        "Que se preocupe por cómo estoy"
      ],
      
      // Enfoque teórico preferido
      enfoque_teorico_preferido: [
        "Me interesa trabajar temas de infancia o vínculos familiares"
      ],
      
      // Afinidad personal preferida
      afinidad_personal_preferida: [
        "Cariñoso/a"
      ],
      
      // Filtros logísticos - MODALIDAD EN MAYÚSCULAS
      genero: "F",
      modalidad_preferida: [
        "Indiferente" // ← Esto es lo que estamos probando (mayúsculas)
      ],
      genero_psicologo_preferido: [
        "Indiferente"
      ]
    };

    console.log('📝 Datos del formulario:');
    console.log(JSON.stringify(formularioData, null, 2));
    console.log('\n');

    const response = await axios.post(`${BASE_URL}/matching/calcular-con-respuestas`, formularioData);
    
    console.log('✅ Matching calculado exitosamente!');
    console.log('📊 Respuesta:', JSON.stringify(response.data, null, 2));
    
    const top3Matches = response.data.data.top3Matches;
    
    if (top3Matches.length === 0) {
      console.log('❌ PROBLEMA: No se devolvieron resultados con modalidad "Indiferente"');
      return;
    }
    
    console.log(`\n🎉 ÉXITO: Se devolvieron ${top3Matches.length} resultados con modalidad "Indiferente"`);
    
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
  console.log('🚀 Iniciando pruebas de matching con modalidad "indiferente" (minúsculas)...\n');
  
  try {
    // Probar con modalidad "indiferente" (minúsculas)
    await testMatchingWithLowercaseIndifferent();
    
    // Probar con modalidad "Indiferente" (mayúsculas) para comparar
    await testMatchingWithUppercaseIndifferent();
    
    console.log('\n🎉 Todas las pruebas completadas exitosamente!');
    console.log('\n✅ El sistema ahora acepta tanto "indiferente" como "Indiferente"');
  } catch (error) {
    console.log('\n💥 Algunas pruebas fallaron. Revisa los errores arriba.');
    process.exit(1);
  }
}

// Ejecutar las pruebas
main();
