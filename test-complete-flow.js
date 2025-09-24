const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testCompleteFlow() {
  try {
    console.log('🔍 Iniciando flujo completo de subida...');
    
    const filePath = 'C:/Users/Renzo/Documents/b2daaece-7551-4672-a60f-41f2c949cec4.pdf';
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ Archivo no encontrado:', filePath);
      return;
    }
    
    console.log('✅ Archivo encontrado');
    
    // PASO 1: Subir archivo al endpoint de uploads
    console.log('\n📤 PASO 1: Subiendo archivo a /api/v1/uploads/document...');
    
    const uploadData = new FormData();
    uploadData.append('file', fs.createReadStream(filePath));
    
    const uploadConfig = {
      method: 'post',
      url: 'http://127.0.0.1:3000/api/v1/uploads/document',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMTEyOWZkMy01NDU2LTQ5ZTQtYTExZi05NjU2M2E4YWFjYzIiLCJlbWFpbCI6InJlbnpvQGdtYWlsLmNvbSIsInJvbGUiOiJQU0lDT0xPR08iLCJpYXQiOjE3NTQ5MjczNDYsImV4cCI6MTc1NTAxMzc0Nn0.2dVj1j_ITTby35Vz-TZuXlbU8l4xmknqkxI8NKPHcLo',
        ...uploadData.getHeaders()
      },
      data: uploadData,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 30000,
      validateStatus: function (status) { return status < 500; }
    };
    
    const uploadResponse = await axios.request(uploadConfig);
    console.log('📊 Response de upload:', uploadResponse.status, uploadResponse.data);
    
    if (uploadResponse.status !== 201) {
      throw new Error('Error al subir archivo');
    }
    
    const fileUrl = uploadResponse.data.url;
    console.log('✅ Archivo subido exitosamente a:', fileUrl);
    
    // PASO 2: Crear documento en la base de datos
    console.log('\n📝 PASO 2: Creando documento en la base de datos...');
    
    const documentoData = {
      tipo: 'titulo',
      nombre: 'test-document-complete-flow'
    };
    
    const documentoConfig = {
      method: 'post',
      url: 'http://127.0.0.1:3000/psicologos/a1129fd3-5456-49e4-a11f-96563a8aacc2/documentos',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMTEyOWZkMy01NDU2LTQ5ZTQtYTExZi05NjU2M2E4YWFjYzIiLCJlbWFpbCI6InJlbnpvQGdtYWlsLmNvbSIsInJvbGUiOiJQU0lDT0xPR08iLCJpYXQiOjE3NTQ5MjczNDYsImV4cCI6MTc1NTAxMzc0Nn0.2dVj1j_ITTby35Vz-TZuXlbU8l4xmknqkxI8NKPHcLo',
        'Content-Type': 'application/json'
      },
      data: documentoData,
      timeout: 30000,
      validateStatus: function (status) { return status < 500; }
    };
    
    const documentoResponse = await axios.request(documentoConfig);
    console.log('📊 Response de documento:', documentoResponse.status, documentoResponse.data);
    
    if (documentoResponse.status !== 201 && documentoResponse.status !== 200) {
      throw new Error('Error al crear documento');
    }
    
    const documentoId = documentoResponse.data.id;
    console.log('✅ Documento creado exitosamente con ID:', documentoId);
    
    // PASO 3: Actualizar la URL del documento
    console.log('\n🔗 PASO 3: Actualizando URL del documento...');
    
    const urlUpdateConfig = {
      method: 'put',
      url: `http://127.0.0.1:3000/psicologos/a1129fd3-5456-49e4-a11f-96563a8aacc2/documentos/${documentoId}/url`,
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMTEyOWZkMy01NDU2LTQ5ZTQtYTExZi05NjU2M2E4YWFjYzIiLCJlbWFpbCI6InJlbnpvQGdtYWlsLmNvbSIsInJvbGUiOiJQU0lDT0xPR08iLCJpYXQiOjE3NTQ5MjczNDYsImV4cCI6MTc1NTAxMzc0Nn0.2dVj1j_ITTby35Vz-TZuXlbU8l4xmknqkxI8NKPHcLo',
        'Content-Type': 'application/json'
      },
      data: { urlDocumento: fileUrl },
      timeout: 30000,
      validateStatus: function (status) { return status < 500; }
    };
    
    const urlUpdateResponse = await axios.request(urlUpdateConfig);
    console.log('📊 Response de actualización de URL:', urlUpdateResponse.status, urlUpdateResponse.data);
    
    if (urlUpdateResponse.status !== 200) {
      throw new Error('Error al actualizar URL del documento');
    }
    
    console.log('✅ URL del documento actualizada exitosamente');
    console.log('\n🎉 ¡FLUJO COMPLETO EXITOSO!');
    console.log('📋 Resumen:');
    console.log('  - Archivo subido a:', fileUrl);
    console.log('  - Documento creado con ID:', documentoId);
    console.log('  - URL asociada al documento');
    
  } catch (error) {
    console.log('💥 Error en el flujo completo:', error.message);
    if (error.response) {
      console.log('📊 Response error:', error.response.status, error.response.data);
    }
  }
}

testCompleteFlow(); 