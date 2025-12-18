const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3000';
const USER_ID = 'fbfb1d20-052e-492f-9397-3e8e2108a231';

// Primero necesitamos hacer login para obtener el token
async function testUserCompania() {
  try {
    // Login
    console.log('1. Haciendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'renzo@nexbu.com',
      password: 'tu_password_aqui' // Necesitarás proporcionar el password correcto
    });

    const token = loginResponse.data.access_token;
    console.log('✓ Login exitoso');
    console.log('Token:', token.substring(0, 20) + '...');

    // Obtener perfil del usuario
    console.log('\n2. Obteniendo perfil del usuario...');
    const userResponse = await axios.get(`${BASE_URL}/api/v1/users/${USER_ID}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('\n=== INFORMACIÓN DEL USUARIO ===');
    console.log('ID:', userResponse.data.id);
    console.log('Email:', userResponse.data.email);
    console.log('Nombre:', userResponse.data.nombre, userResponse.data.apellido);
    console.log('Compañía:', userResponse.data.compania);
    console.log('\n=== RESPUESTA COMPLETA ===');
    console.log(JSON.stringify(userResponse.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.error('Error:', error.response.status);
      console.error('Mensaje:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testUserCompania();

