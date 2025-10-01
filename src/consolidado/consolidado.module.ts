import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsolidadoController } from './consolidado.controller';
import { ConsolidadoService } from './consolidado.service';
import { Reserva } from '../common/entities/reserva.entity';
import { Box } from '../common/entities/box.entity';
import { User } from '../common/entities/user.entity';
import { Suscripcion } from '../common/entities/suscripcion.entity';
import { Plan } from '../common/entities/plan.entity';
import { PackHora } from '../packs/entities/pack-hora.entity';
import { PackAsignacion } from '../packs/entities/pack-asignacion.entity';
import { PackPagoMensual } from '../packs/entities/pack-pago-mensual.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reserva, Box, User, Suscripcion, Plan, PackHora, PackAsignacion, PackPagoMensual])
  ],
  controllers: [ConsolidadoController],
  providers: [ConsolidadoService],
  exports: [ConsolidadoService]
})
export class ConsolidadoModule {}

