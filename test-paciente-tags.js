const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Configuración para las pruebas
const config = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Reemplazar con un token válido
  }
};

async function testPacienteTags() {
  console.log('🧪 Iniciando pruebas del sistema de tags para pacientes...\n');

  try {
    // 1. Listar pacientes con tags
    console.log('1️⃣ Listando pacientes con tags...');
    const pacientesResponse = await axios.get(`${BASE_URL}/pacientes/tags`, config);
    console.log('✅ Pacientes con tags:', pacientesResponse.data);
    console.log('');

    // 2. Asignar tag a un paciente (reemplazar con un ID real)
    const pacienteId = '334643cd-3f5d-42b9-829c-a5f25197eb1a'; // ID del paciente de la prueba
    console.log(`2️⃣ Asignando tag al paciente ${pacienteId}...`);
    const asignarTagResponse = await axios.post(
      `${BASE_URL}/pacientes/${pacienteId}/tag`,
      { tag: 'Prioridad Alta' },
      config
    );
    console.log('✅ Tag asignado:', asignarTagResponse.data);
    console.log('');

    // 3. Obtener tag del paciente
    console.log(`3️⃣ Obteniendo tag del paciente ${pacienteId}...`);
    const obtenerTagResponse = await axios.get(`${BASE_URL}/pacientes/${pacienteId}/tag`, config);
    console.log('✅ Tag obtenido:', obtenerTagResponse.data);
    console.log('');

    // 4. Remover tag del paciente
    console.log(`4️⃣ Removiendo tag del paciente ${pacienteId}...`);
    const removerTagResponse = await axios.delete(
      `${BASE_URL}/pacientes/${pacienteId}/tag`,
      { 
        data: { motivo: 'Tag ya no es necesario' },
        ...config 
      }
    );
    console.log('✅ Tag removido:', removerTagResponse.data);
    console.log('');

    console.log('🎉 Todas las pruebas completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
    
    // Información adicional para debugging
    if (error.response?.status === 403) {
      console.log('\n🔍 Posibles causas del error 403:');
      console.log('- El psicólogo no tiene acceso a este paciente');
      console.log('- Verificar que el paciente está asignado al psicólogo');
      console.log('- Verificar que el JWT token es del psicólogo correcto');
    }
  }
}

// Ejecutar las pruebas
testPacienteTags();
