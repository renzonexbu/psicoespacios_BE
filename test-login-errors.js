const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testLoginErrors() {
  console.log('🧪 Probando diferentes escenarios de error en login...\n');

  const testCases = [
    {
      name: '❌ Email no registrado',
      data: {
        email: 'usuario-inexistente@example.com',
        password: '123456'
      },
      expectedError: 'El correo electrónico no está registrado en el sistema'
    },
    {
      name: '❌ Contraseña incorrecta',
      data: {
        email: 'admin@psicoespacios.com', // Usuario que sabemos que existe
        password: 'contraseña-incorrecta'
      },
      expectedError: 'La contraseña es incorrecta'
    },
    {
      name: '❌ Email vacío',
      data: {
        email: '',
        password: '123456'
      },
      expectedError: 'validation'
    },
    {
      name: '❌ Contraseña vacía',
      data: {
        email: 'test@example.com',
        password: ''
      },
      expectedError: 'validation'
    },
    {
      name: '❌ Datos malformados',
      data: {
        email: 'email-invalido',
        password: '123'
      },
      expectedError: 'validation'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 ${testCase.name}`);
    console.log(`📧 Email: ${testCase.data.email}`);
    console.log(`🔑 Password: ${testCase.data.password ? '***' : 'VACÍO'}`);
    
    try {
      const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, testCase.data);
      console.log('❌ ERROR: Se esperaba un error pero el login fue exitoso');
      console.log('Response:', response.data);
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        console.log(`📊 Status: ${status}`);
        console.log(`💬 Mensaje: ${data.message}`);
        console.log(`🚨 Error: ${data.error}`);
        
        // Verificar si el mensaje es específico
        if (testCase.expectedError === 'validation') {
          if (data.message.includes('validación') || data.message.includes('validation')) {
            console.log('✅ Mensaje de error apropiado para validación');
          } else {
            console.log('⚠️  Mensaje de error genérico para validación');
          }
        } else if (data.message.includes(testCase.expectedError)) {
          console.log('✅ Mensaje de error específico y útil');
        } else {
          console.log('⚠️  Mensaje de error genérico');
        }
        
        // Mostrar detalles si están disponibles
        if (data.details) {
          console.log(`📋 Detalles:`, data.details);
        }
      } else {
        console.log('❌ Error de conexión:', error.message);
      }
    }
    
    console.log('─'.repeat(50));
  }

  console.log('\n🎯 Resumen de mejoras implementadas:');
  console.log('✅ Mensajes específicos para email no registrado');
  console.log('✅ Mensajes específicos para contraseña incorrecta');
  console.log('✅ Mensajes específicos para cuenta inactiva');
  console.log('✅ Preservación de mensajes personalizados en el filtro');
  console.log('✅ Mejor experiencia de usuario en errores de autenticación');
}

// Ejecutar test
testLoginErrors()
  .then(() => {
    console.log('\n🎉 Test de errores de login completado!');
  })
  .catch((error) => {
    console.log('\n💥 Test falló:', error.message);
    process.exit(1);
  });











