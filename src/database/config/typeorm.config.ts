import { DataSource, DataSourceOptions as TypeORMDataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

// Manejo específico de la conexión a Neon DB
const getConnectionOptions = (): TypeORMDataSourceOptions => {
  // Si DATABASE_URL existe, tiene prioridad
  if (process.env.DATABASE_URL) {
    console.log('Usando DATABASE_URL para la conexión');
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: ['dist/src/common/entities/**/*.entity.{ts,js}', 'dist/common/entities/**/*.entity.{ts,js}'],
      migrations: ['dist/src/database/migrations/**/*.{ts,js}', 'dist/database/migrations/**/*.{ts,js}'],
      synchronize: false,
      ssl: {
        rejectUnauthorized: false,
      },
      extra: {
        poolSize: 20,
        connectionTimeoutMillis: 10000,
      },
      logging: process.env.NODE_ENV !== 'production',
    };
  }
  
  // Si tenemos las variables individuales de DB_
  if (process.env.DB_HOST && process.env.DB_USERNAME && process.env.DB_PASSWORD && process.env.DB_DATABASE) {
    console.log(`Usando variables individuales para la conexión a ${process.env.DB_HOST}`);
    return {
      type: 'postgres',
      host: process.env.DB_HOST,
      port: 5432, // Puerto por defecto de PostgreSQL
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: ['dist/src/common/entities/**/*.entity.{ts,js}', 'dist/common/entities/**/*.entity.{ts,js}'],
      migrations: ['dist/src/database/migrations/**/*.{ts,js}', 'dist/database/migrations/**/*.{ts,js}'],
      synchronize: false,
      ssl: {
        rejectUnauthorized: false,
      },
      extra: {
        poolSize: 20,
        connectionTimeoutMillis: 10000,
      },
      logging: process.env.NODE_ENV !== 'production',
    };
  }
  
  // Configuración para desarrollo local si nada de lo anterior está definido
  console.log('Usando configuración local para desarrollo');
  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USER || 'psicoespacios_user',
    password: process.env.DATABASE_PASSWORD || 'psicoespacios_password',
    database: process.env.DATABASE_NAME || 'psicoespacios',
    entities: ['dist/src/common/entities/**/*.entity.{ts,js}', 'dist/common/entities/**/*.entity.{ts,js}'],
    migrations: ['dist/src/database/migrations/**/*.{ts,js}', 'dist/database/migrations/**/*.{ts,js}'],
    synchronize: false,
    logging: process.env.NODE_ENV !== 'production',
  };
};

const config: TypeORMDataSourceOptions = getConnectionOptions();
const dataSource = new DataSource(config);

export default dataSource;
module.exports = dataSource;