const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testRegistroConEmail() {
  console.log('🧪 Probando registro con envío de email a tu correo personal...\n');

  try {
    // Datos de prueba para registro
    const userData = {
      email: 'renzomox.22@gmail.com',
      password: '123456',
      nombre: 'Renzo',
      apellido: 'Test',
      rut: '12.345.678-9',
      telefono: '+56912345678',
      fechaNacimiento: '1990-01-01',
      role: 'PACIENTE'
    };

    console.log('📝 Datos de registro:');
    console.log(JSON.stringify(userData, null, 2));
    console.log('');
    console.log('📧 El email de bienvenida se enviará a: renzomox.22@gmail.com');
    console.log('');

    // Hacer registro
    console.log('🚀 Registrando usuario...');
    const response = await axios.post(`${BASE_URL}/api/v1/auth/register`, userData);
    
    console.log('✅ Registro exitoso!');
    console.log('📧 Usuario creado:', response.data.user.email);
    console.log('🔑 Token recibido:', response.data.access_token ? 'SÍ' : 'NO');
    
    // Verificar en logs del servidor si se envió el email
    console.log('\n📧 Verifica en los logs del servidor si aparece:');
    console.log(`✅ Email de bienvenida enviado a ${userData.email}`);
    
    console.log('\n🎯 IMPORTANTE:');
    console.log('1. ✅ Revisa tu correo: renzomox.22@gmail.com');
    console.log('2. ✅ Busca en SPAM si no lo encuentras');
    console.log('3. ✅ El email incluirá tu imagen personalizada de PsicoEspacios');
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error en el registro:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Ejecutar test
testRegistroConEmail()
  .then(() => {
    console.log('\n🎉 Test completado!');
    console.log('💡 Revisa tu correo personal para ver el email de bienvenida');
    console.log('📧 Email: renzomox.22@gmail.com');
  })
  .catch((error) => {
    console.log('\n💥 Test falló');
    process.exit(1);
  });
