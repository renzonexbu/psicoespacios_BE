const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';

// Token de autenticación (reemplazar con un token válido de psicólogo)
const AUTH_TOKEN = 'tu-token-jwt-aqui';

async function testCrearPaciente() {
  try {
    console.log('🧪 Probando endpoint de creación de paciente...\n');

    const pacienteData = {
      nombre: 'Juan',
      apellido: 'Pérez',
      rut: '12345678-9',
      email: 'juan.perez@ejemplo.com',
      fechaNacimiento: '1990-05-15'
    };

    console.log('📋 Datos del paciente a crear:');
    console.log(`   Nombre: ${pacienteData.nombre} ${pacienteData.apellido}`);
    console.log(`   RUT: ${pacienteData.rut}`);
    console.log(`   Email: ${pacienteData.email}`);
    console.log(`   Fecha de nacimiento: ${pacienteData.fechaNacimiento}\n`);

    const response = await axios.post(`${BASE_URL}/api/v1/psicologos/crear-paciente`, pacienteData, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Respuesta exitosa:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${response.data.success}`);
    console.log(`   Message: ${response.data.message}\n`);

    console.log('👤 Información del paciente creado:');
    console.log(`   ID: ${response.data.paciente.id}`);
    console.log(`   Nombre: ${response.data.paciente.nombre} ${response.data.paciente.apellido}`);
    console.log(`   Email: ${response.data.paciente.email}`);
    console.log(`   RUT: ${response.data.paciente.rut}`);
    console.log(`   Fecha de nacimiento: ${response.data.paciente.fechaNacimiento}`);
    console.log(`   Role: ${response.data.paciente.role}`);
    console.log(`   Estado: ${response.data.paciente.estado}\n`);

    console.log('👨‍⚕️ Información del psicólogo:');
    console.log(`   ID (tabla psicólogo): ${response.data.psicologo.id}`);
    console.log(`   Nombre: ${response.data.psicologo.nombre} ${response.data.psicologo.apellido}`);
    console.log(`   Email: ${response.data.psicologo.email}\n`);

    console.log('🔗 Verificación de vinculación:');
    console.log(`   ID del paciente: ${response.data.paciente.id}`);
    console.log(`   ID del psicólogo vinculado: ${response.data.psicologo.id}`);
    console.log(`   ✅ El paciente debe estar vinculado al psicólogo en la tabla 'pacientes'\n`);

    console.log('📧 Estado del email:');
    console.log(`   Email enviado: ${response.data.emailEnviado ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Contraseña generada: ${response.data.passwordGenerada}\n`);

    console.log('🎉 ¡Test exitoso! El paciente fue creado correctamente.');

  } catch (error) {
    console.error('❌ Error en la prueba:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message}`);
      if (error.response.data.details) {
        console.error(`   Details: ${JSON.stringify(error.response.data.details, null, 2)}`);
      }
    } else {
      console.error(`   Error: ${error.message}`);
    }
  }
}

// Función para probar validaciones
async function testValidaciones() {
  try {
    console.log('\n🧪 Probando validaciones...\n');

    // Test 1: Email duplicado
    console.log('1️⃣ Probando email duplicado:');
    try {
      await axios.post(`${BASE_URL}/api/v1/psicologos/crear-paciente`, {
        nombre: 'María',
        apellido: 'González',
        rut: '87654321-0',
        email: 'juan.perez@ejemplo.com', // Email duplicado
        fechaNacimiento: '1985-03-20'
      }, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('   ✅ Validación correcta: Email duplicado detectado');
      } else {
        console.log('   ❌ Error inesperado:', error.response?.data?.message);
      }
    }

    // Test 2: RUT duplicado
    console.log('\n2️⃣ Probando RUT duplicado:');
    try {
      await axios.post(`${BASE_URL}/api/v1/psicologos/crear-paciente`, {
        nombre: 'Carlos',
        apellido: 'López',
        rut: '12345678-9', // RUT duplicado
        email: 'carlos.lopez@ejemplo.com',
        fechaNacimiento: '1992-07-10'
      }, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('   ✅ Validación correcta: RUT duplicado detectado');
      } else {
        console.log('   ❌ Error inesperado:', error.response?.data?.message);
      }
    }

    // Test 3: Datos inválidos
    console.log('\n3️⃣ Probando datos inválidos:');
    try {
      await axios.post(`${BASE_URL}/api/v1/psicologos/crear-paciente`, {
        nombre: '', // Nombre vacío
        apellido: 'Martínez',
        rut: '123', // RUT muy corto
        email: 'email-invalido', // Email inválido
        fechaNacimiento: 'fecha-invalida' // Fecha inválida
      }, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('   ✅ Validación correcta: Datos inválidos detectados');
      } else {
        console.log('   ❌ Error inesperado:', error.response?.data?.message);
      }
    }

  } catch (error) {
    console.error('❌ Error en las pruebas de validación:', error.message);
  }
}

// Ejecutar las pruebas
async function runTests() {
  await testCrearPaciente();
  await testValidaciones();
}

runTests();
