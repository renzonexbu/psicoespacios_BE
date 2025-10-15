const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Configuración para las pruebas
const config = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Reemplazar con un token de paciente
  }
};

async function debugArchivosPaciente() {
  console.log('🔍 Debugging archivos del paciente...\n');

  try {
    // 1. Verificar que el paciente existe
    console.log('1️⃣ Verificando que el paciente existe...');
    const pacientesResponse = await axios.get(`${BASE_URL}/psicologos/0289e826-187c-48cc-b08f-2104ecfea8ae/pacientes`, {
      headers: {
        'Authorization': 'Bearer PSICOLOGO_JWT_TOKEN_HERE' // Token del psicólogo
      }
    });
    console.log('✅ Pacientes del psicólogo:', pacientesResponse.data);
    console.log('');

    // 2. Intentar obtener archivos del paciente
    console.log('2️⃣ Intentando obtener archivos del paciente...');
    const archivosResponse = await axios.get(`${BASE_URL}/pacientes/mis-archivos`, config);
    console.log('✅ Archivos obtenidos:', archivosResponse.data);
    console.log('');

    // 3. Verificar si hay registros en historial_paciente
    console.log('3️⃣ Verificando registros en historial_paciente...');
    const historialResponse = await axios.get(`${BASE_URL}/gestion/historial-paciente`, {
      headers: {
        'Authorization': 'Bearer ADMIN_JWT_TOKEN_HERE' // Token de admin
      }
    });
    console.log('✅ Registros en historial_paciente:', historialResponse.data);
    console.log('');

  } catch (error) {
    console.error('❌ Error en el debug:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔍 Error 401: Token de autenticación inválido');
      console.log('Asegúrate de usar un token válido del paciente');
    } else if (error.response?.status === 403) {
      console.log('\n🔍 Error 403: No tienes permisos');
    } else if (error.response?.status === 404) {
      console.log('\n🔍 Error 404: Recurso no encontrado');
    }
  }
}

// Ejecutar el debug
debugArchivosPaciente();



















