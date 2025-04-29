import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PerfilesDerivacionController } from './controllers/perfiles-derivacion.controller';
import { SolicitudesDerivacionController } from './controllers/solicitudes-derivacion.controller';

import { PerfilesDerivacionService } from './services/perfiles-derivacion.service';
import { SolicitudesDerivacionService } from './services/solicitudes-derivacion.service';

import { PerfilDerivacion } from '../common/entities/perfil-derivacion.entity';
import { SolicitudDerivacion } from '../common/entities/solicitud-derivacion.entity';
import { Paciente } from '../common/entities/paciente.entity';
import { User } from '../common/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PerfilDerivacion,
      SolicitudDerivacion,
      Paciente,
      User,
    ]),
  ],
  controllers: [
    PerfilesDerivacionController,
    SolicitudesDerivacionController,
  ],
  providers: [
    PerfilesDerivacionService,
    SolicitudesDerivacionService,
  ],
  exports: [
    PerfilesDerivacionService,
    SolicitudesDerivacionService,
  ],
})
export class DerivacionModule {}