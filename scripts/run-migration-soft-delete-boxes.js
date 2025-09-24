const { DataSource } = require('typeorm');
const { config } = require('dotenv');

// Cargar variables de entorno
config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'psicoespacios',
  entities: ['src/common/entities/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: true,
});

async function runMigration() {
  try {
    await AppDataSource.initialize();
    console.log('Conexión a la base de datos establecida');

    // Ejecutar la migración específica
    const migration = new (require('../src/database/migrations/AddSoftDeleteToBoxes1720800015000'))();
    
    console.log('Ejecutando migración: AddSoftDeleteToBoxes...');
    await migration.up(AppDataSource.createQueryRunner());
    
    console.log('Migración ejecutada exitosamente');
    console.log('Campo deletedAt agregado a la tabla boxes');
    
  } catch (error) {
    console.error('Error ejecutando la migración:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Conexión a la base de datos cerrada');
    }
  }
}

runMigration(); 