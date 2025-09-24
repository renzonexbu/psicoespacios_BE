const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testSimpleUpload() {
  try {
    console.log('🔍 Iniciando prueba simple de subida...');
    
    const filePath = 'C:/Users/Renzo/Documents/b2daaece-7551-4672-a60f-41f2c949cec4.pdf';
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ Archivo no encontrado:', filePath);
      return;
    }
    
    console.log('✅ Archivo encontrado');
    
    const data = new FormData();
    data.append('archivo', fs.createReadStream(filePath));
    data.append('tipo', 'titulo');
    data.append('nombre', 'test-document-simple');
    
    console.log('📋 FormData creado');
    
    const config = {
      method: 'post',
      url: 'http://127.0.0.1:3000/psicologos/a1129fd3-5456-49e4-a11f-96563a8aacc2/documentos/upload',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMTEyOWZkMy01NDU2LTQ5ZTQtYTExZi05NjU2M2E4YWFjYzIiLCJlbWFpbCI6InJlbnpvQGdtYWlsLmNvbSIsInJvbGUiOiJQU0lDT0xPR08iLCJpYXQiOjE3NTQ5MjczNDYsImV4cCI6MTc1NTAxMzc0Nn0.2dVj1j_ITTby35Vz-TZuXlbU8l4xmknqkxI8NKPHcLo',
        ...data.getHeaders()
      },
      data: data,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: function (status) { return status < 500; }
    };
    
    console.log('🔗 Enviando request...');
    const response = await axios.request(config);
    
    console.log('📊 Response recibida:');
    console.log('  Status:', response.status);
    console.log('  Data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 201 || response.status === 200) {
      console.log('✅ ¡Éxito! Documento subido correctamente');
    } else {
      console.log('❌ Error en la subida');
    }
    
  } catch (error) {
    console.log('💥 Error:', error.message);
    if (error.response) {
      console.log('📊 Response error:', error.response.status, error.response.data);
    }
  }
}

testSimpleUpload(); 