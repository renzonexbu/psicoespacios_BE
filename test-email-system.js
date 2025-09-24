const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3000';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1Y2FmYWNmZC1mZjM0LTQ3ZmItOWIxMy03OTAzOGE1M2I5M2EiLCJlbWFpbCI6InJlbnpvQGdtYWlsLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNTY5MTQwMCwiZXhwIjoxNzM1Nzc3ODAwfQ.example'; // Reemplaza con tu token real

const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testEmailSystem() {
  console.log('🧪 Probando Sistema de Emails de PsicoEspacios...\n');

  try {
    // 1. Verificar estado del servicio
    console.log('1️⃣ Verificando estado del servicio...');
    const statusResponse = await axios.get(`${BASE_URL}/api/v1/mail/status`, { headers });
    console.log('✅ Estado del servicio:', statusResponse.data);
    console.log('');

    // 2. Probar email de reserva confirmada
    console.log('2️⃣ Probando email de reserva confirmada...');
    const reservaData = {
      email: 'test@example.com',
      psicologoNombre: 'Dr. Renzo Lossani',
      fecha: '2025-01-20',
      hora: '09:00',
      modalidad: 'presencial',
      ubicacion: 'Sede Centro PsicoEspacios'
    };
    
    const reservaResponse = await axios.post(`${BASE_URL}/api/v1/mail/test/reserva-confirmada`, reservaData, { headers });
    console.log('✅ Email de reserva:', reservaResponse.data);
    console.log('');

    // 3. Probar email de recordatorio
    console.log('3️⃣ Probando email de recordatorio...');
    const recordatorioData = {
      email: 'test@example.com',
      psicologoNombre: 'Dr. Renzo Lossani',
      fecha: '2025-01-20',
      hora: '09:00',
      modalidad: 'presencial',
      ubicacion: 'Sede Centro PsicoEspacios'
    };
    
    const recordatorioResponse = await axios.post(`${BASE_URL}/api/v1/mail/test/recordatorio`, recordatorioData, { headers });
    console.log('✅ Email de recordatorio:', recordatorioResponse.data);
    console.log('');

    // 4. Probar email de pago exitoso
    console.log('4️⃣ Probando email de pago exitoso...');
    const pagoData = {
      email: 'test@example.com',
      monto: 25000,
      fecha: '2025-01-20',
      psicologoNombre: 'Dr. Renzo Lossani'
    };
    
    const pagoResponse = await axios.post(`${BASE_URL}/api/v1/mail/test/pago-exitoso`, pagoData, { headers });
    console.log('✅ Email de pago:', pagoResponse.data);
    console.log('');

    // 5. Probar email de cupón aplicado
    console.log('5️⃣ Probando email de cupón aplicado...');
    const cuponData = {
      email: 'test@example.com',
      codigoCupon: 'BIENVENIDA20',
      descuento: 5000,
      psicologoNombre: 'Dr. Renzo Lossani'
    };
    
    const cuponResponse = await axios.post(`${BASE_URL}/api/v1/mail/test/cupon-aplicado`, cuponData, { headers });
    console.log('✅ Email de cupón:', cuponResponse.data);
    console.log('');

    // 6. Probar email de bienvenida
    console.log('6️⃣ Probando email de bienvenida...');
    const bienvenidaData = {
      email: 'test@example.com',
      nombre: 'Juan Pérez'
    };
    
    const bienvenidaResponse = await axios.post(`${BASE_URL}/api/v1/mail/test/bienvenida`, bienvenidaData, { headers });
    console.log('✅ Email de bienvenida:', bienvenidaResponse.data);
    console.log('');

    // 7. Probar email de nueva nota
    console.log('7️⃣ Probando email de nueva nota...');
    const notaData = {
      email: 'test@example.com',
      psicologoNombre: 'Dr. Renzo Lossani',
      fecha: '2025-01-20'
    };
    
    const notaResponse = await axios.post(`${BASE_URL}/api/v1/mail/test/nueva-nota`, notaData, { headers });
    console.log('✅ Email de nueva nota:', notaResponse.data);
    console.log('');

    // 8. Probar email de sesión cancelada
    console.log('8️⃣ Probando email de sesión cancelada...');
    const canceladaData = {
      email: 'test@example.com',
      psicologoNombre: 'Dr. Renzo Lossani',
      fecha: '2025-01-20',
      hora: '09:00'
    };
    
    const canceladaResponse = await axios.post(`${BASE_URL}/api/v1/mail/test/sesion-cancelada`, canceladaData, { headers });
    console.log('✅ Email de sesión cancelada:', canceladaResponse.data);
    console.log('');

    console.log('🎉 ¡Todas las pruebas completadas exitosamente!');
    console.log('📧 Revisa tu bandeja de entrada para ver los emails de prueba.');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔑 Error de autenticación. Verifica que el token ADMIN_TOKEN sea válido.');
    }
  }
}

// Ejecutar pruebas
testEmailSystem();












