const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Reemplazar con token válido de ADMIN

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${JWT_TOKEN}`
};

async function testBlogEndpoints() {
  console.log('🧪 Probando endpoints de Blogs...\n');

  try {
    // 1. Crear un nuevo blog
    console.log('1️⃣ Creando nuevo blog...');
    const newBlog = {
      titulo: 'Beneficios de la Terapia Cognitivo-Conductual',
      descripcion: 'Descubre cómo la TCC puede ayudarte a superar problemas emocionales y mejorar tu bienestar mental.',
      categoria: 'Terapias',
      contenido: '<h2>¿Qué es la TCC?</h2><p>La terapia cognitivo-conductual (TCC) es una forma de psicoterapia que se enfoca en cambiar patrones de pensamiento negativos...</p><h3>Beneficios principales:</h3><ul><li>Ayuda a identificar pensamientos negativos</li><li>Proporciona herramientas prácticas</li><li>Resultados a corto plazo</li></ul>',
      imagen: 'https://ejemplo.com/tcc-imagen.jpg'
    };

    const createResponse = await axios.post(`${BASE_URL}/blogs`, newBlog, { headers });
    console.log('✅ Blog creado:', createResponse.data.id);
    const blogId = createResponse.data.id;

    // 2. Obtener todos los blogs
    console.log('\n2️⃣ Obteniendo todos los blogs...');
    const allBlogsResponse = await axios.get(`${BASE_URL}/blogs`);
    console.log(`✅ Encontrados ${allBlogsResponse.data.length} blogs`);

    // 3. Obtener blog específico
    console.log('\n3️⃣ Obteniendo blog específico...');
    const specificBlogResponse = await axios.get(`${BASE_URL}/blogs/${blogId}`);
    console.log('✅ Blog obtenido:', specificBlogResponse.data.titulo);

    // 4. Buscar blogs
    console.log('\n4️⃣ Buscando blogs con "terapia"...');
    const searchResponse = await axios.get(`${BASE_URL}/blogs/search?q=terapia`);
    console.log(`✅ Encontrados ${searchResponse.data.length} blogs con "terapia"`);

    // 5. Obtener blogs por categoría
    console.log('\n5️⃣ Obteniendo blogs por categoría "Terapias"...');
    const categoryResponse = await axios.get(`${BASE_URL}/blogs/category/Terapias`);
    console.log(`✅ Encontrados ${categoryResponse.data.length} blogs en categoría "Terapias"`);

    // 6. Actualizar blog
    console.log('\n6️⃣ Actualizando blog...');
    const updateData = {
      descripcion: 'Descripción actualizada: Descubre cómo la TCC puede ayudarte a superar problemas emocionales y mejorar tu bienestar mental de manera efectiva.',
      contenido: '<h2>¿Qué es la TCC?</h2><p>La terapia cognitivo-conductual (TCC) es una forma de psicoterapia que se enfoca en cambiar patrones de pensamiento negativos...</p><h3>Beneficios principales:</h3><ul><li>Ayuda a identificar pensamientos negativos</li><li>Proporciona herramientas prácticas</li><li>Resultados a corto plazo</li><li>Efectiva para ansiedad y depresión</li></ul>'
    };

    const updateResponse = await axios.put(`${BASE_URL}/blogs/${blogId}`, updateData, { headers });
    console.log('✅ Blog actualizado:', updateResponse.data.titulo);

    // 7. Eliminar blog
    console.log('\n7️⃣ Eliminando blog...');
    await axios.delete(`${BASE_URL}/blogs/${blogId}`, { headers });
    console.log('✅ Blog eliminado correctamente');

    // 8. Verificar que fue eliminado
    console.log('\n8️⃣ Verificando eliminación...');
    try {
      await axios.get(`${BASE_URL}/blogs/${blogId}`);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Confirmado: Blog no encontrado (eliminado correctamente)');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');

  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Asegúrate de tener un token JWT válido de ADMIN en la variable JWT_TOKEN');
    }
  }
}

// Función para probar endpoints públicos sin autenticación
async function testPublicEndpoints() {
  console.log('\n🌐 Probando endpoints públicos...\n');

  try {
    // 1. Obtener todos los blogs (público)
    console.log('1️⃣ Obteniendo todos los blogs (público)...');
    const allBlogsResponse = await axios.get(`${BASE_URL}/blogs`);
    console.log(`✅ Encontrados ${allBlogsResponse.data.length} blogs`);

    // 2. Buscar blogs (público)
    console.log('\n2️⃣ Buscando blogs (público)...');
    const searchResponse = await axios.get(`${BASE_URL}/blogs/search?q=psicología`);
    console.log(`✅ Encontrados ${searchResponse.data.length} blogs con "psicología"`);

    console.log('\n🎉 ¡Endpoints públicos funcionando correctamente!');

  } catch (error) {
    console.error('\n❌ Error en endpoints públicos:', error.response?.data || error.message);
  }
}

// Ejecutar pruebas
async function runTests() {
  await testPublicEndpoints();
  await testBlogEndpoints();
}

runTests(); 