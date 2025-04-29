import { ConnectionOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const config: ConnectionOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'psicoespacios_user',
  password: process.env.DATABASE_PASSWORD || 'psicoespacios_password',
  database: process.env.DATABASE_NAME || 'psicoespacios',
  entities: ['src/common/entities/**/*.entity.{ts,js}'],
  migrations: ['src/database/migrations/**/*.{ts,js}'],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV !== 'production',
};

export = config;