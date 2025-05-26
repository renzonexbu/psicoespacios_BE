// check-and-insert-sedes.js
const { Client } = require('pg');
require('dotenv').config();

async function main() {
  // Usando credenciales específicas para asegurar la conexión
  const config = {
    host: 'localhost',
    port: 5432,
    database: 'psicoespacios',
    user: 'psicoespacios_user',
    password: 'psicoespacios_password',
  };

  const client = new Client(config);

  try {
    await client.connect();
    console.log('Conexión establecida correctamente');

    // Verificar las tablas existentes
    const tables = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
    );
    console.log('Tablas existentes:');
    tables.rows.forEach((table) => console.log(`- ${table.table_name}`));

    // Verificar si hay datos en la tabla sedes
    const sedesResult = await client.query('SELECT COUNT(*) FROM sedes');
    console.log(
      `\nTotal de registros en la tabla sedes: ${sedesResult.rows[0].count}`,
    );

    if (parseInt(sedesResult.rows[0].count) === 0) {
      console.log('\nInsertando datos en la tabla sedes...');

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
          `INSERT INTO sedes 
           (nombre, direccion, ciudad, comuna, telefono, email, coordenadas, estado, "createdAt", "updatedAt") 
           VALUES 
           ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
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

      // Verificar la inserción
      const newResult = await client.query('SELECT * FROM sedes');
      console.log('\nRegistros en la tabla sedes después de la inserción:');
      console.table(newResult.rows);
    } else {
      // Mostrar los datos existentes
      const existingData = await client.query('SELECT * FROM sedes');
      console.log('\nDatos existentes en la tabla sedes:');
      console.table(existingData.rows);
    }

    await client.end();
    console.log('\nConexión cerrada');
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
