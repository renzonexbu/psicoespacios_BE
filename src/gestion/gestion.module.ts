import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PlanesController } from './controllers/planes.controller';
import { SuscripcionesController } from './controllers/suscripciones.controller';
import { PacientesController } from './controllers/pacientes.controller';

import { PlanesService } from './services/planes.service';
import { SuscripcionesService } from './services/suscripciones.service';
import { PacientesService } from './services/pacientes.service';

import { Plan } from '../common/entities/plan.entity';
import { Suscripcion } from '../common/entities/suscripcion.entity';
import { Paciente } from '../common/entities/paciente.entity';
import { FichaSesion } from '../common/entities/ficha-sesion.entity';
import { User } from '../common/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plan,
      Suscripcion,
      Paciente,
      FichaSesion,
      User,
    ]),
  ],
  controllers: [
    PlanesController,
    SuscripcionesController,
    PacientesController,
  ],
  providers: [
    PlanesService,
    SuscripcionesService,
    PacientesService,
  ],
  exports: [
    PlanesService,
    SuscripcionesService,
    PacientesService,
  ],
})
export class GestionModule {}