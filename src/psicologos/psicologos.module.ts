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
import { ReservaPsicologo } from '../common/entities/reserva-psicologo.entity';
import { Paciente } from '../common/entities/paciente.entity';
import { Box } from '../common/entities/box.entity';
import { DocumentoPsicologo } from '../common/entities/documento-psicologo.entity';
import { DocumentosPsicologoController } from './controllers/documentos-psicologo.controller';
import { DocumentosPsicologoService } from './services/documentos-psicologo.service';
import { BackblazeService } from '../uploads/services/backblaze.service';
import { CrearPacienteService } from './services/crear-paciente.service';
import { TransferirPacienteService } from './services/transferir-paciente.service';
import { MailService } from '../mail/mail.service';

// Sistema de Matching
import { MatchingController } from './controllers/matching.controller';
import { MatchingService } from './services/matching.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Disponibilidad,
      User,
      Sede,
      Psicologo,
      Reserva,
      ReservaPsicologo,
      Paciente,
      Box,
      DocumentoPsicologo,
    ]),
    MulterModule.register({
      dest: './uploads/temp',
    }),
  ],
  controllers: [
    PsicologosController, 
    DisponibilidadController, 
    DocumentosPsicologoController,
    MatchingController
  ],
  providers: [
    PsicologosService, 
    DisponibilidadService, 
    AgendaService, 
    DocumentosPsicologoService, 
    BackblazeService,
    CrearPacienteService,
    TransferirPacienteService,
    MailService,
    MatchingService
  ],
  exports: [
    DisponibilidadService, 
    AgendaService, 
    DocumentosPsicologoService,
    MatchingService
  ],
})
export class PsicologosModule {}
