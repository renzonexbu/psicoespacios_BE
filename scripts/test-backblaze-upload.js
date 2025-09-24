const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Configuración
const API_BASE_URL = 'http://localhost:3000/api/v1';
const UPLOAD_ENDPOINTS = {
  image: `${API_BASE_URL}/uploads/image`,
  pdf: `${API_BASE_URL}/uploads/pdf`,
  document: `${API_BASE_URL}/uploads/document`,
  profileImage: `${API_BASE_URL}/uploads/profile-image`,
};

// Función para obtener un token JWT válido
async function getAuthToken() {
  try {
    console.log('🔐 Obteniendo token de autenticación...');
    
    // Primero obtener usuarios para usar uno existente
    const usersResponse = await axios.get(`${API_BASE_URL}/users`);
    if (!usersResponse.data || usersResponse.data.length === 0) {
      throw new Error('No hay usuarios en la base de datos');
    }
    
    const user = usersResponse.data[0];
    console.log(`✅ Usuario encontrado: ${user.email}`);
    
    // Intentar hacer login (asumiendo que la contraseña es 'password' para usuarios de prueba)
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: user.email,
      password: 'password' // Asumiendo contraseña por defecto
    });
    
    if (loginResponse.data && loginResponse.data.access_token) {
      console.log('✅ Token obtenido exitosamente');
      return loginResponse.data.access_token;
    } else {
      throw new Error('No se pudo obtener el token de acceso');
    }
    
  } catch (error) {
    console.log('⚠️  No se pudo obtener token, usando endpoint público de prueba...');
    return null;
  }
}

// Función para crear un archivo de prueba
function createTestFile(type, filename) {
  const testDir = path.join(__dirname, 'test-files');
  
  // Crear directorio si no existe
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const filePath = path.join(testDir, filename);
  
  switch (type) {
    case 'image':
      // Crear un archivo de imagen simple (1x1 pixel PNG)
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xCF, 0x00,
        0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB0, 0x00, 0x00, 0x00,
        0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      fs.writeFileSync(filePath, pngBuffer);
      break;
      
    case 'pdf':
      // Crear un archivo PDF simple
      const pdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF';
      fs.writeFileSync(filePath, pdfContent);
      break;
      
    case 'document':
      // Crear un archivo de texto simple
      const textContent = 'Este es un documento de prueba para Backblaze B2.\n\nContenido de ejemplo:\n- Línea 1\n- Línea 2\n- Línea 3\n\nFecha: ' + new Date().toISOString();
      fs.writeFileSync(filePath, textContent);
      break;
  }
  
  return filePath;
}

// Función para subir archivo
async function uploadFile(endpoint, filePath, token = null) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    const headers = {
      ...formData.getHeaders(),
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log(`📤 Subiendo archivo: ${path.basename(filePath)}`);
    const response = await axios.post(endpoint, formData, { headers });
    
    console.log('✅ Archivo subido exitosamente:');
    console.log(`   - URL: ${response.data.url}`);
    console.log(`   - Filename: ${response.data.filename}`);
    console.log(`   - Size: ${response.data.size} bytes`);
    console.log(`   - Bucket: ${response.data.bucket}`);
    console.log(`   - Key: ${response.data.key}`);
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error subiendo archivo:', error.response?.data || error.message);
    throw error;
  }
}

// Función principal de prueba
async function testBackblazeUpload() {
  console.log('🧪 Iniciando prueba de integración con Backblaze B2...\n');
  console.log(`🌐 API URL: ${API_BASE_URL}`);
  console.log(`🔧 Environment: Local Development\n`);
  
  try {
    // Obtener token de autenticación
    const token = await getAuthToken();
    
    if (!token) {
      console.log('⚠️  No se pudo obtener token de autenticación');
      console.log('💡 Asegúrate de que:');
      console.log('   - La API esté corriendo en puerto 3000');
      console.log('   - Haya usuarios en la base de datos');
      console.log('   - Las credenciales de Backblaze estén configuradas\n');
      return;
    }
    
    // Crear archivos de prueba
    console.log('📁 Creando archivos de prueba...');
    const testImagePath = createTestFile('image', 'test-image.png');
    const testPdfPath = createTestFile('pdf', 'test-document.pdf');
    const testDocPath = createTestFile('document', 'test-document.txt');
    
    console.log('✅ Archivos de prueba creados\n');
    
    // Probar subida de imagen
    console.log('1️⃣ Probando subida de imagen...');
    await uploadFile(UPLOAD_ENDPOINTS.image, testImagePath, token);
    console.log('');
    
    // Probar subida de PDF
    console.log('2️⃣ Probando subida de PDF...');
    await uploadFile(UPLOAD_ENDPOINTS.pdf, testPdfPath, token);
    console.log('');
    
    // Probar subida de documento
    console.log('3️⃣ Probando subida de documento...');
    await uploadFile(UPLOAD_ENDPOINTS.document, testDocPath, token);
    console.log('');
    
    // Probar subida de imagen de perfil
    console.log('4️⃣ Probando subida de imagen de perfil...');
    await uploadFile(UPLOAD_ENDPOINTS.profileImage, testImagePath, token);
    console.log('');
    
    console.log('🎉 ¡Todas las pruebas completadas exitosamente!');
    console.log('\n📋 ENDPOINTS PROBADOS:');
    console.log(`   POST ${UPLOAD_ENDPOINTS.image} - Subir imagen`);
    console.log(`   POST ${UPLOAD_ENDPOINTS.pdf} - Subir PDF`);
    console.log(`   POST ${UPLOAD_ENDPOINTS.document} - Subir documento`);
    console.log(`   POST ${UPLOAD_ENDPOINTS.profileImage} - Subir imagen de perfil`);
    
    console.log('\n💡 Tip: Los archivos ahora están almacenados en Backblaze B2');
    console.log('     y son accesibles públicamente desde las URLs proporcionadas.');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Posibles soluciones:');
      console.log('- Verifica que el token JWT sea válido');
      console.log('- Asegúrate de que el usuario tenga permisos');
    } else if (error.response?.status === 500) {
      console.log('\n💡 Posibles soluciones:');
      console.log('- Verifica la configuración de Backblaze B2');
      console.log('- Asegúrate de que las variables de entorno estén configuradas');
      console.log('- Revisa los logs del servidor para más detalles');
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testBackblazeUpload().catch(console.error);
}

module.exports = { testBackblazeUpload }; 