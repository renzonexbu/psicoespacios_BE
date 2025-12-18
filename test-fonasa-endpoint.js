const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3000';
const USER_ID = 'fbfb1d20-052e-492f-9397-3e8e2108a231';

async function testFonasaEndpoint() {
  try {
    console.log('=== TEST ENDPOINT FONASA ===\n');

    // 1. Login
    console.log('1. Haciendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'renzo@nexbu.com',
      password: 'Aa123456*' // Ajustar el password si es necesario
    });

    const token = loginResponse.data.access_token;
    console.log('✓ Login exitoso\n');

    // 2. Obtener precios actuales (debe incluir fonasa)
    console.log('2. Obteniendo precios actuales...');
    const getPreciosResponse = await axios.get(
      `${BASE_URL}/api/v1/precios-psicologo/usuario/${USER_ID}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    console.log('Precios actuales:');
    console.log(JSON.stringify(getPreciosResponse.data, null, 2));
    console.log('');

    // 3. Actualizar fonasa a true
    console.log('3. Actualizando fonasa a true...');
    const updateResponse1 = await axios.patch(
      `${BASE_URL}/api/v1/precios-psicologo/usuario/${USER_ID}`,
      { fonasa: true },
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Respuesta después de actualizar a true:');
    console.log(JSON.stringify(updateResponse1.data, null, 2));
    console.log('');

    // 4. Actualizar fonasa a false
    console.log('4. Actualizando fonasa a false...');
    const updateResponse2 = await axios.patch(
      `${BASE_URL}/api/v1/precios-psicologo/usuario/${USER_ID}`,
      { fonasa: false },
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Respuesta después de actualizar a false:');
    console.log(JSON.stringify(updateResponse2.data, null, 2));
    console.log('');

    // 5. Actualizar fonasa junto con precios
    console.log('5. Actualizando fonasa y precios juntos...');
    const updateResponse3 = await axios.patch(
      `${BASE_URL}/api/v1/precios-psicologo/usuario/${USER_ID}`,
      { 
        fonasa: true,
        precioOnline: 30000,
        precioPresencial: 35000
      },
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Respuesta después de actualizar todo:');
    console.log(JSON.stringify(updateResponse3.data, null, 2));
    console.log('');

    console.log('✓ ¡Todas las pruebas completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error.response?.status);
    console.error('Mensaje:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Detalles:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testFonasaEndpoint();

