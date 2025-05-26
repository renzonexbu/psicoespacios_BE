// insert-sedes.js
const { Client } = require('pg');
require('dotenv').config();

async function insertSedes() {
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

    // Añadir SSL solo si estamos en producción y no en desarrollo local
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
    await client.connect();
    console.log('Conexión establecida');

    // Limpiar la tabla sedes antes de insertar nuevos datos
    await client.query('DELETE FROM sedes');

    const sedes = [
      {
        nombre: 'PsicoEspacios Providencia',
        direccion: 'Av. Providencia 1234, Providencia',
        ciudad: 'Santiago',
        comuna: 'Providencia',
        telefono: '+56912345678',
        email: 'providencia@psicoespacios.com',
        coordenadas: { lat: -33.4289, lng: -70.6093 },
        estado: 'ACTIVA',
      },
      {
        nombre: 'PsicoEspacios Las Condes',
        direccion: 'Av. Apoquindo 4500, Las Condes',
        ciudad: 'Santiago',
        comuna: 'Las Condes',
        telefono: '+56923456789',
        email: 'lascondes@psicoespacios.com',
        coordenadas: { lat: -33.4103, lng: -70.5831 },
        estado: 'ACTIVA',
      },
      {
        nombre: 'PsicoEspacios Ñuñoa',
        direccion: 'Av. Irarrázaval 3400, Ñuñoa',
        ciudad: 'Santiago',
        comuna: 'Ñuñoa',
        telefono: '+56934567890',
        email: 'nunoa@psicoespacios.com',
        coordenadas: { lat: -33.4563, lng: -70.5934 },
        estado: 'ACTIVA',
      },
    ];

    for (const sede of sedes) {
      await client.query(
        `
        INSERT INTO sedes 
        (nombre, direccion, ciudad, comuna, telefono, email, coordenadas, estado) 
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
        [
          sede.nombre,
          sede.direccion,
          sede.ciudad,
          sede.comuna,
          sede.telefono,
          sede.email,
          JSON.stringify(sede.coordenadas),
          sede.estado,
        ],
      );
      console.log(`Sede ${sede.nombre} insertada correctamente`);
    }

    console.log('Todas las sedes han sido insertadas correctamente');
    await client.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

insertSedes();
