import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { SedesModule } from './sedes/sedes.module';
import { ReservasModule } from './reservas/reservas.module';
import { GestionModule } from './gestion/gestion.module';
import { DerivacionModule } from './derivacion/derivacion.module';
import { PagosModule } from './pagos/pagos.module';
import { ReportesModule } from './reportes/reportes.module';
import { AdminModule } from './admin/admin.module';
import { ContactoModule } from './contacto/contacto.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      validate: (config: Record<string, any>) => {
        console.log('Validando variables de entorno...');
        console.log('NODE_ENV:', process.env.NODE_ENV);
        console.log('DATABASE_URL configurada:', !!process.env.DATABASE_URL);
        return config;
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Si existe DATABASE_URL, usar esa configuración (para producción/Neon)
        if (process.env.DATABASE_URL) {
          return {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
            migrationsRun: true, // Ejecutar migraciones automáticamente
            migrationsTableName: 'migrations',
            synchronize: false, // Más seguro en producción
            ssl: {
              rejectUnauthorized: false, // Necesario para Neon
            },
            extra: {
              poolSize: 20,
              connectionTimeoutMillis: 10000,
            },
            logging: process.env.NODE_ENV !== 'production',
          };
        }

        // Configuración para desarrollo local
        return {
          type: 'postgres',
          host: configService.get('database.host'),
          port: configService.get('database.port'),
          username: configService.get('database.username'),
          password: configService.get('database.password'),
          database: configService.get('database.database'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: process.env.NODE_ENV !== 'production',
          logging: process.env.NODE_ENV !== 'production',
        };
      },
    }),
    AuthModule,
    SedesModule,
    ReservasModule,
    GestionModule,
    DerivacionModule,
    PagosModule,
    ReportesModule,
    AdminModule,
    ContactoModule,
    HealthModule,
  ],
})
export class AppModule {}