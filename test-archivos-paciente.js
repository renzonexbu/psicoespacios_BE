const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Configuración para las pruebas
const config = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Reemplazar con un token de paciente
  }
};

async function testArchivosPaciente() {
  console.log('🧪 Iniciando pruebas del sistema de archivos para pacientes...\n');

  try {
    // 1. Obtener todos los archivos del paciente
    console.log('1️⃣ Obteniendo todos los archivos del paciente...');
    const archivosResponse = await axios.get(`${BASE_URL}/pacientes/mis-archivos`, config);
    console.log('✅ Archivos obtenidos:', archivosResponse.data);
    console.log('');

    // 2. Obtener estadísticas de archivos
    console.log('2️⃣ Obteniendo estadísticas de archivos...');
    const statsResponse = await axios.get(`${BASE_URL}/pacientes/mis-archivos/estadisticas`, config);
    console.log('✅ Estadísticas:', statsResponse.data);
    console.log('');

    // 3. Filtrar archivos por tipo
    console.log('3️⃣ Filtrando archivos por tipo "documento"...');
    const archivosFiltradosResponse = await axios.get(
      `${BASE_URL}/pacientes/mis-archivos?tipo=documento`,
      config
    );
    console.log('✅ Archivos filtrados:', archivosFiltradosResponse.data);
    console.log('');

    // 4. Filtrar archivos por fecha
    const fechaDesde = new Date();
    fechaDesde.setMonth(fechaDesde.getMonth() - 1);
    
    console.log('4️⃣ Filtrando archivos del último mes...');
    const archivosFechaResponse = await axios.get(
      `${BASE_URL}/pacientes/mis-archivos?fechaDesde=${fechaDesde.toISOString()}`,
      config
    );
    console.log('✅ Archivos del último mes:', archivosFechaResponse.data);
    console.log('');

    // 5. Obtener un archivo específico (si existe)
    if (archivosResponse.data.length > 0) {
      const primerArchivo = archivosResponse.data[0];
      console.log(`5️⃣ Obteniendo archivo específico: ${primerArchivo.id}...`);
      const archivoResponse = await axios.get(
        `${BASE_URL}/pacientes/mis-archivos/${primerArchivo.id}`,
        config
      );
      console.log('✅ Archivo específico:', archivoResponse.data);
      console.log('');
    }

    console.log('🎉 Todas las pruebas completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
    
    // Información adicional para debugging
    if (error.response?.status === 401) {
      console.log('\n🔍 Error 401: Token de autenticación inválido o expirado');
    } else if (error.response?.status === 403) {
      console.log('\n🔍 Error 403: No tienes permisos para acceder a estos archivos');
    } else if (error.response?.status === 404) {
      console.log('\n🔍 Error 404: Paciente no encontrado o no tiene archivos');
    }
  }
}

// Ejecutar las pruebas
testArchivosPaciente();
































