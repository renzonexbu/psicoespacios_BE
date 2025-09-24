import { Module, OnModuleInit, MiddlewareConsumer, NestModule } from '@nestjs/common';
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
import { runMigrations } from './database/migration-runner';
import { PsicologosModule } from './psicologos/psicologos.module';
import { JsonParsingErrorMiddleware } from './common/middleware/json-parsing-error.middleware';
import { BlogsModule } from './blogs/blogs.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { UploadsModule } from './uploads/uploads.module';
import { BoxesModule } from './boxes/boxes.module';
import { ArriendosModule } from './arriendos/arriendos.module';
import { NotasModule } from './notas/notas.module';
import { ReservasPsicologosModule } from './reservas-psicologos/reservas-psicologos.module';
import { MailModule } from './mail/mail.module';
import { ConsolidadoModule } from './consolidado/consolidado.module';

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
      useFactory: (configService: ConfigService) => {        // Si existe DATABASE_URL, usar esa configuración (para producción/Fly.io)
        if (process.env.DATABASE_URL) {
          const config: any = {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
            migrationsRun: false, // Desactivamos para usar nuestro propio runner
            migrationsTableName: 'migrations_history',
            synchronize: false, // Más seguro en producción
            logging: process.env.NODE_ENV !== 'production',
          };

          // Solo usar SSL en producción (Fly.io/AWS)
          if (process.env.NODE_ENV === 'production') {
            config.ssl = {
              rejectUnauthorized: false,
            };
            config.extra = {
              poolSize: 20,
              connectionTimeoutMillis: 10000,
            };
          }

          return config;
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
          synchronize: true, // Desactivamos synchronize para usar migraciones
          migrationsTableName: 'migrations_history',
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
    PsicologosModule,
    BlogsModule,
    VouchersModule,
    UploadsModule,
    BoxesModule,
    ArriendosModule,
    NotasModule,
    ReservasPsicologosModule,
    MailModule,
    ConsolidadoModule,
  ],
})
export class AppModule implements OnModuleInit, NestModule {
  constructor(private configService: ConfigService) {}

  // Ejecutar migraciones al iniciar la aplicación
  async onModuleInit() {
    console.log('Ejecutando migraciones al iniciar la aplicación...');
    try {
      const result = await runMigrations();
      console.log('Resultado de migraciones:', result.message);
    } catch (error) {
      console.error('Error al ejecutar migraciones:', error);
    }
  }

  // Configuración de middlewares
  configure(consumer: MiddlewareConsumer) {
    // Aplicar el middleware de manejo de errores JSON a todas las rutas
    consumer
      .apply(JsonParsingErrorMiddleware)
      .forRoutes('*');
  }
}