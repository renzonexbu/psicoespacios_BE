const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const TEST_PSICOLOGO_ID = 'test-psicologo-id'; // Reemplazar con un ID real

async function testDocumentosPsicologoWithUpload() {
  console.log('🧪 Probando funcionalidad de documentos de psicólogos con subida de archivos...\n');

  try {
    // 1. Crear un documento con archivo (título)
    console.log('1. Subiendo documento de título con archivo...');
    
    const formData = new FormData();
    formData.append('tipo', 'titulo');
    formData.append('nombre', 'Licenciatura en Psicología');
    formData.append('descripcion', 'Título profesional de psicólogo');
    formData.append('institucion', 'Universidad de Chile');
    formData.append('fechaEmision', '2020-12-15');
    formData.append('numeroDocumento', 'PSI-2020-001');
    
    // Crear un archivo de prueba (PDF simulado)
    const testPdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000111 00000 n \n0000000212 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF';
    
    // Crear archivo temporal
    const tempPdfPath = path.join(__dirname, 'test-document.pdf');
    fs.writeFileSync(tempPdfPath, testPdfContent);
    
    formData.append('archivo', fs.createReadStream(tempPdfPath), {
      filename: 'test-document.pdf',
      contentType: 'application/pdf'
    });

    const createResponse = await axios.post(
      `${BASE_URL}/psicologos/${TEST_PSICOLOGO_ID}/documentos/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Reemplazar con token real
        }
      }
    );
    
    console.log('✅ Documento con archivo subido:', createResponse.data);
    
    // Limpiar archivo temporal
    fs.unlinkSync(tempPdfPath);

    const documentoId = createResponse.data.id;

    // 2. Obtener todos los documentos del psicólogo
    console.log('\n2. Obteniendo todos los documentos...');
    const getAllResponse = await axios.get(`${BASE_URL}/psicologos/${TEST_PSICOLOGO_ID}/documentos`, {
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
      }
    });
    console.log('✅ Documentos obtenidos:', getAllResponse.data);

    // 3. Obtener documentos por tipo
    console.log('\n3. Obteniendo documentos por tipo (titulo)...');
    const getByTypeResponse = await axios.get(`${BASE_URL}/psicologos/${TEST_PSICOLOGO_ID}/documentos/tipo/titulo`, {
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
      }
    });
    console.log('✅ Documentos por tipo:', getByTypeResponse.data);

    // 4. Obtener documento específico
    console.log('\n4. Obteniendo documento específico...');
    const getByIdResponse = await axios.get(`${BASE_URL}/psicologos/${TEST_PSICOLOGO_ID}/documentos/${documentoId}`, {
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
      }
    });
    console.log('✅ Documento obtenido:', getByIdResponse.data);

    // 5. Actualizar documento con nuevo archivo
    console.log('\n5. Actualizando documento con nuevo archivo...');
    
    const updateFormData = new FormData();
    updateFormData.append('descripcion', 'Título profesional de psicólogo - Actualizado con nuevo archivo');
    updateFormData.append('verificado', 'true');
    
    // Crear nuevo archivo de prueba
    const newTestPdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Updated PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000111 00000 n \n0000000212 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF';
    
    const newTempPdfPath = path.join(__dirname, 'updated-test-document.pdf');
    fs.writeFileSync(newTempPdfPath, newTestPdfContent);
    
    updateFormData.append('archivo', fs.createReadStream(newTempPdfPath), {
      filename: 'updated-test-document.pdf',
      contentType: 'application/pdf'
    });

    const updateResponse = await axios.put(
      `${BASE_URL}/psicologos/${TEST_PSICOLOGO_ID}/documentos/${documentoId}/upload`,
      updateFormData,
      {
        headers: {
          ...updateFormData.getHeaders(),
          'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
        }
      }
    );
    
    console.log('✅ Documento actualizado con nuevo archivo:', updateResponse.data);
    
    // Limpiar archivo temporal
    fs.unlinkSync(newTempPdfPath);

    // 6. Verificar documento (solo admin)
    console.log('\n6. Verificando documento...');
    try {
      const verifyResponse = await axios.post(
        `${BASE_URL}/psicologos/${TEST_PSICOLOGO_ID}/documentos/${documentoId}/verificar`,
        {},
        {
          headers: {
            'Authorization': 'Bearer YOUR_ADMIN_JWT_TOKEN_HERE'
          }
        }
      );
      console.log('✅ Documento verificado:', verifyResponse.data);
    } catch (error) {
      console.log('⚠️ Verificación requiere permisos de admin:', error.response?.data?.message || error.message);
    }

    // 7. Eliminar documento
    console.log('\n7. Eliminando documento...');
    await axios.delete(`${BASE_URL}/psicologos/${TEST_PSICOLOGO_ID}/documentos/${documentoId}`, {
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
      }
    });
    console.log('✅ Documento eliminado');

    console.log('\n🎉 Todas las pruebas completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

// Ejecutar pruebas
testDocumentosPsicologoWithUpload(); 