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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: process.env.NODE_ENV !== 'production',
        logging: process.env.NODE_ENV !== 'production',
      }),
    }),
    AuthModule,
    SedesModule,
    ReservasModule,
    GestionModule,
    DerivacionModule,
    PagosModule,
    ReportesModule,
    AdminModule,
  ],
})
export class AppModule {}
