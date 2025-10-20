const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testBoxWithMultiplePhotos() {
  try {
    console.log('🧪 Probando creación de box con múltiples fotos...\n');

    // Primero necesitamos un token de admin
    const loginData = {
      email: 'admin@example.com', // Ajustar según tus datos de prueba
      password: 'password123'
    };

    console.log('🔐 Iniciando sesión como admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    const token = loginResponse.data.access_token;
    
    console.log('✅ Login exitoso!');

    const createBoxData = {
      numero: 'B-101',
      nombre: 'Box de Prueba',
      capacidad: 2,
      precio: 15000,
      equipamiento: ['Escritorio', 'Sillas', 'Aire acondicionado'],
      fotos: [
        'https://example.com/foto1.jpg',
        'https://example.com/foto2.jpg',
        'https://example.com/foto3.jpg'
      ],
      estado: 'DISPONIBLE',
      sedeId: 'uuid-de-sede' // Ajustar según tus datos
    };

    console.log('\n📝 Datos del box a crear:');
    console.log(JSON.stringify(createBoxData, null, 2));
    console.log('\n');

    const response = await axios.post(
      `${BASE_URL}/api/v1/boxes`,
      createBoxData,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ Box creado exitosamente!');
    console.log('📊 Respuesta:', JSON.stringify(response.data, null, 2));
    
    // Verificar que las fotos se guardaron correctamente
    const fotos = response.data.fotos;
    if (fotos && Array.isArray(fotos) && fotos.length > 0) {
      console.log(`\n🎉 ÉXITO: Se guardaron ${fotos.length} fotos:`);
      fotos.forEach((foto, index) => {
        console.log(`   ${index + 1}. ${foto}`);
      });
    } else {
      console.log('\n❌ PROBLEMA: No se guardaron las fotos correctamente');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error en la creación de box:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

async function testBoxWithSinglePhoto() {
  try {
    console.log('\n🧪 Probando creación de box con una sola foto...\n');

    // Primero necesitamos un token de admin
    const loginData = {
      email: 'admin@example.com', // Ajustar según tus datos de prueba
      password: 'password123'
    };

    console.log('🔐 Iniciando sesión como admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    const token = loginResponse.data.access_token;
    
    console.log('✅ Login exitoso!');

    const createBoxData = {
      numero: 'B-102',
      nombre: 'Box con Una Foto',
      capacidad: 1,
      precio: 12000,
      equipamiento: ['Escritorio', 'Silla'],
      fotos: [
        'https://example.com/single-photo.jpg'
      ],
      estado: 'DISPONIBLE',
      sedeId: 'uuid-de-sede' // Ajustar según tus datos
    };

    console.log('\n📝 Datos del box a crear:');
    console.log(JSON.stringify(createBoxData, null, 2));
    console.log('\n');

    const response = await axios.post(
      `${BASE_URL}/api/v1/boxes`,
      createBoxData,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ Box creado exitosamente!');
    console.log('📊 Respuesta:', JSON.stringify(response.data, null, 2));
    
    // Verificar que la foto se guardó correctamente
    const fotos = response.data.fotos;
    if (fotos && Array.isArray(fotos) && fotos.length === 1) {
      console.log(`\n🎉 ÉXITO: Se guardó 1 foto: ${fotos[0]}`);
    } else {
      console.log('\n❌ PROBLEMA: No se guardó la foto correctamente');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error en la creación de box:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

async function testBoxWithNoPhotos() {
  try {
    console.log('\n🧪 Probando creación de box sin fotos...\n');

    // Primero necesitamos un token de admin
    const loginData = {
      email: 'admin@example.com', // Ajustar según tus datos de prueba
      password: 'password123'
    };

    console.log('🔐 Iniciando sesión como admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    const token = loginResponse.data.access_token;
    
    console.log('✅ Login exitoso!');

    const createBoxData = {
      numero: 'B-103',
      nombre: 'Box sin Fotos',
      capacidad: 2,
      precio: 10000,
      equipamiento: ['Escritorio', 'Sillas'],
      // Sin campo fotos
      estado: 'DISPONIBLE',
      sedeId: 'uuid-de-sede' // Ajustar según tus datos
    };

    console.log('\n📝 Datos del box a crear:');
    console.log(JSON.stringify(createBoxData, null, 2));
    console.log('\n');

    const response = await axios.post(
      `${BASE_URL}/api/v1/boxes`,
      createBoxData,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ Box creado exitosamente!');
    console.log('📊 Respuesta:', JSON.stringify(response.data, null, 2));
    
    // Verificar que no hay fotos
    const fotos = response.data.fotos;
    if (!fotos || (Array.isArray(fotos) && fotos.length === 0)) {
      console.log('\n🎉 ÉXITO: Box creado sin fotos (comportamiento esperado)');
    } else {
      console.log('\n❌ PROBLEMA: Se guardaron fotos cuando no debería haberlas');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error en la creación de box:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

async function main() {
  console.log('🚀 Iniciando pruebas de boxes con múltiples fotos...\n');
  
  try {
    // Probar con múltiples fotos
    await testBoxWithMultiplePhotos();
    
    // Probar con una sola foto
    await testBoxWithSinglePhoto();
    
    // Probar sin fotos
    await testBoxWithNoPhotos();
    
    console.log('\n🎉 Todas las pruebas completadas exitosamente!');
    console.log('\n✅ Los boxes ahora soportan múltiples fotos como array de URLs');
  } catch (error) {
    console.log('\n💥 Algunas pruebas fallaron. Revisa los errores arriba.');
    process.exit(1);
  }
}

// Ejecutar las pruebas
main();
