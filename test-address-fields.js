const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testRegisterWithAddressFields() {
  try {
    console.log('🧪 Probando registro con campos de dirección...\n');

    const registerData = {
      email: 'test.paciente@example.com',
      password: 'password123',
      nombre: 'Juan',
      apellido: 'Pérez',
      rut: '12.345.678-9',
      telefono: '+56912345678',
      fechaNacimiento: '1990-01-01',
      fotoUrl: 'https://example.com/foto.jpg',
      // Campos de dirección
      calleNumero: 'Av. Providencia 1234',
      observacionDireccion: 'Departamento 45, torre A',
      region: 'Región Metropolitana',
      comuna: 'Providencia',
      compania: 'Empresa ABC S.A.',
      role: 'PACIENTE'
    };

    console.log('📝 Datos de registro:');
    console.log(JSON.stringify(registerData, null, 2));
    console.log('\n');

    const response = await axios.post(`${BASE_URL}/auth/register`, registerData);
    
    console.log('✅ Registro exitoso!');
    console.log('📊 Respuesta:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error en el registro:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

async function testCrearPacienteWithAddressFields() {
  try {
    console.log('\n🧪 Probando creación de paciente con campos de dirección...\n');

    // Primero necesitamos un token de psicólogo
    const loginData = {
      email: 'psicologo@example.com', // Ajustar según tus datos de prueba
      password: 'password123'
    };

    console.log('🔐 Iniciando sesión como psicólogo...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    const token = loginResponse.data.access_token;
    
    console.log('✅ Login exitoso!');

    const crearPacienteData = {
      nombre: 'María',
      apellido: 'González',
      rut: '98.765.432-1',
      email: 'maria.gonzalez@example.com',
      fechaNacimiento: '1985-05-15',
      // Campos de dirección
      calleNumero: 'Calle Las Flores 567',
      observacionDireccion: 'Casa, portón azul',
      region: 'Valparaíso',
      comuna: 'Viña del Mar',
      compania: 'Consultora XYZ Ltda.'
    };

    console.log('\n📝 Datos del paciente a crear:');
    console.log(JSON.stringify(crearPacienteData, null, 2));
    console.log('\n');

    const response = await axios.post(
      `${BASE_URL}/psicologos/crear-paciente`,
      crearPacienteData,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ Paciente creado exitosamente!');
    console.log('📊 Respuesta:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error en la creación de paciente:');
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
  console.log('🚀 Iniciando pruebas de campos de dirección...\n');
  
  try {
    // Probar registro de usuario
    await testRegisterWithAddressFields();
    
    // Probar creación de paciente por psicólogo
    await testCrearPacienteWithAddressFields();
    
    console.log('\n🎉 Todas las pruebas completadas exitosamente!');
  } catch (error) {
    console.log('\n💥 Algunas pruebas fallaron. Revisa los errores arriba.');
    process.exit(1);
  }
}

// Ejecutar las pruebas
main();
