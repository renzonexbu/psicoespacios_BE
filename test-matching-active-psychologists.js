const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testMatchingWithActivePsychologists() {
  try {
    console.log('🧪 Probando matching con psicólogos activos...\n');

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
      
      // Filtros logísticos
      genero: 'F',
      modalidad_preferida: ['Online', 'Presencial'],
      genero_psicologo_preferido: ['Mujer', 'Indiferente']
    };

    console.log('📝 Datos del formulario:');
    console.log(JSON.stringify(formularioData, null, 2));
    console.log('\n');

    const response = await axios.post(`${BASE_URL}/matching/calcular-con-respuestas`, formularioData);
    
    console.log('✅ Matching calculado exitosamente!');
    console.log('📊 Respuesta:', JSON.stringify(response.data, null, 2));
    
    // Verificar que todos los psicólogos devueltos tienen cuenta activa
    const top3Matches = response.data.data.top3Matches;
    
    console.log('\n🔍 Verificando psicólogos devueltos:');
    for (let i = 0; i < top3Matches.length; i++) {
      const match = top3Matches[i];
      console.log(`\n${i + 1}. Psicólogo ID: ${match.psicologoId}`);
      console.log(`   Nombre: ${match.nombrePsicologo}`);
      console.log(`   Puntaje: ${match.puntajeTotal}`);
      console.log(`   Porcentaje: ${match.porcentajeCoincidencia}%`);
      
      // Verificar que el psicólogo tiene cuenta activa
      try {
        const psicologoResponse = await axios.get(`${BASE_URL}/psicologos/${match.psicologoId}`);
        console.log(`   ✅ Cuenta activa: ${psicologoResponse.data.usuario.estado}`);
      } catch (error) {
        console.log(`   ❌ Error al verificar cuenta: ${error.response?.data?.message || error.message}`);
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

async function testGetAllPsychologists() {
  try {
    console.log('\n🧪 Verificando todos los psicólogos en el sistema...\n');

    const response = await axios.get(`${BASE_URL}/psicologos`);
    
    console.log('📊 Total de psicólogos encontrados:', response.data.length);
    
    const psicologosActivos = response.data.filter(p => p.usuario.estado === 'ACTIVO');
    const psicologosInactivos = response.data.filter(p => p.usuario.estado !== 'ACTIVO');
    
    console.log('✅ Psicólogos activos:', psicologosActivos.length);
    console.log('❌ Psicólogos inactivos:', psicologosInactivos.length);
    
    if (psicologosInactivos.length > 0) {
      console.log('\n📋 Psicólogos inactivos:');
      psicologosInactivos.forEach(p => {
        console.log(`- ${p.usuario.nombre} ${p.usuario.apellido} (${p.usuario.estado})`);
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener psicólogos:');
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
  console.log('🚀 Iniciando pruebas de matching con psicólogos activos...\n');
  
  try {
    // Primero verificar todos los psicólogos
    await testGetAllPsychologists();
    
    // Luego probar el matching
    await testMatchingWithActivePsychologists();
    
    console.log('\n🎉 Todas las pruebas completadas exitosamente!');
  } catch (error) {
    console.log('\n💥 Algunas pruebas fallaron. Revisa los errores arriba.');
    process.exit(1);
  }
}

// Ejecutar las pruebas
main();
