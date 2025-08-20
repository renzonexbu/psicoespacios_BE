import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PlanesController } from './controllers/planes.controller';
import { SuscripcionesController } from './controllers/suscripciones.controller';
import { PacientesController } from './controllers/pacientes.controller';
import { PsicologosController } from './controllers/psicologos.controller';
import { PreciosPsicologoController } from './controllers/precios-psicologo.controller';
import { PacientesMatchingController } from './controllers/pacientes-matching.controller';
import { PsicologoPacienteController } from './controllers/psicologo-paciente.controller';
import { HistorialPacienteController } from './controllers/historial-paciente.controller';
import { AcreditacionController } from './controllers/acreditacion.controller';

import { PlanesService } from './services/planes.service';
import { SuscripcionesService } from './services/suscripciones.service';
import { PacientesService } from './services/pacientes.service';
import { PsicologosService } from './services/psicologos.service';
import { PacientesMatchingService } from './services/pacientes-matching.service';
import { PsicologoPacienteService } from './services/psicologo-paciente.service';
import { HistorialPacienteService } from './services/historial-paciente.service';
import { AcreditacionService } from './services/acreditacion.service';

import { Plan } from '../common/entities/plan.entity';
import { Suscripcion } from '../common/entities/suscripcion.entity';
import { Paciente } from '../common/entities/paciente.entity';
import { Psicologo } from '../common/entities/psicologo.entity';
import { FichaSesion } from '../common/entities/ficha-sesion.entity';
import { User } from '../common/entities/user.entity';
import { Reserva } from '../common/entities/reserva.entity';
import { ReservaPsicologo } from '../common/entities/reserva-psicologo.entity';
import { Disponibilidad } from '../psicologos/entities/disponibilidad.entity';
import { HistorialPaciente } from '../common/entities/historial-paciente.entity';
import { Acreditacion } from '../common/entities/acreditacion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plan,
      Suscripcion,
      Paciente,
      Psicologo,
      FichaSesion,
      User,
      Reserva,
      ReservaPsicologo,
      Disponibilidad,
      HistorialPaciente,
      Acreditacion,
    ]),
  ],
  controllers: [
    PlanesController,
    SuscripcionesController,
    PacientesController,
    PsicologosController,
    PreciosPsicologoController,
    PacientesMatchingController,
    PsicologoPacienteController,
    HistorialPacienteController,
    AcreditacionController,
  ],
  providers: [
    PlanesService,
    SuscripcionesService,
    PacientesService,
    PsicologosService,
    PacientesMatchingService,
    PsicologoPacienteService,
    HistorialPacienteService,
    AcreditacionService,
  ],
  exports: [
    PlanesService,
    SuscripcionesService,
    PacientesService,
    PsicologosService,
    PacientesMatchingService,
  ],
})
export class GestionModule {}