import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PsicologosController } from './psicologos.controller';
import { PsicologosService } from '../gestion/services/psicologos.service';
import { DisponibilidadController } from './controllers/disponibilidad.controller';
import { DisponibilidadService } from './services/disponibilidad.service';
import { AgendaService } from './services/agenda.service';
import { Disponibilidad } from './entities/disponibilidad.entity';
import { User } from '../common/entities/user.entity';
import { Sede } from '../common/entities/sede.entity';
import { Psicologo } from '../common/entities/psicologo.entity';
import { Reserva } from '../common/entities/reserva.entity';
import { Paciente } from '../common/entities/paciente.entity';
import { Box } from '../common/entities/box.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Disponibilidad,
      User,
      Sede,
      Psicologo,
      Reserva,
      Paciente,
      Box,
    ]),
  ],
  controllers: [PsicologosController, DisponibilidadController],
  providers: [PsicologosService, DisponibilidadService, AgendaService],
  exports: [DisponibilidadService, AgendaService],
})
export class PsicologosModule {}
