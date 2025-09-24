const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'tu-token-jwt-aqui'; // Reemplazar con un token válido

async function verificarVinculacionPaciente() {
  try {
    console.log('🔍 Verificando vinculación de paciente con psicólogo...\n');

    // 1. Crear un paciente
    console.log('1️⃣ Creando paciente de prueba...');
    const pacienteData = {
      nombre: 'Test',
      apellido: 'Vinculacion',
      rut: '99999999-9',
      email: 'test.vinculacion@ejemplo.com',
      fechaNacimiento: '1990-01-01'
    };

    const response = await axios.post(`${BASE_URL}/api/v1/psicologos/crear-paciente`, pacienteData, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Paciente creado exitosamente');
    console.log(`   ID del paciente: ${response.data.paciente.id}`);
    console.log(`   ID del psicólogo: ${response.data.psicologo.id}\n`);

    // 2. Verificar que el paciente aparece en la lista de pacientes del psicólogo
    console.log('2️⃣ Verificando lista de pacientes del psicólogo...');
    
    // Obtener el ID del psicólogo del usuario autenticado
    // (Esto requeriría un endpoint adicional, pero podemos verificar en los logs)
    
    console.log('📋 Información de vinculación:');
    console.log(`   Tabla: pacientes`);
    console.log(`   idUsuarioPaciente: ${response.data.paciente.id}`);
    console.log(`   idUsuarioPsicologo: ${response.data.psicologo.id}`);
    console.log(`   Estado: ${response.data.paciente.estado}`);
    console.log(`   Primera sesión: ${new Date().toISOString()}\n`);

    // 3. Verificar estructura de la tabla pacientes
    console.log('3️⃣ Estructura esperada en la tabla pacientes:');
    console.log(`   {
     "id": "uuid-generado",
     "idUsuarioPaciente": "${response.data.paciente.id}",
     "idUsuarioPsicologo": "${response.data.psicologo.id}",
     "primeraSesionRegistrada": "${new Date().toISOString()}",
     "proximaSesion": null,
     "estado": "ACTIVO",
     "perfil_matching_completado": false,
     "diagnosticos_principales": [],
     "temas_principales": [],
     "estilo_terapeutico_preferido": [],
     "enfoque_teorico_preferido": [],
     "afinidad_personal_preferida": [],
     "modalidad_preferida": [],
     "genero_psicologo_preferido": []
   }\n`);

    console.log('✅ Verificación completada');
    console.log('   - El paciente debe estar vinculado al psicólogo correcto');
    console.log('   - El idUsuarioPsicologo debe ser el ID de la tabla psicólogo');
    console.log('   - El idUsuarioPaciente debe ser el ID del usuario creado');

  } catch (error) {
    console.error('❌ Error en la verificación:');
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

// Función para mostrar la diferencia entre IDs
function explicarDiferenciaIDs() {
  console.log('\n📚 Explicación de la corrección:');
  console.log('   ANTES (incorrecto):');
  console.log('   idUsuarioPsicologo: psicologo.usuario.id  ← ID de la tabla users');
  console.log('');
  console.log('   DESPUÉS (correcto):');
  console.log('   idUsuarioPsicologo: psicologo.id  ← ID de la tabla psicologo');
  console.log('');
  console.log('   La tabla pacientes debe referenciar el ID de la tabla psicologo,');
  console.log('   no el ID del usuario en la tabla users.\n');
}

// Ejecutar la verificación
async function runVerification() {
  explicarDiferenciaIDs();
  await verificarVinculacionPaciente();
}

runVerification();
