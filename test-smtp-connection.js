const nodemailer = require('nodemailer');
require('dotenv').config();

async function testSMTPConnection() {
  console.log('🧪 Probando conexión SMTP...\n');
  
  console.log('📧 Configuración actual:');
  console.log(`Host: ${process.env.MAIL_HOST}`);
  console.log(`Port: ${process.env.MAIL_PORT}`);
  console.log(`Secure: ${process.env.MAIL_SECURE}`);
  console.log(`User: ${process.env.MAIL_USER}`);
  console.log(`Pass: ${process.env.MAIL_PASS ? '***CONFIGURADA***' : 'NO CONFIGURADA'}`);
  console.log('');

  // Crear transporter
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT),
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    // Configuración adicional para debugging
    debug: true,
    logger: true,
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Verificando conexión...');
    
    // Verificar conexión
    await transporter.verify();
    console.log('✅ Conexión SMTP exitosa!');
    
    // Probar envío de email de prueba
    console.log('\n📤 Enviando email de prueba...');
    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM}>`,
      to: 'test@example.com',
      subject: 'Test de Conexión SMTP - PsicoEspacios',
      html: `
        <h2>🧪 Test de Conexión SMTP</h2>
        <p>Este es un email de prueba para verificar que la configuración SMTP funciona correctamente.</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CL')}</p>
        <p><strong>Servidor:</strong> ${process.env.MAIL_HOST}</p>
      `
    });
    
    console.log('✅ Email de prueba enviado exitosamente!');
    console.log(`Message ID: ${info.messageId}`);
    
  } catch (error) {
    console.error('❌ Error en la conexión SMTP:');
    console.error(`Código: ${error.code}`);
    console.error(`Respuesta: ${error.response}`);
    console.error(`Comando: ${error.command}`);
    console.error(`Mensaje: ${error.message}`);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔑 Error de autenticación. Posibles causas:');
      console.log('- Contraseña incorrecta');
      console.log('- Usuario incorrecto');
      console.log('- Restricción geográfica (IP no chilena)');
      console.log('- Configuración de seguridad del servidor');
    }
    
    if (error.code === 'ECONNECTION') {
      console.log('\n🌐 Error de conexión. Posibles causas:');
      console.log('- Servidor no accesible desde tu IP');
      console.log('- Restricción geográfica');
      console.log('- Firewall bloqueando la conexión');
    }
  }
}

// Ejecutar test
testSMTPConnection();












