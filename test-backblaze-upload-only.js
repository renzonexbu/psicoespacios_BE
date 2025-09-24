require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

console.log('🔍 Probando solo subida de archivos a Backblaze B2...\n');

// Configuración
const accessKeyId = process.env.BACKBLAZE_ACCESS_KEY_ID;
const secretAccessKey = process.env.BACKBLAZE_SECRET_ACCESS_KEY;
const region = process.env.BACKBLAZE_REGION || 'us-east-005';
const endpoint = process.env.BACKBLAZE_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
const bucketName = process.env.BACKBLAZE_BUCKET_NAME || 'psicoespacios';

console.log('📋 Configuración:');
console.log(`Bucket: ${bucketName}`);
console.log(`Region: ${region}`);
console.log(`Endpoint: ${endpoint}\n`);

// Crear cliente S3
const s3Client = new S3Client({
  region: region,
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
  forcePathStyle: true,
});

async function testUpload() {
  try {
    console.log('🔄 Probando subida de archivo de prueba...');
    
    // Crear un archivo de prueba en memoria
    const testContent = `Archivo de prueba generado el ${new Date().toISOString()}\n\nEste es un archivo de prueba para verificar la conectividad con Backblaze B2.`;
    const testKey = `test/connection-test-${Date.now()}.txt`;
    
    console.log(`📁 Subiendo archivo: ${testKey}`);
    
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
      Metadata: {
        testFile: 'true',
        uploadedAt: new Date().toISOString(),
      },
    });
    
    await s3Client.send(uploadCommand);
    
    console.log('✅ Archivo subido exitosamente!');
    console.log(`📎 URL del archivo: ${endpoint}/${bucketName}/${testKey}`);
    
    // Intentar eliminar el archivo de prueba
    console.log('\n🧹 Eliminando archivo de prueba...');
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: testKey,
    });
    
    await s3Client.send(deleteCommand);
    console.log('✅ Archivo de prueba eliminado');
    
    console.log('\n🎉 ¡Prueba completada exitosamente!');
    console.log('   El servicio de uploads debería funcionar correctamente.');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:');
    console.error(`   Tipo: ${error.name}`);
    console.error(`   Mensaje: ${error.message}`);
    
    if (error.name === 'NoSuchBucket') {
      console.error('\n💡 El bucket no existe o no tienes acceso:');
      console.error(`   Verifica que el bucket "${bucketName}" exista`);
      console.error('   Verifica que tengas permisos de lectura/escritura');
    } else if (error.name === 'AccessDenied') {
      console.error('\n💡 No tienes permisos suficientes:');
      console.error('   Verifica que tengas permisos de escritura en el bucket');
      console.error('   Verifica que la Application Key tenga los permisos correctos');
    }
  }
}

testUpload();




