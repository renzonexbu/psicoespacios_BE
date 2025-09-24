const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
let authToken = '';
let testBoxId = '';

// Función para hacer login y obtener token
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'admin@psicoespacios.com',
      password: 'admin123' // Ajusta según tu contraseña
    });
    
    authToken = response.data.access_token;
    console.log('✅ Login exitoso, token obtenido');
    return authToken;
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
    throw error;
  }
}

// Función para crear un box de prueba
async function createTestBox() {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/boxes`, {
      numero: 'TEST-001',
      nombre: 'Box de Prueba',
      capacidad: 2,
      precio: 25000,
      estado: 'DISPONIBLE'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    testBoxId = response.data.id;
    console.log('✅ Box de prueba creado:', testBoxId);
    return response.data;
  } catch (error) {
    console.error('❌ Error creando box de prueba:', error.response?.data || error.message);
    throw error;
  }
}

// Función para crear un box con el mismo número en la misma sede (debería fallar)
async function testDuplicateNumber() {
  try {
    await axios.post(`${BASE_URL}/api/v1/boxes`, {
      numero: 'TEST-001', // Mismo número
      nombre: 'Box Duplicado',
      capacidad: 2,
      precio: 25000,
      estado: 'DISPONIBLE'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('❌ ERROR: Se creó un box duplicado (no debería pasar)');
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('Ya existe un box con ese número')) {
      console.log('✅ Validación funcionando: No se puede crear box con número duplicado');
    } else {
      console.error('❌ Error inesperado en validación:', error.response?.data || error.message);
    }
  }
}

// Función para actualizar el box sin cambios (debería funcionar)
async function testUpdateNoChanges() {
  try {
    const response = await axios.put(`${BASE_URL}/api/v1/boxes/${testBoxId}`, {
      nombre: 'Box de Prueba Actualizado'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Actualización sin cambios en número/sede funcionó correctamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error en actualización sin cambios:', error.response?.data || error.message);
    throw error;
  }
}

// Función para actualizar solo el nombre (debería funcionar)
async function testUpdateOnlyName() {
  try {
    const response = await axios.put(`${BASE_URL}/api/v1/boxes/${testBoxId}`, {
      nombre: 'Box de Prueba - Solo Nombre Cambiado'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Actualización solo del nombre funcionó correctamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error en actualización del nombre:', error.response?.data || error.message);
    throw error;
  }
}

// Función para actualizar solo el número (debería funcionar si no hay conflicto)
async function testUpdateOnlyNumber() {
  try {
    const response = await axios.put(`${BASE_URL}/api/v1/boxes/${testBoxId}`, {
      numero: 'TEST-002'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Actualización solo del número funcionó correctamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error en actualización del número:', error.response?.data || error.message);
    throw error;
  }
}

// Función para limpiar - eliminar el box de prueba
async function cleanup() {
  try {
    await axios.delete(`${BASE_URL}/api/v1/boxes/${testBoxId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Box de prueba eliminado');
  } catch (error) {
    console.error('❌ Error eliminando box de prueba:', error.response?.data || error.message);
  }
}

// Función principal de test
async function runTests() {
  try {
    console.log('🚀 Iniciando tests de validación de boxes...\n');
    
    // 1. Login
    await login();
    
    // 2. Crear box de prueba
    await createTestBox();
    
    // 3. Test: Intentar crear box duplicado
    console.log('\n--- Test: Validación de número duplicado ---');
    await testDuplicateNumber();
    
    // 4. Test: Actualizar sin cambios en número/sede
    console.log('\n--- Test: Actualización sin cambios críticos ---');
    await testUpdateNoChanges();
    
    // 5. Test: Actualizar solo el nombre
    console.log('\n--- Test: Actualización solo del nombre ---');
    await testUpdateOnlyName();
    
    // 6. Test: Actualizar solo el número
    console.log('\n--- Test: Actualización solo del número ---');
    await testUpdateOnlyNumber();
    
    console.log('\n✅ Todos los tests completados');
    
  } catch (error) {
    console.error('❌ Error en los tests:', error.message);
  } finally {
    // Limpiar
    if (testBoxId) {
      console.log('\n🧹 Limpiando...');
      await cleanup();
    }
  }
}

// Ejecutar tests
runTests(); 