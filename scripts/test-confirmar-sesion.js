const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3000';
const JWT_TOKEN = 'TU_TOKEN_JWT_AQUI'; // Reemplazar con token válido

async function testConfirmarSesion() {
  try {
    console.log('🧪 Probando endpoint confirmar-sesion...\n');
    
    const payload = {
      psicologoId: "0289e826-187c-48cc-b08f-2104ecfea8ae",
      pacienteId: "02af7aa5-6067-427a-84bc-4d879aeb6524",
      fecha: "2025-09-30",
      horaInicio: "08:00",
      horaFin: "09:00", // Cambiado de "hs" a "09:00" para probar
      modalidad: "online",
      observaciones: "Sesión de terapia - test test",
      precio: 20,
      datosTransaccion: {
        metodoPago: "TRANSFERENCIA",
        fechaTransaccion: new Date(),
        datosTransferencia: {
          banco: "Banco de Chile",
          numeroOperacion: "TEST123"
        }
      }
    };

    console.log('📤 Payload enviado:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('\n📋 Campos específicos:');
    console.log(`- fecha: "${payload.fecha}" (tipo: ${typeof payload.fecha})`);
    console.log(`- horaInicio: "${payload.horaInicio}" (tipo: ${typeof payload.horaInicio})`);
    console.log(`- horaFin: "${payload.horaFin}" (tipo: ${typeof payload.horaFin})`);
    console.log(`- modalidad: "${payload.modalidad}" (tipo: ${typeof payload.modalidad})`);

    const response = await axios.post(
      `${BASE_URL}/api/v1/pagos/confirmar-sesion`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ Respuesta exitosa:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('\n❌ Error en la prueba:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function testReservasSesiones() {
  try {
    console.log('\n🧪 Probando endpoint reservas-sesiones...\n');
    
    const payload = {
      psicologoId: "0289e826-187c-48cc-b08f-2104ecfea8ae",
      pacienteId: "02af7aa5-6067-427a-84bc-4d879aeb6524",
      fecha: "2025-09-30",
      horaInicio: "08:00",
      horaFin: "09:00",
      modalidad: "online",
      observaciones: "Sesión de terapia - test test"
    };

    console.log('📤 Payload enviado:');
    console.log(JSON.stringify(payload, null, 2));

    const response = await axios.post(
      `${BASE_URL}/api/v1/reservas-sesiones`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ Respuesta exitosa:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('\n❌ Error en la prueba:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando pruebas de endpoints...\n');
  
  // Probar confirmar-sesion
  await testConfirmarSesion();
  
  // Probar reservas-sesiones
  await testReservasSesiones();
  
  console.log('\n🏁 Pruebas completadas');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testConfirmarSesion, testReservasSesiones };



