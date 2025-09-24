import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SedesController } from './sedes.controller';
import { SedesService } from './sedes.service';
import { Sede } from '../common/entities/sede.entity';
import { Box } from '../common/entities/box.entity';
import { ReservaPsicologo } from '../common/entities/reserva-psicologo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sede, Box, ReservaPsicologo])],
  controllers: [SedesController],
  providers: [SedesService],
  exports: [SedesService],
})
export class SedesModule {}