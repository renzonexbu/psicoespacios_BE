const axios = require('axios');

async function testPublicEndpointWithExperiencia() {
  try {
    console.log('🔍 Probando endpoint público con experiencia del usuario...');
    
    const response = await axios.get('http://127.0.0.1:3000/psicologos/public/08161126-191a-4dd0-9070-b1c89a6ddcd8');
    
    console.log('\n✅ Respuesta completa del endpoint público:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n📋 Información del usuario:');
    console.log(`- ID: ${response.data.usuario.id}`);
    console.log(`- Nombre: ${response.data.usuario.nombre}`);
    console.log(`- Apellido: ${response.data.usuario.apellido}`);
    console.log(`- Foto URL: ${response.data.usuario.fotoUrl}`);
    console.log(`- Especialidad: ${response.data.usuario.especialidad}`);
    console.log(`- Experiencia: ${response.data.usuario.experiencia}`);
    console.log(`- Estado: ${response.data.usuario.estado}`);
    
    console.log('\n📋 Información del psicólogo:');
    console.log(`- Experiencia del psicólogo: ${response.data.experiencia}`);
    console.log(`- Descripción: ${response.data.descripcion}`);
    console.log(`- Precio Presencial: $${response.data.precioPresencial}`);
    console.log(`- Precio Online: $${response.data.precioOnline}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testPublicEndpointWithExperiencia();
