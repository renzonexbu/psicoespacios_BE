import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SedesController } from './sedes.controller';
import { SedesService } from './sedes.service';
import { Sede } from '../common/entities/sede.entity';
import { Box } from '../common/entities/box.entity';
import { ReservaPsicologo } from '../common/entities/reserva-psicologo.entity';
import { Reserva } from '../common/entities/reserva.entity';
import { PackAsignacionHorario } from '../packs/entities/pack-asignacion-horario.entity';
import { Psicologo } from '../common/entities/psicologo.entity';
import { User } from '../common/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sede,
      Box,
      ReservaPsicologo,
      Reserva,
      PackAsignacionHorario,
      Psicologo,
      User,
    ]),
  ],
  controllers: [SedesController],
  providers: [SedesService],
  exports: [SedesService],
})
export class SedesModule {}
