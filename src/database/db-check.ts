import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    entities: [],
  });

  try {
    console.log('Intentando conectar a la base de datos...');
    await AppDataSource.initialize();
    console.log('✅ Conexión exitosa a la base de datos');
    
    // Probar una consulta simple
    const result = await AppDataSource.query('SELECT NOW()');
    console.log('✅ Consulta de prueba exitosa:', result);
    
    await AppDataSource.destroy();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error);
    return false;
  }
};

testConnection().then((success) => {
  if (!success) {
    process.exit(1);
  }
  process.exit(0);
});
