const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_PSICOLOGO_ID = 'test-psicologo-id'; // Reemplazar con un ID real

async function testDocumentosPsicologo() {
  console.log('🧪 Probando funcionalidad de documentos de psicólogos...\n');

  try {
    // 1. Crear un documento (título)
    console.log('1. Creando documento de título...');
    const createResponse = await axios.post(`${BASE_URL}/psicologos/${TEST_PSICOLOGO_ID}/documentos`, {
      tipo: 'titulo',
      nombre: 'Licenciatura en Psicología',
      descripcion: 'Título profesional de psicólogo',
      institucion: 'Universidad de Chile',
      fechaEmision: '2020-12-15',
      numeroDocumento: 'PSI-2020-001',
      urlDocumento: 'https://ejemplo.com/documento.pdf'
    });
    console.log('✅ Documento creado:', createResponse.data);

    const documentoId = createResponse.data.id;

    // 2. Obtener todos los documentos del psicólogo
    console.log('\n2. Obteniendo todos los documentos...');
    const getAllResponse = await axios.get(`${BASE_URL}/psicologos/${TEST_PSICOLOGO_ID}/documentos`);
    console.log('✅ Documentos obtenidos:', getAllResponse.data);

    // 3. Obtener documentos por tipo
    console.log('\n3. Obteniendo documentos por tipo (titulo)...');
    const getByTypeResponse = await axios.get(`${BASE_URL}/psicologos/${TEST_PSICOLOGO_ID}/documentos/tipo/titulo`);
    console.log('✅ Documentos por tipo:', getByTypeResponse.data);

    // 4. Obtener documento específico
    console.log('\n4. Obteniendo documento específico...');
    const getByIdResponse = await axios.get(`${BASE_URL}/psicologos/${TEST_PSICOLOGO_ID}/documentos/${documentoId}`);
    console.log('✅ Documento obtenido:', getByIdResponse.data);

    // 5. Actualizar documento
    console.log('\n5. Actualizando documento...');
    const updateResponse = await axios.put(`${BASE_URL}/psicologos/${TEST_PSICOLOGO_ID}/documentos/${documentoId}`, {
      descripcion: 'Título profesional de psicólogo - Actualizado',
      verificado: true
    });
    console.log('✅ Documento actualizado:', updateResponse.data);

    // 6. Verificar documento (solo admin)
    console.log('\n6. Verificando documento...');
    try {
      const verifyResponse = await axios.post(`${BASE_URL}/psicologos/${TEST_PSICOLOGO_ID}/documentos/${documentoId}/verificar`);
      console.log('✅ Documento verificado:', verifyResponse.data);
    } catch (error) {
      console.log('⚠️ Verificación requiere permisos de admin:', error.response?.data?.message || error.message);
    }

    // 7. Eliminar documento
    console.log('\n7. Eliminando documento...');
    await axios.delete(`${BASE_URL}/psicologos/${TEST_PSICOLOGO_ID}/documentos/${documentoId}`);
    console.log('✅ Documento eliminado');

    console.log('\n🎉 Todas las pruebas completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

// Ejecutar pruebas
testDocumentosPsicologo(); 