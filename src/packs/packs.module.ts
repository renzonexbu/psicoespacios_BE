import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PacksController } from './packs.controller';
import { PacksService } from './packs.service';
import { PackHora } from './entities/pack-hora.entity';
import { PackAsignacion } from './entities/pack-asignacion.entity';
import { PackAsignacionHorario } from './entities/pack-asignacion-horario.entity';
import { PackPagoMensual } from './entities/pack-pago-mensual.entity';
import { Reserva } from '../common/entities/reserva.entity';
import { Box } from '../common/entities/box.entity';
import { User } from '../common/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PackHora, PackAsignacion, PackAsignacionHorario, PackPagoMensual, Reserva, Box, User])],
  controllers: [PacksController],
  providers: [PacksService],
  exports: [PacksService],
})
export class PacksModule {}




