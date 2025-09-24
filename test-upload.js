const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

let data = new FormData();
data.append('archivo', fs.createReadStream('C:/Users/Renzo/Documents/b2daaece-7551-4672-a60f-41f2c949cec4.pdf'));
data.append('tipo', 'titulo');
data.append('nombre', 'tateta');

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'http://127.0.0.1:3000/psicologos/a1129fd3-5456-49e4-a11f-96563a8aacc2/documentos/upload',
  headers: { 
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMTEyOWZkMy01NDU2LTQ5ZTQtYTExZi05NjU2M2E4YWFjYzIiLCJlbWFpbCI6InJlbnpvQGdtYWlsLmNvbSIsInJvbGUiOiJQU0lDT0xPR08iLCJpYXQiOjE3NTQ5MjczNDYsImV4cCI6MTc1NTAxMzc0Nn0.2dVj1j_ITTby35Vz-TZuXlbU8l4xmknqkxI8NKPHcLo', 
    ...data.getHeaders()
  },
  data : data
};

console.log('🚀 Iniciando prueba de subida...');
console.log('📁 Archivo:', 'C:/Users/Renzo/Documents/b2daaece-7551-4672-a60f-41f2c949cec4.pdf');
console.log('🏷️ Tipo:', 'titulo');
console.log('📝 Nombre:', 'tateta');
console.log('🔗 URL:', config.url);

axios.request(config)
.then((response) => {
  console.log('✅ Éxito!');
  console.log('📊 Respuesta:', JSON.stringify(response.data, null, 2));
})
.catch((error) => {
  console.log('❌ Error:');
  if (error.response) {
    console.log('📊 Status:', error.response.status);
    console.log('📝 Mensaje:', error.response.data);
  } else {
    console.log('💥 Error de red:', error.message);
  }
}); 