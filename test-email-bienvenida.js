const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testEmailBienvenida() {
  console.log('🧪 Probando envío de email de bienvenida a tu correo personal...\n');

  try {
    // Datos para el email de bienvenida
    const emailData = {
      email: 'renzomox.22@gmail.com',
      nombre: 'Renzo'
    };

    console.log('📝 Datos del email:');
    console.log(JSON.stringify(emailData, null, 2));
    console.log('');
    console.log('📧 El email de bienvenida se enviará a: renzomox.22@gmail.com');
    console.log('');

    // Enviar email de bienvenida usando el endpoint público
    console.log('🚀 Enviando email de bienvenida...');
    const response = await axios.post(`${BASE_URL}/api/v1/mail/test/bienvenida-public`, emailData);
    
    console.log('✅ Email enviado exitosamente!');
    console.log('📧 Respuesta del servidor:', response.data);
    
    console.log('\n🎯 IMPORTANTE:');
    console.log('1. ✅ Revisa tu correo: renzomox.22@gmail.com');
    console.log('2. ✅ Busca en SPAM si no lo encuentras');
    console.log('3. ✅ El email incluirá tu imagen personalizada de PsicoEspacios');
    console.log('4. ✅ Contenido: Mensaje de bienvenida personalizado para "Renzo"');
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error al enviar el email:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('\n🔑 Error de autenticación');
        console.log('💡 Verifica que el servidor esté funcionando');
      }
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Ejecutar test
testEmailBienvenida()
  .then(() => {
    console.log('\n🎉 Test de email completado!');
    console.log('💡 Revisa tu correo personal para ver el email de bienvenida');
    console.log('📧 Email: renzomox.22@gmail.com');
  })
  .catch((error) => {
    console.log('\n💥 Test falló');
    console.log('💡 Verifica que el servidor esté funcionando y el endpoint esté disponible');
    process.exit(1);
  });
