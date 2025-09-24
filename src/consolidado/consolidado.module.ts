import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsolidadoController } from './consolidado.controller';
import { ConsolidadoService } from './consolidado.service';
import { Reserva } from '../common/entities/reserva.entity';
import { Box } from '../common/entities/box.entity';
import { User } from '../common/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reserva, Box, User])
  ],
  controllers: [ConsolidadoController],
  providers: [ConsolidadoService],
  exports: [ConsolidadoService]
})
export class ConsolidadoModule {}

