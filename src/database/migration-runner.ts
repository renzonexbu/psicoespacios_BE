// migration-runner.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config();

// Obtener configuración de conexión a la base de datos desde variables de entorno
const getConnectionOptions = () => {
  // Si existe DATABASE_URL, usar esa configuración (para producción/Neon)
  if (process.env.DATABASE_URL) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
      migrations: [path.join(__dirname, '/migrations/*{.ts,.js}')],
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } 
        : false,
    };
  }

  // Configuración para desarrollo local
  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'psicoespacios_user',
    password: process.env.DATABASE_PASSWORD || 'psicoespacios_password',
    database: process.env.DATABASE_NAME || 'psicoespacios',
    entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
    migrations: [path.join(__dirname, '/migrations/*{.ts,.js}')],
    ssl: false,
  };
};

// Crear una nueva conexión a la base de datos
const AppDataSource = new DataSource({
  ...getConnectionOptions(),
  type: 'postgres',
  migrations: [path.join(__dirname, '/migrations/*.{ts,js}')],
  migrationsTableName: 'migrations_history'
});

// Función para ejecutar las migraciones
export async function runMigrations() {
  try {
    console.log('Iniciando conexión a la base de datos...');
    await AppDataSource.initialize();
    console.log('Conexión establecida correctamente.');
    
    console.log('Ejecutando migraciones...');
    await AppDataSource.runMigrations({ transaction: 'all' });
    console.log('Migraciones ejecutadas correctamente.');
    
    return { success: true, message: 'Migraciones completadas con éxito' };
  } catch (error) {
    console.error('Error al ejecutar migraciones:', error);
    return { success: false, message: `Error: ${error.message}` };
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Conexión cerrada.');
    }
  }
}

// Ejecutar migraciones si el archivo se ejecuta directamente
if (require.main === module) {
  runMigrations()
    .then((result) => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Error inesperado:', error);
      process.exit(1);
    });
}

export { AppDataSource };
