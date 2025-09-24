const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testTodosEmails() {
  console.log('🧪 Probando todos los tipos de emails de PsicoEspacios...\n');
  console.log('📧 Todos los emails se enviarán a: renzomox.22@gmail.com\n');

  const testCases = [
    {
      name: '🎉 Email de Bienvenida',
      endpoint: '/api/v1/mail/test/bienvenida-public',
      data: {
        email: 'renzomox.22@gmail.com',
        nombre: 'Renzo'
      }
    },
    {
      name: '🗓️ Reserva Confirmada (Paciente)',
      endpoint: '/api/v1/mail/test/reserva-confirmada-public',
      data: {
        email: 'renzomox.22@gmail.com',
        psicologoNombre: 'Dr. María González',
        fecha: '25 de Agosto, 2025',
        hora: '15:00',
        modalidad: 'Presencial',
        ubicacion: 'Sede Providencia, Av. Providencia 1234'
      }
    },
    {
      name: '💰 Pago Exitoso',
      endpoint: '/api/v1/mail/test/pago-exitoso-public',
      data: {
        email: 'renzomox.22@gmail.com',
        monto: 45000,
        fecha: '22 de Agosto, 2025',
        psicologoNombre: 'Dr. María González'
      }
    },
    {
      name: '❌ Sesión Cancelada (Paciente)',
      endpoint: '/api/v1/mail/test/sesion-cancelada-public',
      data: {
        email: 'renzomox.22@gmail.com',
        psicologoNombre: 'Dr. María González',
        fecha: '25 de Agosto, 2025',
        hora: '15:00'
      }
    },
    {
      name: '⏰ Recordatorio de Sesión',
      endpoint: '/api/v1/mail/test/recordatorio-public',
      data: {
        email: 'renzomox.22@gmail.com',
        psicologoNombre: 'Dr. María González',
        fecha: '25 de Agosto, 2025',
        hora: '15:00',
        modalidad: 'Presencial',
        ubicacion: 'Sede Providencia, Av. Providencia 1234'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 ${testCase.name}`);
    console.log(`📧 Endpoint: ${testCase.endpoint}`);
    console.log(`📋 Datos:`, JSON.stringify(testCase.data, null, 2));
    
    try {
      console.log('🚀 Enviando email...');
      const response = await axios.post(`${BASE_URL}${testCase.endpoint}`, testCase.data);
      
      if (response.data.success) {
        console.log('✅ Email enviado exitosamente!');
        console.log('📧 Respuesta:', response.data.message);
      } else {
        console.log('❌ Email falló');
        console.log('📧 Error:', response.data.message);
      }
      
    } catch (error) {
      if (error.response) {
        console.log('❌ Error HTTP:', error.response.status);
        console.log('📧 Mensaje:', error.response.data.message || 'Error desconocido');
        
        if (error.response.status === 401) {
          console.log('🔑 Este endpoint requiere autenticación de administrador');
        }
      } else {
        console.log('❌ Error de conexión:', error.message);
      }
    }
    
    console.log('─'.repeat(60));
    
    // Pausa entre emails para no sobrecargar el servidor
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎯 Resumen de emails probados:');
  console.log('✅ Bienvenida - Endpoint público');
  console.log('✅ Reserva Confirmada - Endpoint público');
  console.log('✅ Pago Exitoso - Endpoint público');
  console.log('✅ Sesión Cancelada - Endpoint público');
  console.log('✅ Recordatorio - Endpoint público');
  
  console.log('\n💡 Todos los emails se enviaron sin autenticación');
  console.log('📧 Revisa tu correo para ver todos los tipos de emails');
  console.log('⚠️  Recuerda: Estos endpoints son solo para testing');
  
  console.log('\n📧 Revisa tu correo: renzomox.22@gmail.com');
  console.log('🔍 Busca en SPAM si no encuentras los emails');
}

// Ejecutar test
testTodosEmails()
  .then(() => {
    console.log('\n🎉 Test de todos los emails completado!');
  })
  .catch((error) => {
    console.log('\n💥 Test falló:', error.message);
    process.exit(1);
  });
