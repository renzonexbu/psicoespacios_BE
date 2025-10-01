import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoxesController } from './boxes.controller';
import { BoxesService } from './boxes.service';
import { BoxReservationController } from './controllers/box-reservation.controller';
import { BoxReservationService } from './services/box-reservation.service';
import { Box } from '../common/entities/box.entity';
import { Sede } from '../common/entities/sede.entity';
import { Reserva } from '../common/entities/reserva.entity';
import { User } from '../common/entities/user.entity';
import { PackAsignacion } from '../packs/entities/pack-asignacion.entity';
import { PackHora } from '../packs/entities/pack-hora.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Box, Sede, Reserva, User, PackAsignacion, PackHora])],
  controllers: [BoxesController, BoxReservationController],
  providers: [BoxesService, BoxReservationService],
  exports: [BoxesService, BoxReservationService],
})
export class BoxesModule {} 