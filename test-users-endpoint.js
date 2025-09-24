const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
let adminToken = '';
let userToken = '';

// Función para hacer login como admin
async function loginAsAdmin() {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'admin@psicoespacios.com',
      password: 'admin123' // Ajusta según tu contraseña
    });
    
    adminToken = response.data.access_token;
    console.log('✅ Login como ADMIN exitoso');
    return adminToken;
  } catch (error) {
    console.error('❌ Error en login como ADMIN:', error.response?.data || error.message);
    throw error;
  }
}

// Función para hacer login como usuario normal
async function loginAsUser() {
  try {
    // Primero necesitamos crear un usuario normal o usar uno existente
    // Por ahora usaremos el mismo endpoint pero con credenciales de usuario
    const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'user@example.com', // Ajusta según un usuario existente
      password: 'user123'
    });
    
    userToken = response.data.access_token;
    console.log('✅ Login como usuario normal exitoso');
    return userToken;
  } catch (error) {
    console.log('⚠️ No se pudo hacer login como usuario normal (puede que no exista)');
    return null;
  }
}

// Función para testear acceso como admin (debería funcionar)
async function testAdminAccess() {
  try {
    console.log('\n--- Test: Acceso como ADMIN ---');
    
    const response = await axios.get(`${BASE_URL}/api/v1/users/admin/all`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ ADMIN puede acceder al endpoint');
    console.log(`📊 Total de usuarios: ${response.data.length}`);
    
    // Mostrar información del primer usuario como ejemplo
    if (response.data.length > 0) {
      const firstUser = response.data[0];
      console.log('👤 Primer usuario:');
      console.log(`   ID: ${firstUser.id}`);
      console.log(`   Nombre: ${firstUser.nombre} ${firstUser.apellido}`);
      console.log(`   Email: ${firstUser.email}`);
      console.log(`   Rol: ${firstUser.role}`);
      console.log(`   Estado: ${firstUser.estado}`);
      console.log(`   Creado: ${firstUser.createdAt}`);
      
      // Verificar que no se incluye el password
      if (firstUser.password) {
        console.log('❌ ERROR: Se incluye el password en la respuesta');
      } else {
        console.log('✅ Password NO está incluido en la respuesta');
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error en acceso como ADMIN:', error.response?.data || error.message);
    throw error;
  }
}

// Función para testear acceso como usuario normal (debería fallar)
async function testUserAccess() {
  try {
    console.log('\n--- Test: Acceso como usuario normal ---');
    
    if (!userToken) {
      console.log('⚠️ No hay token de usuario, saltando test');
      return;
    }
    
    await axios.get(`${BASE_URL}/api/v1/users/admin/all`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    console.log('❌ ERROR: Usuario normal pudo acceder (no debería pasar)');
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Usuario normal NO puede acceder (Forbidden)');
    } else if (error.response?.status === 401) {
      console.log('✅ Usuario normal NO puede acceder (Unauthorized)');
    } else {
      console.error('❌ Error inesperado:', error.response?.data || error.message);
    }
  }
}

// Función para testear acceso sin token (debería fallar)
async function testNoTokenAccess() {
  try {
    console.log('\n--- Test: Acceso sin token ---');
    
    await axios.get(`${BASE_URL}/api/v1/users/admin/all`);
    
    console.log('❌ ERROR: Se pudo acceder sin token (no debería pasar)');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ No se puede acceder sin token (Unauthorized)');
    } else {
      console.error('❌ Error inesperado:', error.response?.data || error.message);
    }
  }
}

// Función para verificar estructura de respuesta
async function verifyResponseStructure(users) {
  console.log('\n--- Test: Verificación de estructura de respuesta ---');
  
  if (!users || users.length === 0) {
    console.log('⚠️ No hay usuarios para verificar');
    return;
  }
  
  const requiredFields = [
    'id', 'email', 'nombre', 'apellido', 'rut', 'telefono', 
    'fechaNacimiento', 'role', 'estado', 'createdAt', 'updatedAt'
  ];
  
  const optionalFields = [
    'fotoUrl', 'direccion', 'especialidad', 'numeroRegistroProfesional', 'experiencia'
  ];
  
  const firstUser = users[0];
  
  // Verificar campos obligatorios
  let missingFields = [];
  requiredFields.forEach(field => {
    if (!(field in firstUser)) {
      missingFields.push(field);
    }
  });
  
  if (missingFields.length > 0) {
    console.log(`❌ Campos obligatorios faltantes: ${missingFields.join(', ')}`);
  } else {
    console.log('✅ Todos los campos obligatorios están presentes');
  }
  
  // Verificar que no hay password
  if ('password' in firstUser) {
    console.log('❌ ERROR: El campo password está presente en la respuesta');
  } else {
    console.log('✅ El campo password NO está presente');
  }
  
  // Verificar tipos de datos
  if (typeof firstUser.id === 'string' && firstUser.id.length > 0) {
    console.log('✅ ID es un string válido');
  } else {
    console.log('❌ ID no es un string válido');
  }
  
  if (typeof firstUser.email === 'string' && firstUser.email.includes('@')) {
    console.log('✅ Email es un string válido');
  } else {
    console.log('❌ Email no es un string válido');
  }
  
  if (['PSICOLOGO', 'PACIENTE', 'ADMIN'].includes(firstUser.role)) {
    console.log('✅ Rol es válido');
  } else {
    console.log('❌ Rol no es válido');
  }
  
  if (['ACTIVO', 'INACTIVO', 'PENDIENTE'].includes(firstUser.estado)) {
    console.log('✅ Estado es válido');
  } else {
    console.log('❌ Estado no es válido');
  }
}

// Función principal de test
async function runTests() {
  try {
    console.log('🚀 Iniciando tests del endpoint de usuarios...\n');
    
    // 1. Login como admin
    await loginAsAdmin();
    
    // 2. Login como usuario normal (opcional)
    await loginAsUser();
    
    // 3. Test: Acceso como admin
    const users = await testAdminAccess();
    
    // 4. Test: Acceso como usuario normal
    await testUserAccess();
    
    // 5. Test: Acceso sin token
    await testNoTokenAccess();
    
    // 6. Verificar estructura de respuesta
    await verifyResponseStructure(users);
    
    console.log('\n✅ Todos los tests completados');
    
  } catch (error) {
    console.error('❌ Error en los tests:', error.message);
  }
}

// Ejecutar tests
runTests(); 