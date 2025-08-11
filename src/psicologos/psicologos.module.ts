import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
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
import { DocumentoPsicologo } from '../common/entities/documento-psicologo.entity';
import { DocumentosPsicologoController } from './controllers/documentos-psicologo.controller';
import { DocumentosPsicologoService } from './services/documentos-psicologo.service';
import { BackblazeService } from '../uploads/services/backblaze.service';

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
      DocumentoPsicologo,
    ]),
    MulterModule.register({
      dest: './uploads/temp',
    }),
  ],
  controllers: [PsicologosController, DisponibilidadController, DocumentosPsicologoController],
  providers: [PsicologosService, DisponibilidadService, AgendaService, DocumentosPsicologoService, BackblazeService],
  exports: [DisponibilidadService, AgendaService, DocumentosPsicologoService],
})
export class PsicologosModule {}
