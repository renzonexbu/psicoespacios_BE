import { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const config: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['dist/common/entities/**/*.entity.{ts,js}'],
  migrations: ['dist/database/migrations/**/*.{ts,js}'],
  synchronize: false, // Es más seguro mantenerlo en false y usar migraciones
  ssl: {
    rejectUnauthorized: false, // Necesario para Neon
  },
  extra: {
    poolSize: 20, // Ajusta según tus necesidades
    connectionTimeoutMillis: 10000,
  },
  logging: process.env.NODE_ENV !== 'production',
  // Para desarrollo local, usa estas configuraciones alternativas si no hay DATABASE_URL
  ...((!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production') && {
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USER || 'psicoespacios_user',
    password: process.env.DATABASE_PASSWORD || 'psicoespacios_password',
    database: process.env.DATABASE_NAME || 'psicoespacios',
  }),
};

export = config;