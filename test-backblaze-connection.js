require('dotenv').config();
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

console.log('🔍 Verificando configuración de Backblaze B2...\n');

// Mostrar variables de entorno
console.log('📋 Variables de entorno:');
console.log(`BACKBLAZE_ACCESS_KEY_ID: ${process.env.BACKBLAZE_ACCESS_KEY_ID ? '✅ Configurada' : '❌ No configurada'}`);
console.log(`BACKBLAZE_SECRET_ACCESS_KEY: ${process.env.BACKBLAZE_SECRET_ACCESS_KEY ? '✅ Configurada' : '❌ No configurada'}`);
console.log(`BACKBLAZE_ACCOUNT_ID: ${process.env.BACKBLAZE_ACCOUNT_ID ? '✅ Configurada' : '❌ No configurada'}`);
console.log(`BACKBLAZE_APPLICATION_KEY: ${process.env.BACKBLAZE_APPLICATION_KEY ? '✅ Configurada' : '❌ No configurada'}`);
console.log(`BACKBLAZE_BUCKET_NAME: ${process.env.BACKBLAZE_BUCKET_NAME || '❌ No configurada'}`);
console.log(`BACKBLAZE_REGION: ${process.env.BACKBLAZE_REGION || '❌ No configurada'}`);
console.log(`BACKBLAZE_ENDPOINT: ${process.env.BACKBLAZE_ENDPOINT || '❌ No configurada'}\n`);

// Determinar credenciales a usar
const accessKeyId = process.env.BACKBLAZE_ACCESS_KEY_ID || process.env.BACKBLAZE_ACCOUNT_ID;
const secretAccessKey = process.env.BACKBLAZE_SECRET_ACCESS_KEY || process.env.BACKBLAZE_APPLICATION_KEY;
const region = process.env.BACKBLAZE_REGION || 'us-west-002';
const endpoint = process.env.BACKBLAZE_ENDPOINT || 'https://s3.us-west-002.backblazeb2.com';

if (!accessKeyId || !secretAccessKey) {
  console.error('❌ Error: No se encontraron credenciales válidas para Backblaze B2');
  console.error('   Configura BACKBLAZE_ACCESS_KEY_ID y BACKBLAZE_SECRET_ACCESS_KEY');
  console.error('   O alternativamente BACKBLAZE_ACCOUNT_ID y BACKBLAZE_APPLICATION_KEY');
  process.exit(1);
}

console.log('🔑 Credenciales a usar:');
console.log(`Access Key ID: ${accessKeyId.substring(0, 8)}...`);
console.log(`Secret Access Key: ${secretAccessKey.substring(0, 8)}...`);
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

async function testConnection() {
  try {
    console.log('🔄 Probando conexión con Backblaze B2...');
    
    // Intentar listar buckets (operación básica de autenticación)
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    
    console.log('✅ Conexión exitosa con Backblaze B2!');
    console.log('📦 Buckets disponibles:');
    
    if (response.Buckets && response.Buckets.length > 0) {
      response.Buckets.forEach(bucket => {
        console.log(`   - ${bucket.Name} (creado: ${bucket.CreationDate})`);
      });
    } else {
      console.log('   No se encontraron buckets');
    }
    
    // Verificar si el bucket específico existe
    const targetBucket = process.env.BACKBLAZE_BUCKET_NAME || 'psicoespacios-uploads';
    const bucketExists = response.Buckets?.some(bucket => bucket.Name === targetBucket);
    
    if (bucketExists) {
      console.log(`\n✅ Bucket "${targetBucket}" encontrado`);
    } else {
      console.log(`\n⚠️  Bucket "${targetBucket}" NO encontrado`);
      console.log('   Verifica que el nombre del bucket sea correcto');
    }
    
  } catch (error) {
    console.error('❌ Error de conexión con Backblaze B2:');
    console.error(`   Tipo: ${error.name}`);
    console.error(`   Mensaje: ${error.message}`);
    
    if (error.name === 'InvalidAccessKeyId') {
      console.error('\n💡 Posibles soluciones:');
      console.error('   1. Verifica que BACKBLAZE_ACCESS_KEY_ID sea correcto');
      console.error('   2. Verifica que BACKBLAZE_ACCOUNT_ID sea correcto');
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.error('\n💡 Posibles soluciones:');
      console.error('   1. Verifica que BACKBLAZE_SECRET_ACCESS_KEY sea correcto');
      console.error('   2. Verifica que BACKBLAZE_APPLICATION_KEY sea correcto');
    } else if (error.name === 'NetworkingError') {
      console.error('\n💡 Posibles soluciones:');
      console.error('   1. Verifica tu conexión a internet');
      console.error('   2. Verifica que BACKBLAZE_ENDPOINT sea correcto');
    }
  }
}

testConnection();




