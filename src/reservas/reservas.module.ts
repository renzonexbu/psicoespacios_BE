import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservasController } from './reservas.controller';
import { ReservasService } from './reservas.service';
import { Reserva } from '../common/entities/reserva.entity';
import { Box } from '../common/entities/box.entity';
import { User } from '../common/entities/user.entity';
import { PackAsignacion } from '../packs/entities/pack-asignacion.entity';
import { PackHora } from '../packs/entities/pack-hora.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reserva, Box, User, PackAsignacion, PackHora])],
  controllers: [ReservasController],
  providers: [ReservasService],
  exports: [ReservasService],
})
export class ReservasModule {}