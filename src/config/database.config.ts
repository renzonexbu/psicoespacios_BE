import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USER || 'psicoespacios_user',
  password: process.env.DATABASE_PASSWORD || 'psicoespacios_password',
  database: process.env.DATABASE_NAME || 'psicoespacios',
}));