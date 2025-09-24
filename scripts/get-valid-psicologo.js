const axios = require('axios');

async function getValidPsicologo() {
  try {
    console.log('🔍 Buscando psicólogos válidos...');
    
    // Primero buscar usuarios con rol PSICOLOGO
    const usersResponse = await axios.get('http://localhost:3000/api/v1/users');
    const psicologosUsers = usersResponse.data.filter(user => user.role === 'PSICOLOGO');
    
    if (psicologosUsers.length > 0) {
      const psicologoUser = psicologosUsers[0];
      console.log('✅ Psicólogo encontrado:');
      console.log(`   - User ID: ${psicologoUser.id}`);
      console.log(`   - Email: ${psicologoUser.email}`);
      console.log(`   - Nombre: ${psicologoUser.nombre} ${psicologoUser.apellido}`);
      console.log(`   - Rol: ${psicologoUser.role}`);
      
      // Ahora buscar en la tabla psicologo
      try {
        const psicologoResponse = await axios.get(`http://localhost:3000/api/v1/psicologos/${psicologoUser.id}`);
        console.log(`   - Psicólogo ID: ${psicologoResponse.data.id}`);
        console.log(`   - Especialidades: ${psicologoResponse.data.especialidades?.join(', ') || 'No especificadas'}`);
        return {
          userId: psicologoUser.id,
          psicologoId: psicologoResponse.data.id,
          nombre: `${psicologoUser.nombre} ${psicologoUser.apellido}`,
          email: psicologoUser.email
        };
      } catch (error) {
        console.log('⚠️  Usuario PSICOLOGO encontrado pero no tiene registro en tabla psicologo');
        return {
          userId: psicologoUser.id,
          psicologoId: psicologoUser.id, // Usar el userId como psicologoId
          nombre: `${psicologoUser.nombre} ${psicologoUser.apellido}`,
          email: psicologoUser.email
        };
      }
    } else {
      console.log('❌ No se encontraron usuarios con rol PSICOLOGO');
      console.log('💡 Asegúrate de que:');
      console.log('   - La API esté corriendo en puerto 3000');
      console.log('   - Haya usuarios con rol PSICOLOGO en la base de datos');
      console.log('   - El endpoint /api/v1/users esté disponible');
      return null;
    }
  } catch (error) {
    console.log('⚠️  Error obteniendo psicólogos:', error.message);
    console.log('💡 Asegúrate de que:');
    console.log('   - La API esté corriendo en puerto 3000');
    console.log('   - Haya usuarios en la base de datos');
    console.log('   - El endpoint /api/v1/users esté disponible');
    return null;
  }
}

if (require.main === module) {
  getValidPsicologo().then(psicologo => {
    if (psicologo) {
      console.log(`\n📋 Psicólogo para usar en las pruebas:`);
      console.log(`   - User ID: ${psicologo.userId}`);
      console.log(`   - Psicólogo ID: ${psicologo.psicologoId}`);
      console.log(`   - Nombre: ${psicologo.nombre}`);
      console.log(`   - Email: ${psicologo.email}`);
    } else {
      console.log('\n❌ No se pudo obtener un psicólogo válido');
    }
  });
}

module.exports = { getValidPsicologo }; 