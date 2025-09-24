const axios = require('axios');

async function getValidUser() {
  try {
    console.log('🔍 Buscando usuarios válidos...');
    
    // Intentar obtener usuarios de la API
    const response = await axios.get('http://localhost:3000/api/v1/users');
    
    if (response.data && response.data.length > 0) {
      const user = response.data[0];
      console.log('✅ Usuario encontrado:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Nombre: ${user.nombre} ${user.apellido}`);
      console.log(`   - Rol: ${user.role}`);
      
      return user.id;
    } else {
      console.log('❌ No se encontraron usuarios');
      return null;
    }
    
  } catch (error) {
    console.log('⚠️  Error obteniendo usuarios:', error.message);
    console.log('💡 Asegúrate de que:');
    console.log('   - La API esté corriendo en puerto 3000');
    console.log('   - Haya usuarios en la base de datos');
    console.log('   - El endpoint /api/v1/users esté disponible');
    
    return null;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  getValidUser().then(userId => {
    if (userId) {
      console.log(`\n📋 User ID para usar en las pruebas: ${userId}`);
    } else {
      console.log('\n❌ No se pudo obtener un usuario válido');
    }
  });
}

module.exports = { getValidUser }; 