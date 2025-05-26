const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  // Configuración explícita para desarrollo local
  const config = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'psicoespacios',
    user: process.env.DATABASE_USERNAME || 'psicoespacios_user',
    password: process.env.DATABASE_PASSWORD || 'psicoespacios_password',
  };

  // Usar DATABASE_URL si está definida (para producción)
  if (process.env.DATABASE_URL) {
    console.log('Usando DATABASE_URL para conectar a la base de datos');
    config.connectionString = process.env.DATABASE_URL;

    // Añadir SSL solo si estamos en producción
    if (
      (process.env.DATABASE_URL.startsWith('postgres://') ||
        process.env.DATABASE_URL.startsWith('postgresql://')) &&
      process.env.NODE_ENV === 'production'
    ) {
      config.ssl = {
        rejectUnauthorized: false,
      };
    }
  }

  const client = new Client(config);

  try {
    console.log('Intentando conectar a la base de datos...');
    await client.connect();
    console.log('✅ Conexión establecida');

    const res = await client.query('SELECT NOW()');
    console.log('✅ Consulta ejecutada exitosamente:', res.rows[0]);

    await client.end();
    console.log('✅ Conexión cerrada correctamente');
    return true;
  } catch (err) {
    console.error('❌ Error al conectar:', err.message);
    return false;
  }
}

// Ejecutar directamente si se llama desde la línea de comandos
if (require.main === module) {
  testConnection().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

// Exportar la función para que pueda ser utilizada por otros scripts
module.exports = { testConnection };
